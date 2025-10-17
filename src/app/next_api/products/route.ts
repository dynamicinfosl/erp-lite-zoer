import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis do Supabase não configuradas em products route:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Handler original para criar produto
async function createProductHandler(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { tenant_id, user_id, sku, name, description, category, brand, price, cost_price, stock, barcode, ncm, unit } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }

    // Resolver tenant_id quando ausente ou inválido
    const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
    if (!tenant_id || tenant_id === ZERO_UUID) {
      if (user_id) {
        // tentar obter membership ativa
        const { data: membership } = await supabaseAdmin
          .from('user_memberships')
          .select('tenant_id')
          .eq('user_id', user_id)
          .eq('is_active', true)
          .maybeSingle();
        if (membership?.tenant_id) {
          tenant_id = membership.tenant_id as string;
        } else {
          // criar tenant trial simples e membership
          const { data: newTenant, error: tenantErr } = await supabaseAdmin
            .from('tenants')
            .insert({ name: 'Meu Negócio', slug: `trial-${Date.now()}`, status: 'trial' })
            .select('id')
            .single();
          if (tenantErr) {
            return NextResponse.json({ error: 'Falha ao resolver tenant' }, { status: 400 });
          }
          tenant_id = newTenant.id;
          await supabaseAdmin
            .from('user_memberships')
            .insert({ user_id, tenant_id, role: 'owner', is_active: true });
        }
      } else {
        return NextResponse.json({ error: 'Tenant inválido' }, { status: 400 });
      }
    }

    const stockQty = parseInt(stock) || 0;

    // Gerar SKU único se não fornecido ou vazio
    const finalSku = (sku && sku.trim()) ? sku.trim() : `PROD-${Date.now()}`;
    
    // Log para debug
    console.log(`📝 Criando produto:`, {
      tenant_id,
      sku_original: sku,
      sku_final: finalSku,
      name,
      user_id: user_id || '00000000-0000-0000-0000-000000000000'
    });

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        tenant_id: tenant_id, // ✅ Garantir que tenant_id está presente
        user_id: user_id || '00000000-0000-0000-0000-000000000000', // UUID padrão se não fornecido
        sku: finalSku,
        name,
        description: description || null,
        category: category || null,
        brand: brand || null,
        cost_price: parseFloat(cost_price) || 0,
        sale_price: parseFloat(price),
        stock_quantity: stockQty,
        barcode: barcode || null,
        ncm: ncm || null,
        unit: unit || 'UN',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar produto:', error);
      return NextResponse.json(
        { error: 'Erro ao criar produto: ' + error.message },
        { status: 400 }
      );
    }

    // Registrar movimentação de entrada inicial se houver estoque
    if (stockQty > 0) {
      await supabaseAdmin.from('stock_movements').insert({
        product_id: data.id,
        movement_type: 'entrada',
        quantity: stockQty,
        reason: 'Cadastro inicial do produto',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler original para listar produtos
async function listProductsHandler(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Cliente Supabase não configurado');
      return NextResponse.json(
        { error: 'Sistema não configurado - entre em contato com o suporte' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const sku = searchParams.get('sku');

    console.log(`📦 GET /products - tenant_id: ${tenant_id}, sku: ${sku}`);

    if (!tenant_id) {
      // Em desenvolvimento, quando tenant ainda não está resolvido no cliente,
      // devolvemos lista vazia para não quebrar a UI.
      console.log('⚠️ GET /products - Nenhum tenant_id fornecido, retornando lista vazia');
      return NextResponse.json({ success: true, data: [] });
    }

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('tenant_id', tenant_id);
    
    console.log(`🔍 Buscando produtos com tenant_id: ${tenant_id}`);

    // Se SKU foi fornecido, filtrar por SKU DENTRO DO TENANT
    if (sku && sku.trim()) {
      query = query.eq('sku', sku.trim());
      console.log(`🔍 Buscando produto com SKU "${sku.trim()}" no tenant ${tenant_id}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar produtos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar produtos: ' + error.message },
        { status: 400 }
      );
    }

    // Log para debug
    if (sku) {
      console.log(`✅ GET /products - SKU "${sku}": ${data?.length || 0} produtos encontrados no tenant ${tenant_id}`);
    } else {
      console.log(`✅ GET /products - ${data?.length || 0} produtos encontrados para tenant ${tenant_id}`);
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers com validação de plano
export const POST = withPlanValidation(createProductHandler, 'create_product');
export const GET = listProductsHandler;

// PUT - atualizar produto
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, name, description, price, stock } = body;
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        name,
        description,
        sale_price: price !== undefined ? parseFloat(price) : undefined,
        stock_quantity: stock !== undefined ? parseInt(stock) : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE - excluir produto
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}