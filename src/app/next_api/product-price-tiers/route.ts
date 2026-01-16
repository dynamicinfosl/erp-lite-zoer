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
    if (!tenant_id || !product_id) return NextResponse.json({ success: true, data: [] });

    // Join com product_price_types para retornar nome/slug
    const { data, error } = await supabaseAdmin
      .from('product_price_tiers')
      .select('id, product_id, price, price_type_id, price_type:product_price_types(id,name,slug,is_active)')
      .eq('tenant_id', tenant_id)
      .eq('product_id', Number(product_id))
      .order('price_type_id', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (data || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      price: Number(r.price),
      price_type_id: Number(r.price_type_id),
      price_type: r.price_type
        ? {
            id: Number(r.price_type.id),
            name: String(r.price_type.name),
            slug: String(r.price_type.slug),
            is_active: Boolean(r.price_type.is_active),
          }
        : null,
    }));

    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

