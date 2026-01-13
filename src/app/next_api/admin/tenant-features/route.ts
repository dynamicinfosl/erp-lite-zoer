import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, feature, enabled } = body || {};

    if (!tenant_id || !feature) {
      return NextResponse.json(
        { success: false, error: 'tenant_id e feature são obrigatórios' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Buscar flags atuais
    const { data: existing } = await supabaseAdmin
      .from('tenant_feature_flags')
      .select('tenant_id, features')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    const current = (existing?.features && typeof existing.features === 'object') ? existing.features : {};
    const next = { ...(current as any), [String(feature)]: Boolean(enabled) };

    const { error } = await supabaseAdmin.from('tenant_feature_flags').upsert(
      {
        tenant_id,
        features: next,
        updated_at: now,
        created_at: existing ? undefined : now,
      } as any,
      { onConflict: 'tenant_id' },
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar feature: ' + error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: { tenant_id, features: next } });
  } catch (error) {
    console.error('Erro ao atualizar tenant features:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

