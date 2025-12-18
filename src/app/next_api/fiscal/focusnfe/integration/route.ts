import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

type Environment = 'homologacao' | 'producao';

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseClient();
    } catch (envError: any) {
      console.error('Erro ao configurar Supabase:', envError);
      return NextResponse.json({ 
        error: 'Configuração do servidor incompleta', 
        details: envError?.message || 'Variáveis de ambiente do Supabase não configuradas' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { tenant_id, api_token, environment = 'homologacao', cnpj_emitente, enabled = true } = body as {
      tenant_id?: string;
      api_token?: string;
      environment?: Environment;
      cnpj_emitente?: string;
      enabled?: boolean;
    };

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    if (!api_token) {
      return NextResponse.json({ error: 'api_token é obrigatório' }, { status: 400 });
    }

    if (environment !== 'homologacao' && environment !== 'producao') {
      return NextResponse.json({ error: 'environment inválido (use homologacao ou producao)' }, { status: 400 });
    }

    const payload: any = {
      tenant_id,
      provider: 'focusnfe',
      environment,
      api_token,
      enabled,
      updated_at: new Date().toISOString(),
    };

    if (cnpj_emitente !== undefined) payload.cnpj_emitente = cnpj_emitente;

    const { data, error } = await supabaseAdmin
      .from('fiscal_integrations')
      .upsert(payload, { onConflict: 'tenant_id,provider' })
      .select('id, tenant_id, provider, environment, cnpj_emitente, enabled, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar integração', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseClient();
    } catch (envError: any) {
      console.error('Erro ao configurar Supabase:', envError);
      return NextResponse.json({ 
        error: 'Configuração do servidor incompleta', 
        details: envError?.message || 'Variáveis de ambiente do Supabase não configuradas' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    // Validar formato UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id deve ser um UUID válido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('id, tenant_id, provider, environment, api_token, cnpj_emitente, enabled, focus_empresa_id, focus_token_homologacao, focus_token_producao, cert_valid_from, cert_valid_to, cert_cnpj, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar integração:', error);
      return NextResponse.json({ error: 'Erro ao buscar integração', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (error: any) {
    console.error('Erro interno na rota GET integration:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500 });
  }
}
