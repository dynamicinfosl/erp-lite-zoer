import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DEFAULT_METHODS = [
  { name: 'Dinheiro', code: 'dinheiro', allow_installments: false, days_to_due: 0, order_index: 1 },
  { name: 'PIX', code: 'pix', allow_installments: false, days_to_due: 0, order_index: 2 },
  { name: 'Cartão de Débito', code: 'cartao_debito', allow_installments: false, days_to_due: 1, order_index: 3 },
  { name: 'Cartão de Crédito', code: 'cartao_credito', allow_installments: true, days_to_due: 30, order_index: 4 },
  { name: 'A Prazo', code: 'a_prazo', allow_installments: true, days_to_due: 30, order_index: 5 },
  { name: 'Boleto Bancário', code: 'boleto_bancario', allow_installments: true, days_to_due: 3, order_index: 6 },
  { name: 'Transferência Bancária', code: 'transferencia', allow_installments: false, days_to_due: 0, order_index: 7 },
  { name: 'Outros', code: 'outros', allow_installments: false, days_to_due: 0, order_index: 8 },
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const onlyActive = searchParams.get('only_active') === 'true';

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payment_methods')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('order_index', { ascending: true })
      .order('id', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data: methods, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar formas de pagamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar formas de pagamento: ' + error.message },
        { status: 500 }
      );
    }

    // Se o tenant ainda não tiver registros, realizar auto-seed
    if (!methods || methods.length === 0) {
      const seedInserts = DEFAULT_METHODS.map((m) => ({
        tenant_id,
        name: m.name,
        code: m.code,
        is_active: true,
        allow_installments: m.allow_installments,
        days_to_due: m.days_to_due,
        fee_percentage: 0,
        order_index: m.order_index,
      }));

      const { data: seeded, error: seedError } = await supabase
        .from('payment_methods')
        .insert(seedInserts)
        .select();

      if (!seedError && seeded) {
        return NextResponse.json({
          success: true,
          data: seeded,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: methods || [],
    });
  } catch (error: any) {
    console.error('❌ Erro no handler de formas de pagamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, name, allow_installments, days_to_due, fee_percentage, order_index } = body;

    if (!tenant_id || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'tenant_id e nome são obrigatórios' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    let code = body.code ? slugify(body.code) : slugify(cleanName);
    if (!code) code = 'custom_' + Date.now();

    // Checar se já existe code com esse nome no mesmo tenant
    const { data: existing } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('code', code)
      .maybeSingle();

    if (existing) {
      code = `${code}_${Date.now().toString().slice(-4)}`;
    }

    const newMethod = {
      tenant_id,
      name: cleanName,
      code,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      allow_installments: Boolean(allow_installments),
      days_to_due: Number(days_to_due) || 0,
      fee_percentage: Number(fee_percentage) || 0,
      order_index: Number(order_index) || 99,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('payment_methods')
      .insert(newMethod)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar forma de pagamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar forma de pagamento: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Forma de pagamento criada com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro no POST payment-methods:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tenant_id, name, is_active, allow_installments, days_to_due, fee_percentage, order_index } = body;

    if (!id || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'id e tenant_id são obrigatórios' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (allow_installments !== undefined) updateData.allow_installments = Boolean(allow_installments);
    if (days_to_due !== undefined) updateData.days_to_due = Number(days_to_due);
    if (fee_percentage !== undefined) updateData.fee_percentage = Number(fee_percentage);
    if (order_index !== undefined) updateData.order_index = Number(order_index);

    const { data, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar forma de pagamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar forma de pagamento: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Forma de pagamento atualizada com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro no PUT payment-methods:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenant_id = searchParams.get('tenant_id');

    if (!id || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'id e tenant_id são obrigatórios' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant_id);

    if (error) {
      console.error('❌ Erro ao excluir forma de pagamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir forma de pagamento: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Forma de pagamento excluída com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro no DELETE payment-methods:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
