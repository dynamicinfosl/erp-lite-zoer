import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

// Função para obter o cliente Supabase
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getFocusDocType(docType: string): string {
  if (docType === 'nfse_nacional') return 'nfsen';
  return docType; // nfe, nfce, nfse
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
    const { fiscal_document_id, justificativa } = body as {
      fiscal_document_id?: string;
      justificativa?: string;
    };

    if (!fiscal_document_id || !isUuid(fiscal_document_id)) {
      return NextResponse.json({ error: 'fiscal_document_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    if (!justificativa || justificativa.trim().length < 15) {
      return NextResponse.json({ error: 'A justificativa de cancelamento deve ter no mínimo 15 caracteres' }, { status: 400, headers: jsonHeaders });
    }

    // 1. Carregar documento fiscal do banco de dados
    const { data: fiscalDoc, error: docError } = await supabaseAdmin
      .from('fiscal_documents')
      .select('id, tenant_id, doc_type, ref, status, provider')
      .eq('id', fiscal_document_id)
      .single();

    if (docError || !fiscalDoc) {
      return NextResponse.json({ error: 'Documento fiscal não encontrado', details: docError?.message }, { status: 404, headers: jsonHeaders });
    }

    if (fiscalDoc.provider !== 'focusnfe') {
      return NextResponse.json({ error: 'Operação suportada apenas para notas emitidas via Focus NFe' }, { status: 400, headers: jsonHeaders });
    }

    if (fiscalDoc.status === 'cancelado') {
      return NextResponse.json({ success: true, message: 'Documento já está cancelado' }, { headers: jsonHeaders });
    }

    // 2. Carregar a configuração global (para obter o api_token e environment)
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

    // 3. Carregar integração fiscal do inquilino
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('enabled, focus_token_homologacao, focus_token_producao')
      .eq('tenant_id', fiscalDoc.tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: integrationError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!integration || !integration.enabled) {
      return NextResponse.json({ error: 'Integração FocusNFe não configurada ou desabilitada para este inquilino' }, { status: 400, headers: jsonHeaders });
    }

    // 4. Chamar API de cancelamento da Focus NFe
    const environment = globalConfig.environment || 'homologacao';
    const baseUrl = environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
    
    const focusDocType = getFocusDocType(fiscalDoc.doc_type);
    const url = `${baseUrl}/v2/${focusDocType}/${encodeURIComponent(fiscalDoc.ref)}?justificativa=${encodeURIComponent(justificativa.trim())}`;
    
    console.log(`🚀 Solicitando cancelamento de ${fiscalDoc.doc_type} (ref: ${fiscalDoc.ref}):`, url);

    let responseStatus = 0;
    let responseBody: any = null;

    const token = environment === 'producao'
      ? (integration.focus_token_producao || globalConfig.api_token)
      : (integration.focus_token_homologacao || globalConfig.api_token);

    try {
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
        },
        body: JSON.stringify({ justificativa: justificativa.trim() }),
      });

      responseStatus = resp.status;
      const text = await resp.text();
      try {
        responseBody = text ? JSON.parse(text) : null;
      } catch {
        responseBody = { raw: text };
      }

      console.log(`📥 Resposta Focus NFe cancelamento (${responseStatus}):`, responseBody);

      // No Focus NFe, a resposta pode ser síncrona ou assíncrona.
      // Se for síncrono de sucesso, o status é retornado como "cancelado"
      const providerStatus = responseBody?.status || '';
      const isSuccess = resp.ok || providerStatus === 'cancelado' || providerStatus === 'cancelada';

      if (isSuccess) {
        const nextStatus = 'cancelado';
        const patch: any = {
          status: nextStatus,
          provider_response: {
            http_status: responseStatus,
            body: responseBody,
          },
          updated_at: new Date().toISOString(),
        };

        // Se retornar caminho de XML de cancelamento, salvar no banco
        if (responseBody?.caminho_xml_cancelamento) {
          patch.caminho_xml = String(responseBody.caminho_xml_cancelamento);
        }

        // Atualizar documento no banco
        await supabaseAdmin
          .from('fiscal_documents')
          .update(patch)
          .eq('id', fiscal_document_id);

        // Salvar evento no histórico
        await supabaseAdmin
          .from('fiscal_document_events')
          .insert({
            fiscal_document_id,
            tenant_id: fiscalDoc.tenant_id,
            event_type: 'cancellation_request',
            event_status: nextStatus,
            event_data: { justificativa, responseBody },
            provider_response: responseBody,
            created_at: new Date().toISOString(),
          });

        return NextResponse.json({
          success: true,
          status: nextStatus,
          provider_response: responseBody,
        }, { headers: jsonHeaders });
      }

      // Se falhar
      // Registrar evento de erro
      await supabaseAdmin
        .from('fiscal_document_events')
        .insert({
          fiscal_document_id,
          tenant_id: fiscalDoc.tenant_id,
          event_type: 'cancellation_failed',
          event_status: fiscalDoc.status,
          event_data: { justificativa, error: responseBody },
          provider_response: responseBody,
          created_at: new Date().toISOString(),
        });

      return NextResponse.json({
        error: 'Erro retornado pela FocusNFe ao cancelar documento',
        http_status: responseStatus,
        provider_error: responseBody,
      }, { status: 400, headers: jsonHeaders });

    } catch (fetchErr: any) {
      console.error('❌ Erro na comunicação de cancelamento com Focus NFe:', fetchErr);
      
      await supabaseAdmin
        .from('fiscal_document_events')
        .insert({
          fiscal_document_id,
          tenant_id: fiscalDoc.tenant_id,
          event_type: 'cancellation_failed',
          event_status: fiscalDoc.status,
          event_data: { justificativa, error: fetchErr?.message || String(fetchErr) },
          created_at: new Date().toISOString(),
        });

      return NextResponse.json({
        error: 'Falha na comunicação com a API FocusNFe',
        details: fetchErr?.message || String(fetchErr),
      }, { status: 500, headers: jsonHeaders });
    }

  } catch (err: any) {
    console.error('❌ Erro interno no cancelamento:', err);
    return NextResponse.json({ error: 'Erro interno do servidor', details: err?.message }, { status: 500, headers: jsonHeaders });
  }
}
