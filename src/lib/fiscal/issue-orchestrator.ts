import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { NotaAsClient, mapGenericPayloadToNotaAsNFe, mapGenericPayloadToNotaAsNFSe } from './notaas-client';

export type FiscalProvider = 'focusnfe' | 'notaas';
export type DocType = 'nfe' | 'nfce' | 'nfse';
export type Environment = 'homologacao' | 'producao';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getFocusBaseUrl(environment: Environment): string {
  return environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
}

export interface IssueOptions {
  tenant_id: string;
  doc_type: DocType;
  payload: any;
  ref?: string;
}

export interface IssueResult {
  success: boolean;
  provider: FiscalProvider;
  fallback_used: boolean;
  fiscal_document_id?: string;
  ref: string;
  response_data?: any;
  error?: string;
  details?: any;
}

/**
 * Emite documento fiscal utilizando o provedor primário configurado,
 * acionando o provedor secundário de Fallback se ativado e necessário.
 */
export async function emitFiscalDocument(options: IssueOptions): Promise<IssueResult> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return {
      success: false,
      provider: 'focusnfe',
      fallback_used: false,
      ref: options.ref || '',
      error: 'Supabase não configurado no servidor',
    };
  }

  const { tenant_id, doc_type, payload, ref } = options;
  const finalRef = (ref && String(ref).trim()) ? String(ref).trim() : `fd_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

  // 1. Buscar todas as configurações fiscais globais
  const { data: globalIntegrations } = await supabaseAdmin
    .from('fiscal_integrations')
    .select('*')
    .eq('tenant_id', '00000000-0000-0000-0000-000000000000');

  const focusGlobal = globalIntegrations?.find((i) => i.provider === 'focusnfe');
  const notaasGlobal = globalIntegrations?.find((i) => i.provider === 'notaas');

  // Verificar provedor primário global e flag de fallback
  const primaryProvider: FiscalProvider = focusGlobal?.primary_provider || notaasGlobal?.primary_provider || (notaasGlobal?.enabled && !focusGlobal?.enabled ? 'notaas' : 'focusnfe');
  const fallbackEnabled: boolean = focusGlobal?.fallback_enabled ?? notaasGlobal?.fallback_enabled ?? true;

  const secondaryProvider: FiscalProvider = primaryProvider === 'focusnfe' ? 'notaas' : 'focusnfe';

  // Tentativa pelo Provedor Primário
  let primaryError: any = null;
  try {
    const res = await attemptEmission(supabaseAdmin, primaryProvider, {
      tenant_id,
      doc_type,
      payload,
      ref: finalRef,
      globalConfig: primaryProvider === 'focusnfe' ? focusGlobal : notaasGlobal,
    });

    if (res.success) {
      return res;
    }
    primaryError = res;
  } catch (err: any) {
    primaryError = { error: err.message || 'Erro inesperado no provedor primário' };
  }

  // Se o provedor primário falhou e o fallback estiver ativo, tenta o secundário
  if (fallbackEnabled) {
    console.warn(`[Fiscal Orchestrator] Falha no provedor primário (${primaryProvider}). Iniciando fallback via ${secondaryProvider}...`);
    try {
      const fallbackRes = await attemptEmission(supabaseAdmin, secondaryProvider, {
        tenant_id,
        doc_type,
        payload,
        ref: finalRef,
        globalConfig: secondaryProvider === 'focusnfe' ? focusGlobal : notaasGlobal,
        isFallback: true,
        primaryError: primaryError?.error || primaryError?.details,
      });

      if (fallbackRes.success) {
        return {
          ...fallbackRes,
          fallback_used: true,
        };
      }
    } catch (fallbackErr: any) {
      console.error(`[Fiscal Orchestrator] Fallback via ${secondaryProvider} também falhou:`, fallbackErr);
    }
  }

  // Se tudo falhar, retorna a falha do primário
  return {
    success: false,
    provider: primaryProvider,
    fallback_used: false,
    ref: finalRef,
    error: primaryError?.error || 'Erro ao emitir documento fiscal em todos os provedores',
    details: primaryError?.details || primaryError,
  };
}

async function attemptEmission(
  supabaseAdmin: any,
  provider: FiscalProvider,
  ctx: {
    tenant_id: string;
    doc_type: DocType;
    payload: any;
    ref: string;
    globalConfig: any;
    isFallback?: boolean;
    primaryError?: any;
  }
): Promise<IssueResult> {
  const { tenant_id, doc_type, payload, ref, globalConfig, isFallback, primaryError } = ctx;

  if (provider === 'focusnfe') {
    if (!globalConfig || !globalConfig.enabled || !globalConfig.api_token) {
      return { success: false, provider: 'focusnfe', fallback_used: false, ref, error: 'FocusNFe desabilitada ou sem token' };
    }

    const { data: integration } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (!integration || !integration.enabled) {
      return { success: false, provider: 'focusnfe', fallback_used: false, ref, error: 'Integração FocusNFe desabilitada para este tenant' };
    }

    const environment: Environment = (globalConfig.environment as Environment) || 'homologacao';
    const baseUrl = getFocusBaseUrl(environment);
    const url = `${baseUrl}/v2/${doc_type}?ref=${encodeURIComponent(ref)}`;
    const token = environment === 'producao'
      ? (integration.focus_token_producao || globalConfig.api_token)
      : (integration.focus_token_homologacao || globalConfig.api_token);

    // Injetar CNPJ e Série se necessário
    const issuerCnpj = (integration.cnpj_emitente || integration.cert_cnpj || '').replace(/\D/g, '');
    if (issuerCnpj && payload && typeof payload === 'object' && !payload.cnpj_emitente) {
      payload.cnpj_emitente = issuerCnpj;
    }
    if (payload && typeof payload === 'object' && !payload.serie) {
      payload.serie = doc_type === 'nfe' ? (integration.nfe_serie || '1') : (integration.nfce_serie || '1');
    }

    // Criar fiscal_document
    const { data: fiscalDoc, error: insertError } = await supabaseAdmin
      .from('fiscal_documents')
      .insert({
        tenant_id,
        provider: 'focusnfe',
        doc_type,
        ref,
        status: 'submitted',
        payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !fiscalDoc) {
      return { success: false, provider: 'focusnfe', fallback_used: false, ref, error: 'Erro ao salvar fiscal_document', details: insertError?.message };
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const responseStatus = resp.status;
    const text = await resp.text();
    let responseBody: any = null;
    try { responseBody = text ? JSON.parse(text) : null; } catch { responseBody = { raw: text }; }

    const nextStatus = resp.ok ? (doc_type === 'nfce' ? 'authorized_or_error' : 'processing') : 'error';

    await supabaseAdmin
      .from('fiscal_documents')
      .update({
        status: nextStatus,
        provider_response: { http_status: responseStatus, body: responseBody, fallback_used: !!isFallback, primary_error: primaryError },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fiscalDoc.id);

    if (!resp.ok) {
      return { success: false, provider: 'focusnfe', fallback_used: false, ref, fiscal_document_id: fiscalDoc.id, error: 'Erro na API FocusNFe', details: responseBody };
    }

    return { success: true, provider: 'focusnfe', fallback_used: !!isFallback, fiscal_document_id: fiscalDoc.id, ref, response_data: responseBody };
  } else {
    // Provedor Nota AaS
    if (!globalConfig || !globalConfig.enabled || !globalConfig.api_token) {
      return { success: false, provider: 'notaas', fallback_used: false, ref, error: 'Nota AaS desabilitada ou sem API Key' };
    }

    const notaAsClient = new NotaAsClient({ apiKey: globalConfig.api_token });

    // Criar fiscal_document
    const { data: fiscalDoc, error: insertError } = await supabaseAdmin
      .from('fiscal_documents')
      .insert({
        tenant_id,
        provider: 'notaas',
        doc_type,
        ref,
        status: 'submitted',
        payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !fiscalDoc) {
      return { success: false, provider: 'notaas', fallback_used: false, ref, error: 'Erro ao salvar fiscal_document', details: insertError?.message };
    }

    let responseData: any = null;

    if (doc_type === 'nfse') {
      const notaasPayload = mapGenericPayloadToNotaAsNFSe({ ...payload, ref });
      responseData = await notaAsClient.emitirNFSe(notaasPayload);
    } else {
      const notaasPayload = mapGenericPayloadToNotaAsNFe({ ...payload, doc_type, ref });
      responseData = await notaAsClient.emitirNFe(notaasPayload);
    }

    await supabaseAdmin
      .from('fiscal_documents')
      .update({
        status: 'processing',
        provider_response: { body: responseData, fallback_used: !!isFallback, primary_error: primaryError },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fiscalDoc.id);

    return {
      success: true,
      provider: 'notaas',
      fallback_used: !!isFallback,
      fiscal_document_id: fiscalDoc.id,
      ref,
      response_data: responseData,
    };
  }
}
