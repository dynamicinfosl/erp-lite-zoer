import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFocusBackups,
  getSupabaseAdmin,
  isUuid,
  resolveFocusCredentials,
} from '@/lib/fiscal/focusnfe-client';

export const runtime = 'nodejs';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

/**
 * GET /next_api/fiscal/focusnfe/backups?tenant_id=
 * Lista backups mensais oficiais da FocusNFe (sem expor token nem URLs sensíveis de download).
 * URLs temporárias ficam só no download server-side.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = (searchParams.get('tenant_id') || '').trim();

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    const creds = await resolveFocusCredentials(supabase, tenant_id);
    if (!creds.ok) {
      return NextResponse.json({ error: creds.error }, { status: creds.status, headers: jsonHeaders });
    }

    const result = await fetchFocusBackups(creds.credentials);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: jsonHeaders });
    }

    // Não devolver URLs temporárias ao browser — só metadados do mês
    const data = result.backups.map((b) => ({
      month: b.month,
      has_xmls: Boolean(b.xmls_url),
      has_danfes: Boolean(b.danfes_url),
      source: b.source,
    }));

    return NextResponse.json(
      {
        success: true,
        cnpj: creds.credentials.cnpj,
        environment: creds.credentials.environment,
        data,
      },
      { headers: jsonHeaders }
    );
  } catch (error: any) {
    console.error('Erro ao listar backups FocusNFe:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao listar backups' },
      { status: 500, headers: jsonHeaders }
    );
  }
}
