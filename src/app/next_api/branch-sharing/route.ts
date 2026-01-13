import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// POST - Compartilhar clientes com filiais
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, tenant_id, branch_ids, customer_ids, product_ids, user_id } = body;

    if (!tenant_id || !branch_ids || !Array.isArray(branch_ids) || branch_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tenant_id e branch_ids são obrigatórios' },
        { status: 400 },
      );
    }

    if (type === 'customers') {
      if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'customer_ids é obrigatório para compartilhar clientes' },
          { status: 400 },
        );
      }

      // Criar registros de compartilhamento
      const shares = [];
      for (const branch_id of branch_ids) {
        for (const customer_id of customer_ids) {
          shares.push({
            tenant_id,
            branch_id: Number(branch_id),
            customer_id: Number(customer_id), // ✅ Garantir que é número (bigint)
            shared_by: user_id || null,
            shared_at: new Date().toISOString(),
            is_active: true,
          });
        }
      }

      const { error } = await supabaseAdmin.from('branch_customers').upsert(shares, {
        onConflict: 'tenant_id,branch_id,customer_id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error('Erro ao compartilhar clientes:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao compartilhar: ' + error.message },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `${customer_ids.length} cliente(s) compartilhado(s) com ${branch_ids.length} filial(is)`,
      });
    } else if (type === 'products') {
      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'product_ids é obrigatório para compartilhar produtos' },
          { status: 400 },
        );
      }

      // Criar registros de compartilhamento
      const shares = [];
      for (const branch_id of branch_ids) {
        for (const product_id of product_ids) {
          shares.push({
            tenant_id,
            branch_id: Number(branch_id),
            product_id: Number(product_id),
            shared_by: user_id || null,
            shared_at: new Date().toISOString(),
            is_active: true,
          });
        }
      }

      const { error } = await supabaseAdmin.from('branch_products').upsert(shares, {
        onConflict: 'tenant_id,branch_id,product_id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error('Erro ao compartilhar produtos:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao compartilhar: ' + error.message },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `${product_ids.length} produto(s) compartilhado(s) com ${branch_ids.length} filial(is)`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use "customers" ou "products"' },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Erro ao compartilhar:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET - Listar compartilhamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const type = searchParams.get('type'); // 'customers' | 'products'
    const branch_id = searchParams.get('branch_id');
    const customer_id = searchParams.get('customer_id');
    const product_id = searchParams.get('product_id');

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    if (type === 'customers') {
      let query = supabaseAdmin
        .from('branch_customers')
        .select('*, branches(name), customers(name)')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true);

      if (branch_id) query = query.eq('branch_id', Number(branch_id));
      if (customer_id) query = query.eq('customer_id', customer_id);

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    } else if (type === 'products') {
      let query = supabaseAdmin
        .from('branch_products')
        .select('*, branches(name), products(name)')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true);

      if (branch_id) query = query.eq('branch_id', Number(branch_id));
      if (product_id) query = query.eq('product_id', Number(product_id));

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    } else {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use "customers" ou "products"' },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Erro ao listar compartilhamentos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Remover compartilhamento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const type = searchParams.get('type');
    const branch_id = searchParams.get('branch_id');
    const customer_id = searchParams.get('customer_id');
    const product_id = searchParams.get('product_id');

    if (!tenant_id || !type || !branch_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id, type e branch_id são obrigatórios' },
        { status: 400 },
      );
    }

    if (type === 'customers' && customer_id) {
      const { error } = await supabaseAdmin
        .from('branch_customers')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('branch_id', Number(branch_id))
        .eq('customer_id', customer_id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } else if (type === 'products' && product_id) {
      const { error } = await supabaseAdmin
        .from('branch_products')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('branch_id', Number(branch_id))
        .eq('product_id', Number(product_id));

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos' },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Erro ao remover compartilhamento:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
