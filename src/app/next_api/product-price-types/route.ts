import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function slugify(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    if (!tenant_id) return NextResponse.json({ success: true, data: [] });

    const { data, error } = await supabaseAdmin
      .from('product_price_types')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant_id = body?.tenant_id;
    const name = String(body?.name || '').trim();
    if (!tenant_id || !name) {
      return NextResponse.json({ error: 'tenant_id e name são obrigatórios' }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 });

    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('product_price_types')
      .upsert(
        { tenant_id, name, slug, is_active: true, updated_at: now },
        { onConflict: 'tenant_id,slug' }
      )
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id;
    const tenant_id = body?.tenant_id;
    if (!id || !tenant_id) return NextResponse.json({ error: 'id e tenant_id são obrigatórios' }, { status: 400 });

    const patch: any = { updated_at: new Date().toISOString() };
    if (typeof body.name === 'string' && body.name.trim()) {
      patch.name = body.name.trim();
      patch.slug = slugify(body.name.trim());
    }
    if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

    const { error } = await supabaseAdmin
      .from('product_price_types')
      .update(patch)
      .eq('tenant_id', tenant_id)
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const id = searchParams.get('id');
    if (!tenant_id || !id) return NextResponse.json({ error: 'tenant_id e id são obrigatórios' }, { status: 400 });

    // Soft delete (desativar) para não quebrar históricos/importações
    const { error } = await supabaseAdmin
      .from('product_price_types')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenant_id)
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

