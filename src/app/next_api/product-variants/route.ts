import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const product_id = searchParams.get('product_id');

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    // Modo resumo: sem product_id retorna { product_id, count } para a UI listar apenas produtos com variações
    if (!product_id) {
      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .select('product_id')
        .eq('tenant_id', tenant_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const counts = new Map<number, number>();
      for (const r of (data || []) as any[]) {
        const pid = Number((r as any)?.product_id);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        counts.set(pid, (counts.get(pid) || 0) + 1);
      }

      const summary = Array.from(counts.entries())
        .map(([product_id, count]) => ({ product_id, count }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({ success: true, data: summary });
    }

    const pid = Number(product_id);
    if (!Number.isFinite(pid) || pid <= 0) {
      return NextResponse.json({ error: 'product_id inválido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('product_id', pid)
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: e?.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, product_id, label, name, barcode, unit, sale_price, cost_price, stock_quantity, is_active } =
      body || {};

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    const pid = Number(product_id);
    if (!Number.isFinite(pid) || pid <= 0) {
      return NextResponse.json({ error: 'product_id inválido' }, { status: 400 });
    }
    const lbl = String(label || '').trim();
    if (!lbl) {
      return NextResponse.json({ error: 'label é obrigatório' }, { status: 400 });
    }

    const payload: any = {
      tenant_id,
      product_id: pid,
      label: lbl,
      name: name ? String(name).trim() : null,
      barcode: barcode ? String(barcode).trim() : null,
      unit: unit ? String(unit).trim() : null,
      sale_price: sale_price === undefined || sale_price === null ? null : Number(sale_price),
      cost_price: cost_price === undefined || cost_price === null ? null : Number(cost_price),
      stock_quantity: Number.isFinite(Number(stock_quantity)) ? Number(stock_quantity) : 0,
      is_active: is_active === undefined ? true : Boolean(is_active),
      updated_at: new Date().toISOString(),
    };

    // Upsert via fluxo manual (ilike) porque o índice é em lower(label)
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('product_variants')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('product_id', pid)
      .ilike('label', lbl)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    }

    if (existing?.id) {
      const { data: updated, error: updErr } = await supabaseAdmin
        .from('product_variants')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ success: true, data: updated });
    }

    payload.created_at = new Date().toISOString();
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('product_variants')
      .insert(payload)
      .select()
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    return NextResponse.json({ success: true, data: inserted });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: e?.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, id, ...rest } = body || {};

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    const vid = Number(id);
    if (!Number.isFinite(vid) || vid <= 0) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const payload: any = { updated_at: new Date().toISOString() };
    if (rest.label !== undefined) payload.label = String(rest.label || '').trim();
    if (rest.name !== undefined) payload.name = rest.name ? String(rest.name).trim() : null;
    if (rest.barcode !== undefined) payload.barcode = rest.barcode ? String(rest.barcode).trim() : null;
    if (rest.unit !== undefined) payload.unit = rest.unit ? String(rest.unit).trim() : null;
    if (rest.sale_price !== undefined) payload.sale_price = rest.sale_price === null ? null : Number(rest.sale_price);
    if (rest.cost_price !== undefined) payload.cost_price = rest.cost_price === null ? null : Number(rest.cost_price);
    if (rest.stock_quantity !== undefined) {
      payload.stock_quantity = Number.isFinite(Number(rest.stock_quantity)) ? Number(rest.stock_quantity) : 0;
    }
    if (rest.is_active !== undefined) payload.is_active = Boolean(rest.is_active);

    if (payload.label !== undefined && !payload.label) {
      return NextResponse.json({ error: 'label não pode ser vazio' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update(payload)
      .eq('tenant_id', tenant_id)
      .eq('id', vid)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: e?.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const id = searchParams.get('id');

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    const vid = Number(id);
    if (!Number.isFinite(vid) || vid <= 0) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('product_variants').delete().eq('tenant_id', tenant_id).eq('id', vid);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: e?.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

