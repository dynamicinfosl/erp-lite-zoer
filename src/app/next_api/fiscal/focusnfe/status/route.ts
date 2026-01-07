import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Headers JSON padrão
const jsonHeaders = {
  'Content-Type': 'application/json',
};

// Função para obter o cliente Supabase (com fallback)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

type Environment = 'homologacao' | 'producao';

type DocType = 'nfe' | 'nfce' | 'nfse';

function getBaseUrl(environment: Environment): string {
  return environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const fiscal_document_id = searchParams.get('fiscal_document_id');
    const completa = searchParams.get('completa');

    if (!fiscal_document_id || !isUuid(fiscal_document_id)) {
      return NextResponse.json({ error: 'fiscal_document_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    const { data: fiscalDoc, error: docError } = await supabaseAdmin
      .from('fiscal_documents')
      .select('id, tenant_id, doc_type, ref, status')
      .eq('id', fiscal_document_id)
      .single();

    if (docError || !fiscalDoc) {
      return NextResponse.json({ error: 'Documento fiscal não encontrado', details: docError?.message }, { status: 404, headers: jsonHeaders });
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('environment, api_token, enabled')
      .eq('tenant_id', fiscalDoc.tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: integrationError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!integration || !integration.enabled) {
      return NextResponse.json({ error: 'Integração FocusNFe não configurada ou desabilitada para este tenant' }, { status: 400, headers: jsonHeaders });
    }

    const environment = (integration.environment as Environment) || 'homologacao';
    const baseUrl = getBaseUrl(environment);

    const docType = fiscalDoc.doc_type as DocType;
    const url = `${baseUrl}/v2/${docType}/${encodeURIComponent(fiscalDoc.ref)}${completa ? `?completa=${encodeURIComponent(completa)}` : ''}`;

    const token = integration.api_token;

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      },
    });

    const http_status = resp.status;
    const text = await resp.text();

    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }

    let nextStatus = fiscalDoc.status;
    if (resp.ok) {
      const providerStatus = body?.status;
      if (typeof providerStatus === 'string' && providerStatus.trim()) {
        nextStatus = providerStatus;
      }

      const patch: any = {
        status: nextStatus,
        provider_response: {
          http_status,
          body,
        },
        updated_at: new Date().toISOString(),
      };

      if (body?.numero) patch.numero = String(body.numero);
      if (body?.serie) patch.serie = String(body.serie);
      if (body?.chave_nfe) patch.chave = String(body.chave_nfe);
      if (body?.chave) patch.chave = String(body.chave);

      if (body?.caminho_xml_nota_fiscal) patch.caminho_xml = String(body.caminho_xml_nota_fiscal);
      if (body?.caminho_danfe) patch.caminho_pdf = String(body.caminho_danfe);

      await supabaseAdmin.from('fiscal_documents').update(patch).eq('id', fiscal_document_id);

      // Salvar evento no histórico
      await supabaseAdmin
        .from('fiscal_document_events')
        .insert({
          fiscal_document_id,
          tenant_id: fiscalDoc.tenant_id,
          event_type: 'status_check',
          event_status: nextStatus,
          event_data: { manual_check: true },
          provider_response: body,
          created_at: new Date().toISOString(),
        });

      return NextResponse.json({ success: true, data: { ...fiscalDoc, status: nextStatus }, http_status, provider_response: body }, { headers: jsonHeaders });
    }

    await supabaseAdmin
      .from('fiscal_documents')
      .update({
        provider_response: {
          http_status,
          body,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fiscal_document_id);

    return NextResponse.json(
      { error: 'Erro ao consultar documento na FocusNFe', http_status, provider_error: body, data: fiscalDoc },
      { status: 400, headers: jsonHeaders }
    );
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500, headers: jsonHeaders });
  }
}
