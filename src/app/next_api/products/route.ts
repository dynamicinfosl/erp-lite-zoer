import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // ✅ VALIDAÇÃO DE PLANO/SUBSCRIPTION (verificar subscription ao invés de apenas tenant)
    if (tenant_id && tenant_id !== ZERO_UUID) {
      // Buscar subscription para verificar status real do plano
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          status,
          trial_end,
          trial_ends_at,
          current_period_end
        `)
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      const now = new Date();

      if (!subError && subscription) {
        // Verificar se trial expirou
        const trialEndDate = subscription.trial_end || subscription.trial_ends_at;
        if (subscription.status === 'trial' && trialEndDate) {
          const trialEnd = new Date(trialEndDate);
          if (trialEnd < now) {
            return NextResponse.json(
              { 
                error: 'Período de teste expirado. Faça upgrade do seu plano para continuar.',
                trialExpired: true 
              },
              { status: 403 }
            );
          }
        }

        // Verificar se plano ativo expirou
        if (subscription.status === 'active' && subscription.current_period_end) {
          const periodEnd = new Date(subscription.current_period_end);
          if (periodEnd < now) {
            return NextResponse.json(
              { 
                error: 'Plano expirado. Entre em contato com o suporte para renovar.',
                trialExpired: true 
              },
              { status: 403 }
            );
          }
        }

        // Verificar se plano está inativo
        if (subscription.status !== 'trial' && subscription.status !== 'active') {
          return NextResponse.json(
            { 
              error: 'Plano inativo. Entre em contato com o suporte.',
              trialExpired: true 
            },
            { status: 403 }
          );
        }
      } else {
        // Se não tem subscription, verificar tenant como fallback (compatibilidade)
        const { data: tenant, error: tenantError } = await supabaseAdmin
          .from('tenants')
          .select('trial_ends_at, status')
          .eq('id', tenant_id)
          .maybeSingle();

        if (!tenantError && tenant) {
          if (tenant.status === 'trial' && tenant.trial_ends_at) {
            const trialEnd = new Date(tenant.trial_ends_at);
            if (trialEnd < now) {
              return NextResponse.json(
                { 
                  error: 'Período de teste expirado. Faça upgrade do seu plano para continuar.',
                  trialExpired: true 
                },
                { status: 403 }
              );
            }
          }
        }
      }
    }

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
        user_id: user_id || '00000000-0000-0000-0000-000000000000',
        movement_type: 'entrada',
        quantity: stockQty,
        notes: 'Cadastro inicial do produto',
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

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const sku = searchParams.get('sku');
    const branch_id = searchParams.get('branch_id');
    const branch_scope = searchParams.get('branch_scope'); // 'all' | 'branch'

    console.log(`📦 GET /products - tenant_id: ${tenant_id}, sku: ${sku}, branch_id: ${branch_id}, scope: ${branch_scope}`);

    if (!tenant_id) {
      // Em desenvolvimento, quando tenant ainda não está resolvido no cliente,
      // devolvemos lista vazia para não quebrar a UI.
      console.log('⚠️ GET /products - Nenhum tenant_id fornecido, retornando lista vazia');
      return NextResponse.json({ success: true, data: [] });
    }

    // ✅ Lógica de compartilhamento:
    // - Se branch_scope='all' (matriz): retorna todos os produtos do tenant
    // - Se branch_id fornecido (filial): retorna TODOS os produtos do tenant (compartilhados automaticamente)
    //   O estoque será separado por filial via product_stocks
    let query;
    
    if (branch_scope === 'all') {
      // Matriz vê todos os produtos
      query = supabaseAdmin
        .from('products')
        .select('*')
        .eq('tenant_id', tenant_id);
      console.log(`🔍 [Matriz] Buscando todos os produtos do tenant`);
    } else if (branch_id) {
      // Filial: ver TODOS os produtos do tenant (compartilhados automaticamente)
      // O estoque será separado por filial via product_stocks
      const bid = Number(branch_id);
      if (Number.isFinite(bid) && bid > 0) {
        query = supabaseAdmin
          .from('products')
          .select('*')
          .eq('tenant_id', tenant_id);
        console.log(`🔍 [Filial ${bid}] Buscando todos os produtos do tenant (compartilhados automaticamente)`);
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    } else {
      // Fallback: retornar todos (compatibilidade com código antigo)
      query = supabaseAdmin
        .from('products')
        .select('*')
        .eq('tenant_id', tenant_id);
      console.log(`🔍 [Fallback] Buscando todos os produtos do tenant`);
    }

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

    // ✅ Branch-aware stock: se branch_id ou branch_scope=all, substituir stock_quantity usando product_stocks
    try {
      const rows = Array.isArray(data) ? data : [];
      const productIds = rows.map((p: any) => Number(p.id)).filter((id: number) => Number.isFinite(id));

      if (productIds.length > 0 && (branch_id || branch_scope === 'all')) {
        if (branch_scope === 'all') {
          // Somar estoque de todas as filiais para cada produto
          const { data: stocks, error: stocksError } = await supabaseAdmin
            .from('product_stocks')
            .select('product_id, quantity')
            .eq('tenant_id', tenant_id)
            .in('product_id', productIds);

          if (!stocksError && stocks) {
            const sumByProduct: Record<number, number> = {};
            for (const s of stocks as any[]) {
              const pid = Number(s.product_id);
              const qty = Number(s.quantity) || 0;
              if (!Number.isFinite(pid)) continue;
              sumByProduct[pid] = (sumByProduct[pid] || 0) + qty;
            }
            for (const p of rows as any[]) {
              const pid = Number(p.id);
              if (Number.isFinite(pid) && pid in sumByProduct) {
                p.stock_quantity = sumByProduct[pid];
              } else {
                // se não tiver registro em product_stocks, considerar 0 para visão agregada
                p.stock_quantity = 0;
              }
            }
          }
        } else if (branch_id) {
          const bid = Number(branch_id);
          if (Number.isFinite(bid)) {
            const { data: stocks, error: stocksError } = await supabaseAdmin
              .from('product_stocks')
              .select('product_id, quantity')
              .eq('tenant_id', tenant_id)
              .eq('branch_id', bid)
              .in('product_id', productIds);

            if (!stocksError) {
              const qtyByProduct: Record<number, number> = {};
              for (const s of (stocks || []) as any[]) {
                const pid = Number(s.product_id);
                if (!Number.isFinite(pid)) continue;
                qtyByProduct[pid] = Number(s.quantity) || 0;
              }
              for (const p of rows as any[]) {
                const pid = Number(p.id);
                if (!Number.isFinite(pid)) continue;
                p.stock_quantity = pid in qtyByProduct ? qtyByProduct[pid] : 0;
              }
            }
          }
        }
      }
    } catch (e) {
      // não quebrar listagem se product_stocks ainda não estiver populado para algum tenant
      console.warn('⚠️ Falha ao aplicar estoque por filial em /products (fallback para stock_quantity do products):', e);
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