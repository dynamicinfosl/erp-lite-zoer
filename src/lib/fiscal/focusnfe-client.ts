import { createClient, SupabaseClient } from '@supabase/supabase-js';

export { getFullFileUrl } from '@/lib/fiscal/focusnfe-urls';

export type FocusEnvironment = 'homologacao' | 'producao';

export type FocusCredentials = {
  environment: FocusEnvironment;
  baseUrl: string;
  token: string;
  cnpj: string;
  authHeader: string;
};

const GLOBAL_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export function getFocusBaseUrl(environment: FocusEnvironment): string {
  return environment === 'producao'
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';
}

export function getFocusAuthHeader(token: string): string {
  return `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function onlyDigits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Resolve FocusNFe credentials for a tenant (environment, token, CNPJ, auth header).
 */
export async function resolveFocusCredentials(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ ok: true; credentials: FocusCredentials } | { ok: false; error: string; status: number }> {
  const { data: globalConfig, error: globalError } = await supabase
    .from('fiscal_integrations')
    .select('environment, api_token, enabled')
    .eq('tenant_id', GLOBAL_TENANT_ID)
    .eq('provider', 'focusnfe')
    .maybeSingle();

  if (globalError) {
    return { ok: false, error: `Erro ao buscar configuração global: ${globalError.message}`, status: 400 };
  }

  if (!globalConfig || !globalConfig.enabled || !globalConfig.api_token) {
    return {
      ok: false,
      error: 'Emissão fiscal global desabilitada ou credenciais do ERP ausentes.',
      status: 400,
    };
  }

  const { data: integration, error: integrationError } = await supabase
    .from('fiscal_integrations')
    .select('enabled, focus_token_homologacao, focus_token_producao, cnpj_emitente, cert_cnpj')
    .eq('tenant_id', tenantId)
    .eq('provider', 'focusnfe')
    .maybeSingle();

  if (integrationError) {
    return { ok: false, error: `Erro ao buscar integração do tenant: ${integrationError.message}`, status: 400 };
  }

  if (!integration || !integration.enabled) {
    return {
      ok: false,
      error: 'Integração FocusNFe não configurada ou desabilitada para este tenant.',
      status: 400,
    };
  }

  const environment = ((globalConfig.environment as FocusEnvironment) || 'homologacao') as FocusEnvironment;
  const token =
    environment === 'producao'
      ? integration.focus_token_producao || globalConfig.api_token
      : integration.focus_token_homologacao || globalConfig.api_token;

  if (!token) {
    return { ok: false, error: 'Token FocusNFe não encontrado para este tenant.', status: 400 };
  }

  const cnpj = onlyDigits(integration.cnpj_emitente || integration.cert_cnpj);
  if (!cnpj || cnpj.length !== 14) {
    return {
      ok: false,
      error: 'CNPJ emitente não configurado. Configure o CNPJ na integração fiscal.',
      status: 400,
    };
  }

  return {
    ok: true,
    credentials: {
      environment,
      baseUrl: getFocusBaseUrl(environment),
      token,
      cnpj,
      authHeader: getFocusAuthHeader(token),
    },
  };
}

export type FocusBackupMonth = {
  month: string; // YYYY-MM
  xmls_url: string | null;
  danfes_url: string | null;
  source: 'focus_backup';
};

type FocusBackupRaw = {
  mes?: string;
  xmls?: string | null;
  danfes?: string | null;
};

/**
 * Normalize FocusNFe backup response into YYYY-MM list.
 * Focus may return `mes` as "YYYYMM" or "YYYY-MM".
 */
export function normalizeFocusBackups(raw: unknown): FocusBackupMonth[] {
  const list: FocusBackupRaw[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.backups)
      ? (raw as any).backups
      : [];

  return list
    .map((item) => {
      const mesRaw = String(item.mes || '').trim();
      let month = '';
      if (/^\d{6}$/.test(mesRaw)) {
        month = `${mesRaw.slice(0, 4)}-${mesRaw.slice(4, 6)}`;
      } else if (/^\d{4}-\d{2}$/.test(mesRaw)) {
        month = mesRaw;
      }
      if (!month) return null;
      return {
        month,
        xmls_url: item.xmls || null,
        danfes_url: item.danfes || null,
        source: 'focus_backup' as const,
      };
    })
    .filter((x): x is FocusBackupMonth => x !== null)
    .sort((a, b) => b.month.localeCompare(a.month));
}

export async function fetchFocusBackups(
  credentials: FocusCredentials
): Promise<{ ok: true; backups: FocusBackupMonth[] } | { ok: false; error: string; status: number }> {
  const url = `${credentials.baseUrl}/v2/backups/${credentials.cnpj}.json`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Authorization: credentials.authHeader },
  });

  const text = await resp.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!resp.ok) {
    const msg =
      (body as any)?.mensagem ||
      (body as any)?.message ||
      (body as any)?.erro ||
      `FocusNFe retornou HTTP ${resp.status}`;
    return { ok: false, error: String(msg), status: resp.status === 401 ? 401 : 400 };
  }

  return { ok: true, backups: normalizeFocusBackups(body) };
}

/** Month range in ISO for created_at filters (local calendar month interpreted as UTC bounds). */
export function getMonthRange(month: string): { start: string; end: string } | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

export function isAuthorizedFiscalStatus(status: string | null | undefined): boolean {
  const s = (status || '').toLowerCase();
  if (!s) return false;
  if (s.includes('cancel')) return false;
  if (s.includes('err') || s.includes('rejeic') || s.includes('fail') || s === 'erro_autorizacao') return false;
  return (
    s === 'autorizado' ||
    s === 'autorizada' ||
    s === 'authorized' ||
    s === 'processado' ||
    s === 'success'
  );
}
