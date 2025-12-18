import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type Environment = 'homologacao' | 'producao';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Cliente Supabase não configurado' }, { status: 500 });
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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Cliente Supabase não configurado' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('id, tenant_id, provider, environment, cnpj_emitente, enabled, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500 });
  }
}
