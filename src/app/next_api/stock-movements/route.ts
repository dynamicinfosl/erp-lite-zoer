import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurações hardcoded para garantir funcionamento
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET - listar movimentações
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const branch_id = searchParams.get('branch_id');
    const branch_scope = searchParams.get('branch_scope'); // 'all' | 'branch'

    if (!tenant_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Buscar movimentações diretamente (agora com tenant_id/branch_id no schema)
    let query = supabaseAdmin
      .from('stock_movements')
      .select(`
        id,
        tenant_id,
        branch_id,
        product_id,
        movement_type,
        quantity,
        notes,
        reference_type,
        reference_id,
        created_at
      `)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (branch_scope !== 'all' && branch_id) {
      const bid = Number(branch_id);
      if (Number.isFinite(bid)) query = query.eq('branch_id', bid);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar movimentações:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Enriquecer com dados do produto (sem N+1)
    const rows = Array.isArray(data) ? data : [];
    const productIds = rows.map((m: any) => Number(m.product_id)).filter((id: number) => Number.isFinite(id));

    let productMap: Record<number, { name: string; sku: string }> = {};
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id,name,sku,tenant_id')
        .eq('tenant_id', tenant_id)
        .in('id', productIds);
      for (const p of (products || []) as any[]) {
        const id = Number(p.id);
        if (!Number.isFinite(id)) continue;
        productMap[id] = { name: p.name, sku: p.sku };
      }
    }

    const enriched = rows.map((m: any) => ({
      ...m,
      product_name: productMap[Number(m.product_id)]?.name,
      product_sku: productMap[Number(m.product_id)]?.sku,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - criar movimentação
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { product_id, movement_type, quantity, reason, notes, tenant_id, branch_id, user_id, reference_type, reference_id } = body;
    const notesValue = notes || reason || null;
    // Usar user_id fornecido ou UUID padrão
    const finalUserId = user_id || '00000000-0000-0000-0000-000000000000';

    console.log('📦 Recebendo requisição de movimentação:', { 
      product_id, 
      movement_type, 
      quantity, 
      tenant_id,
      branch_id,
      user_id: finalUserId,
      notes: notesValue 
    });

    if (!product_id || !movement_type || !quantity) {
      console.error('❌ Validação falhou: campos obrigatórios ausentes');
      return NextResponse.json(
        { error: 'Produto, tipo e quantidade são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar produto para validar tenant e atualizar estoque
    let productQuery = supabaseAdmin
      .from('products')
      .select('id, stock_quantity, tenant_id')
      .eq('id', product_id);
    
    // Se tenant_id foi fornecido, validar que o produto pertence ao tenant
    if (tenant_id) {
      productQuery = productQuery.eq('tenant_id', tenant_id);
    }
    
    const { data: product, error: productError } = await productQuery.single();

    if (productError || !product) {
      console.error('❌ Produto não encontrado:', { product_id, tenant_id, error: productError });
      return NextResponse.json({ 
        error: 'Produto não encontrado' + (tenant_id ? ' para este tenant' : ''),
        details: productError?.message 
      }, { status: 404 });
    }

    console.log('✅ Produto encontrado:', { 
      product_id, 
      stock_atual: product.stock_quantity,
      tenant_id: product.tenant_id 
    });

    let newStock = product.stock_quantity;
    const qty = parseInt(quantity);

    if (isNaN(qty) || qty <= 0) {
      console.error('❌ Quantidade inválida:', { quantity, qty });
      return NextResponse.json({ 
        error: 'Quantidade deve ser um número positivo' 
      }, { status: 400 });
    }

    // ✅ Novo: se branch_id fornecido, atualizar product_stocks (estoque por filial)
    const bid = branch_id ? Number(branch_id) : null;
    if (bid && Number.isFinite(bid)) {
      // Buscar estoque atual da filial
      const { data: stockRow, error: stockError } = await supabaseAdmin
        .from('product_stocks')
        .select('id, quantity')
        .eq('tenant_id', tenant_id)
        .eq('branch_id', bid)
        .eq('product_id', product_id)
        .maybeSingle();

      if (stockError) {
        console.error('❌ Erro ao buscar product_stocks:', stockError);
        return NextResponse.json({ error: 'Erro ao buscar estoque da filial' }, { status: 400 });
      }

      const currentQty = Number(stockRow?.quantity || 0);
      let nextQty = currentQty;
      switch (movement_type) {
        case 'entrada':
          nextQty = currentQty + qty;
          break;
        case 'saida':
          nextQty = currentQty - qty;
          break;
        case 'ajuste':
          nextQty = qty;
          break;
        default:
          console.error('❌ Tipo de movimentação inválido:', movement_type);
          return NextResponse.json({ error: 'Tipo de movimentação inválido' }, { status: 400 });
      }

      if (nextQty < 0) {
        console.error('❌ Estoque da filial ficaria negativo:', { nextQty });
        return NextResponse.json({ error: 'Estoque não pode ficar negativo' }, { status: 400 });
      }

      // Upsert do estoque por filial
      const upsertPayload: any = {
        tenant_id,
        branch_id: bid,
        product_id,
        quantity: nextQty,
        updated_at: new Date().toISOString(),
      };
      if (!stockRow?.id) upsertPayload.created_at = new Date().toISOString();

      const { error: upsertError } = await supabaseAdmin
        .from('product_stocks')
        .upsert(upsertPayload, { onConflict: 'tenant_id,branch_id,product_id' });

      if (upsertError) {
        console.error('❌ Erro ao atualizar product_stocks:', upsertError);
        return NextResponse.json({ error: 'Erro ao atualizar estoque da filial' }, { status: 400 });
      }

      // Registrar movimentação com tenant/branch
      const { data: movement, error: movError } = await supabaseAdmin
        .from('stock_movements')
        .insert({
          tenant_id,
          branch_id: bid,
          product_id,
          user_id: finalUserId,
          movement_type,
          quantity: qty,
          notes: notesValue,
          reference_type: reference_type || null,
          reference_id: reference_id || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (movError) {
        console.error('❌ Erro ao criar movimentação:', movError);
        return NextResponse.json(
          { error: 'Erro ao criar movimentação: ' + movError.message, details: movError },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, data: movement });
    }

    // ✅ Fallback legado: atualizar products.stock_quantity (sem filial)
    switch (movement_type) {
      case 'entrada':
        newStock += qty;
        break;
      case 'saida':
        newStock -= qty;
        break;
      case 'ajuste':
        newStock = qty;
        break;
      default:
        console.error('❌ Tipo de movimentação inválido:', movement_type);
        return NextResponse.json({ error: 'Tipo de movimentação inválido' }, { status: 400 });
    }

    console.log('📊 Calculando novo estoque:', { 
      stock_anterior: product.stock_quantity, 
      quantidade: qty, 
      tipo: movement_type,
      novo_estoque: newStock 
    });

    if (newStock < 0) {
      console.error('❌ Estoque ficaria negativo:', { newStock });
      return NextResponse.json({ error: 'Estoque não pode ficar negativo' }, { status: 400 });
    }

    // Registrar movimentação (legado)
    console.log('💾 Inserindo movimentação no banco...');
    const { data: movement, error: movError } = await supabaseAdmin
      .from('stock_movements')
      .insert({
        product_id,
        tenant_id: tenant_id || null,
        branch_id: null,
        user_id: finalUserId,
        movement_type,
        quantity: qty,
        notes: notesValue,
        reference_type: reference_type || null,
        reference_id: reference_id || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (movError) {
      console.error('❌ Erro ao criar movimentação:', movError);
      return NextResponse.json({ 
        error: 'Erro ao criar movimentação: ' + movError.message,
        details: movError 
      }, { status: 400 });
    }

    console.log('✅ Movimentação criada com sucesso:', movement.id);

    // Atualizar estoque do produto (legado)
    console.log('💾 Atualizando estoque do produto...');
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', product_id);

    if (updateError) {
      console.error('❌ Erro ao atualizar estoque:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar estoque: ' + updateError.message,
        details: updateError 
      }, { status: 400 });
    }

    console.log('✅ Estoque atualizado com sucesso:', { 
      product_id, 
      novo_estoque: newStock 
    });

    return NextResponse.json({ success: true, data: movement });
  } catch (error: any) {
    console.error('❌ Erro no handler de criação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error?.message || 'Erro desconhecido',
      details: error 
    }, { status: 500 });
  }
}
