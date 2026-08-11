import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders });
    }

    const body = await request.json();
    const {
      tenant_id = '00000000-0000-0000-0000-000000000000',
      api_token,
      enabled = true,
      primary_provider,
      fallback_enabled = true,
    } = body as {
      tenant_id?: string;
      api_token?: string;
      enabled?: boolean;
      primary_provider?: 'focusnfe' | 'notaas';
      fallback_enabled?: boolean;
    };

    if (!api_token) {
      return NextResponse.json({ error: 'API Key do Nota AaS é obrigatória' }, { status: 400, headers: jsonHeaders });
    }

    const payload: any = {
      tenant_id,
      provider: 'notaas',
      environment: 'producao',
      api_token,
      enabled,
      primary_provider,
      fallback_enabled,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('fiscal_integrations')
      .upsert(payload, { onConflict: 'tenant_id,provider' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar integração Nota AaS', details: error.message }, { status: 400, headers: jsonHeaders });
    }

    // Se um novo primary_provider foi definido, atualizar também o registro da Focus NFe
    if (primary_provider) {
      await supabaseAdmin
        .from('fiscal_integrations')
        .update({ primary_provider, fallback_enabled, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenant_id)
        .eq('provider', 'focusnfe');
    }

    return NextResponse.json({ success: true, data }, { headers: jsonHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500, headers: jsonHeaders });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders });
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id') || '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'notaas')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: true, data: null }, { headers: jsonHeaders });
    }

    return NextResponse.json({ success: true, data: data || null }, { headers: jsonHeaders });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: null }, { headers: jsonHeaders });
  }
}
