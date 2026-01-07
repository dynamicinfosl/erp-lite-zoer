import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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

function getBaseUrl(environment: Environment): string {
  return environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500, headers: jsonHeaders }
      );
    }
    
    const body = await request.json();
    const { tenant_id, payload, ref } = body as {
      tenant_id?: string;
      payload?: any;
      ref?: string;
    };

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    if (!payload) {
      return NextResponse.json({ error: 'payload é obrigatório' }, { status: 400, headers: jsonHeaders });
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('environment, api_token, enabled, focus_empresa_id')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: integrationError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!integration || !integration.enabled) {
      return NextResponse.json({ 
        error: 'Integração FocusNFe não configurada ou desabilitada para este tenant',
        details: 'Configure a integração na página de Configuração Fiscal antes de emitir documentos'
      }, { status: 400, headers: jsonHeaders });
    }

    // Validação: Verificar se empresa foi provisionada
    // TEMPORÁRIO: Permitir emissão mesmo sem focus_empresa_id (enquanto investigamos endpoint)
    if (!integration.focus_empresa_id) {
      console.warn('⚠️ Emitindo NFSe Nacional sem focus_empresa_id - empresa pode não estar provisionada na FocusNFe');
      console.warn('⚠️ Certifique-se de que o certificado foi enviado manualmente no painel da FocusNFe');
    }

    const environment = (integration.environment as Environment) || 'homologacao';
    const baseUrl = getBaseUrl(environment);

    const finalRef = (ref && String(ref).trim()) ? String(ref).trim() : `fdn_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

    const { data: fiscalDoc, error: insertError } = await supabaseAdmin
      .from('fiscal_documents')
      .insert({
        tenant_id,
        provider: 'focusnfe',
        doc_type: 'nfse_nacional',
        ref: finalRef,
        status: 'submitted',
        payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, tenant_id, doc_type, ref, status, created_at')
      .single();

    if (insertError || !fiscalDoc) {
      return NextResponse.json({ error: 'Erro ao criar fiscal_document', details: insertError?.message }, { status: 400, headers: jsonHeaders });
    }

    const url = `${baseUrl}/v2/nfsen?ref=${encodeURIComponent(finalRef)}`;
    const token = integration.api_token;

    let responseStatus = 0;
    let responseBody: any = null;

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      responseStatus = resp.status;
      const text = await resp.text();
      try {
        responseBody = text ? JSON.parse(text) : null;
      } catch {
        responseBody = { raw: text };
      }

      const nextStatus = resp.ok ? 'processing' : 'error';

      await supabaseAdmin
        .from('fiscal_documents')
        .update({
          status: nextStatus,
          provider_response: {
            http_status: responseStatus,
            body: responseBody,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', fiscalDoc.id);

      if (!resp.ok) {
        return NextResponse.json(
          {
            error: 'Erro ao enviar NFSe Nacional para FocusNFe',
            http_status: responseStatus,
            provider_error: responseBody,
            fiscal_document_id: fiscalDoc.id,
            ref: finalRef,
          },
          { status: 400, headers: jsonHeaders }
        );
      }

      return NextResponse.json({
        success: true,
        fiscal_document_id: fiscalDoc.id,
        ref: finalRef,
        http_status: responseStatus,
        provider_response: responseBody,
      }, { headers: jsonHeaders });
    } catch (err: any) {
      await supabaseAdmin
        .from('fiscal_documents')
        .update({
          status: 'error',
          provider_response: {
            error: err?.message || String(err),
            http_status: responseStatus,
            body: responseBody,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', fiscalDoc.id);

      return NextResponse.json(
        { error: 'Falha ao comunicar com FocusNFe', details: err?.message || String(err), fiscal_document_id: fiscalDoc.id },
        { status: 500, headers: jsonHeaders }
      );
    }
  } catch (error: any) {
      return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500, headers: jsonHeaders });
  }
}
