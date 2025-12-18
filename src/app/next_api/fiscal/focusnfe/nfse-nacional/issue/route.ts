import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type Environment = 'homologacao' | 'producao';

function getBaseUrl(environment: Environment): string {
  return environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, payload, ref } = body as {
      tenant_id?: string;
      payload?: any;
      ref?: string;
    };

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400 });
    }

    if (!payload) {
      return NextResponse.json({ error: 'payload é obrigatório' }, { status: 400 });
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('environment, api_token, enabled, focus_empresa_id')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: integrationError.message }, { status: 400 });
    }

    if (!integration || !integration.enabled) {
      return NextResponse.json({ 
        error: 'Integração FocusNFe não configurada ou desabilitada para este tenant',
        details: 'Configure a integração na página de Configuração Fiscal antes de emitir documentos'
      }, { status: 400 });
    }

    // Validação: Verificar se empresa foi provisionada
    if (!integration.focus_empresa_id) {
      return NextResponse.json({ 
        error: 'Empresa não provisionada na FocusNFe',
        details: 'É necessário provisionar a empresa na FocusNFe antes de emitir documentos. Acesse a página de Configuração Fiscal e clique em "Provisionar Empresa"'
      }, { status: 400 });
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
      return NextResponse.json({ error: 'Erro ao criar fiscal_document', details: insertError?.message }, { status: 400 });
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
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        fiscal_document_id: fiscalDoc.id,
        ref: finalRef,
        http_status: responseStatus,
        provider_response: responseBody,
      });
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
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500 });
  }
}
