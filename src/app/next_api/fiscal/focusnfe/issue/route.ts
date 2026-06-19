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

type DocType = 'nfe' | 'nfce' | 'nfse';

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
    const { tenant_id, doc_type, payload, ref } = body as {
      tenant_id?: string;
      doc_type?: DocType;
      payload?: any;
      ref?: string;
    };

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    if (doc_type !== 'nfe' && doc_type !== 'nfce' && doc_type !== 'nfse') {
      return NextResponse.json({ error: 'doc_type inválido (use nfe, nfce ou nfse)' }, { status: 400, headers: jsonHeaders });
    }

    if (!payload) {
      return NextResponse.json({ error: 'payload é obrigatório' }, { status: 400, headers: jsonHeaders });
    }

    // 1. Buscar a configuração global (para obter o api_token e environment)
    const { data: globalConfig, error: globalError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('environment, api_token, enabled')
      .eq('tenant_id', '00000000-0000-0000-0000-000000000000')
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (globalError) {
      return NextResponse.json({ error: 'Erro ao buscar configuração global', details: globalError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!globalConfig || !globalConfig.enabled || !globalConfig.api_token) {
      return NextResponse.json({ error: 'Emissão fiscal global desabilitada ou credenciais do ERP ausentes.' }, { status: 400, headers: jsonHeaders });
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('enabled, focus_empresa_id, focus_token_homologacao, focus_token_producao, cnpj_emitente, cert_cnpj, nfe_serie, nfce_serie')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: integrationError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!integration || !integration.enabled) {
      return NextResponse.json({ 
        error: 'Integração FocusNFe não configurada ou desabilitada para este tenant',
        details: 'Acesse a página de Configuração Fiscal antes de emitir documentos'
      }, { status: 400, headers: jsonHeaders });
    }

    // Validação: Verificar se empresa foi provisionada
    if (!integration.focus_empresa_id) {
      return NextResponse.json({ 
        error: 'Empresa não provisionada na FocusNFe',
        details: 'É necessário provisionar a empresa na FocusNFe antes de emitir documentos. Acesse a página de Configuração Fiscal e clique em "Ativar Faturamento"'
      }, { status: 400, headers: jsonHeaders });
    }

    const environment = (globalConfig.environment as Environment) || 'homologacao';
    const baseUrl = getBaseUrl(environment);

    const finalRef = (ref && String(ref).trim()) ? String(ref).trim() : `fd_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

    // Injetar o CNPJ do emitente no payload se disponível e não preenchido
    const issuerCnpj = (integration.cnpj_emitente || integration.cert_cnpj || '').replace(/\D/g, '');
    if (issuerCnpj && payload && typeof payload === 'object' && !payload.cnpj_emitente) {
      payload.cnpj_emitente = issuerCnpj;
    }

    // Injetar a série da nota se disponível e não preenchida no payload
    if (payload && typeof payload === 'object' && !payload.serie) {
      if (doc_type === 'nfe') {
        payload.serie = integration.nfe_serie || '1';
      } else if (doc_type === 'nfce') {
        payload.serie = integration.nfce_serie || '1';
      }
    }

    const { data: fiscalDoc, error: insertError } = await supabaseAdmin
      .from('fiscal_documents')
      .insert({
        tenant_id,
        provider: 'focusnfe',
        doc_type,
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

    const url = `${baseUrl}/v2/${doc_type}?ref=${encodeURIComponent(finalRef)}`;
    const token = environment === 'producao'
      ? (integration.focus_token_producao || globalConfig.api_token)
      : (integration.focus_token_homologacao || globalConfig.api_token);

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

      const nextStatus = resp.ok ? (doc_type === 'nfce' ? 'authorized_or_error' : 'processing') : 'error';

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
            error: 'Erro ao enviar documento para FocusNFe',
            http_status: responseStatus,
            provider_error: responseBody,
            fiscal_document_id: fiscalDoc.id,
            ref: finalRef,
          },
          { status: 400, headers: jsonHeaders }
        );
      }

      if (responseBody) {
        const path = responseBody.caminho_danfe || responseBody.caminho_pdf || responseBody.caminho_pdf_nota_fiscal;
        if (path) {
          responseBody.pdf_url = path.startsWith('http') ? path : `${baseUrl}${path}`;
        }
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
