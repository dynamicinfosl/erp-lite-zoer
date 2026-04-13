import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

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

function normalizeText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // Remove acentos (á -> a, é -> e, etc)
    .replace(/ç/g, 'c') // Converte cedilha (ç -> c)
    .replace(/Ç/g, 'c') // Converte cedilha maiúscula (Ç -> c)
    .toLowerCase()
    .trim();
}

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
    let { 
      tenant_id, 
      user_id, 
      sku, 
      name, 
      description, 
      category, 
      brand, 
      price, 
      cost_price, 
      stock, 
      barcode, 
      ncm, 
      unit,
      cest,
      cfop_default,
      tax_origem,
      tax_icms_cst,
      tax_icms_aliquota,
      tax_pis_cst,
      tax_pis_aliquota,
      tax_cofins_cst,
      tax_cofins_aliquota,
      tax_ipi_cst,
      tax_ipi_aliquota
    } = body;
    const price_tiers = Array.isArray(body?.price_tiers) ? body.price_tiers : [];

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

    const normalizeCode = (val: string | null | undefined) => val ? val.replace(/\D/g, '') : null;
    const safeFloat = (val: any) => {
      if (val === undefined || val === null || val === '') return null;
      const f = parseFloat(val);
      return isNaN(f) ? null : f;
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        tenant_id: tenant_id,
        user_id: user_id || '00000000-0000-0000-0000-000000000000',
        sku: finalSku,
        name,
        description: description || null,
        category: category || null,
        brand: brand || null,
        cost_price: safeFloat(cost_price) || 0,
        sale_price: safeFloat(price) || 0,
        stock_quantity: stockQty,
        barcode: barcode || null,
        ncm: normalizeCode(ncm),
        cest: normalizeCode(cest),
        cfop_default: normalizeCode(cfop_default),
        tax_origem: tax_origem || '0',
        tax_icms_cst: tax_icms_cst || null,
        tax_icms_aliquota: safeFloat(tax_icms_aliquota),
        tax_pis_cst: tax_pis_cst || null,
        tax_pis_aliquota: safeFloat(tax_pis_aliquota),
        tax_cofins_cst: tax_cofins_cst || null,
        tax_cofins_aliquota: safeFloat(tax_cofins_aliquota),
        tax_ipi_cst: tax_ipi_cst || null,
        tax_ipi_aliquota: safeFloat(tax_ipi_aliquota),
        unit: unit || 'UN',
        is_active: true,
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

    // ✅ Suporte a múltiplos valores de venda (tabelas de preço)
    // Espera: price_tiers = [{ name: "Valor Varejo", price: 54.0 }, ...]
    try {
      if (Array.isArray(price_tiers) && price_tiers.length > 0) {
        const now = new Date().toISOString();
        const productId = Number((data as any)?.id);
        const cleaned = price_tiers
          .map((t: any) => ({
            name: String(t?.name || '').trim(),
            price: Number(t?.price),
          }))
          .filter((t: any) => t.name && Number.isFinite(t.price) && t.price > 0);

        if (productId && cleaned.length > 0) {
          const uniqBySlug = new Map<string, { tenant_id: string; name: string; slug: string; is_active: boolean; updated_at: string }>();
          for (const t of cleaned) {
            const slug = slugify(t.name);
            if (!slug) continue;
            if (!uniqBySlug.has(slug)) {
              uniqBySlug.set(slug, { tenant_id, name: t.name, slug, is_active: true, updated_at: now });
            }
          }

          const typesPayload = Array.from(uniqBySlug.values());
          if (typesPayload.length > 0) {
            const { data: typeRows, error: typeErr } = await supabaseAdmin
              .from('product_price_types')
              .upsert(typesPayload, { onConflict: 'tenant_id,slug' })
              .select('id,slug');

            if (!typeErr && typeRows && typeRows.length > 0) {
              const slugToId = new Map<string, number>();
              for (const r of typeRows as any[]) {
                slugToId.set(String(r.slug), Number(r.id));
              }

              const tiersPayload = cleaned
                .map((t: any) => {
                  const slug = slugify(t.name);
                  const typeId = slugToId.get(slug);
                  if (!typeId) return null;
                  return {
                    tenant_id,
                    product_id: productId,
                    price_type_id: typeId,
                    price: t.price,
                    updated_at: now,
                  };
                })
                .filter(Boolean) as any[];

              if (tiersPayload.length > 0) {
                const { error: tiersErr } = await supabaseAdmin
                  .from('product_price_tiers')
                  .upsert(tiersPayload, { onConflict: 'tenant_id,product_id,price_type_id' });
                if (tiersErr) console.warn('⚠️ Falha ao salvar price_tiers:', tiersErr);
              }
            } else if (typeErr) {
              console.warn('⚠️ Falha ao upsert product_price_types:', typeErr);
            }
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao processar price_tiers (ignorado):', e);
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
    const include_variants = searchParams.get('include_variants') === 'true';
    const include_price_tiers = searchParams.get('include_price_tiers') === 'true';

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
    
    // Select de produtos (usando * para compatibilidade com schema variável)
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
              }
              // Se não tiver registro em product_stocks, manter o valor original de stock_quantity da tabela products
              // (não sobrescrever para 0, pois pode ter estoque negativo)
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
                // Se houver registro em product_stocks para esta filial, usar esse valor
                // Caso contrário, manter o valor original de stock_quantity da tabela products
                if (pid in qtyByProduct) {
                  p.stock_quantity = qtyByProduct[pid];
                }
                // Se não houver registro, manter o valor original (não sobrescrever para 0)
              }
            }
          }
        }
      }
    } catch (e) {
      // não quebrar listagem se product_stocks ainda não estiver populado para algum tenant
      console.warn('⚠️ Falha ao aplicar estoque por filial em /products (fallback para stock_quantity do products):', e);
    }

    // ✅ Mapear is_active (boolean) para status (string) se necessário
    const rows = Array.isArray(data) ? data : [];
    let mappedRows = rows.map((p: any) => {
      // Se o produto tem is_active mas não tem status, converter
      if (p.is_active !== undefined && !p.status) {
        p.status = p.is_active ? 'active' : 'inactive';
      }
      // Se o produto tem status mas não tem is_active, converter
      if (p.status && p.is_active === undefined) {
        p.is_active = p.status === 'active';
      }
      return p;
    });

    // Sempre incluir variações e tipos de preço para cada produto quando disponíveis
    const productIds = mappedRows.map((p: any) => Number(p.id)).filter((id: number) => Number.isFinite(id) && id > 0);
    
    if (productIds.length > 0) {
      // 🚀 OTIMIZAÇÃO: Buscar variações e price_tiers em PARALELO
      const [variantsResult, tiersResult] = await Promise.all([
        supabaseAdmin
          .from('product_variants')
          .select('id, product_id, label, name, barcode, unit, sale_price, cost_price, stock_quantity, is_active')
          .eq('tenant_id', tenant_id)
          .in('product_id', productIds)
          .order('id', { ascending: true }),
        supabaseAdmin
          .from('product_price_tiers')
          .select('id, product_id, price, price_type_id, price_type:product_price_types(id,name,slug,is_active)')
          .eq('tenant_id', tenant_id)
          .in('product_id', productIds)
          .order('price_type_id', { ascending: true })
      ]);
      
      const variantsMap: Record<number, any[]> = {};
      const { data: variants, error: variantsError } = variantsResult;
      
      if (variantsError) {
        console.error('❌ Erro ao buscar variações:', variantsError);
      }
      if (!variantsError && variants) {
        for (const variant of variants as any[]) {
          const pid = Number(variant.product_id);
          if (!Number.isFinite(pid) || pid <= 0) continue;
          
          if (!variantsMap[pid]) variantsMap[pid] = [];
          variantsMap[pid].push({
            id: variant.id,
            label: variant.label,
            name: variant.name,
            barcode: variant.barcode,
            unit: variant.unit,
            sale_price: variant.sale_price,
            cost_price: variant.cost_price,
            stock_quantity: variant.stock_quantity,
            is_active: variant.is_active,
          });
        }
      }

      // Processar price tiers
      const { data: tiers, error: tiersError } = tiersResult;
      
      const priceTiersMap: Record<number, any[]> = {};
      if (!tiersError && tiers) {
        for (const tier of tiers as any[]) {
          const pid = Number(tier.product_id);
          if (!priceTiersMap[pid]) priceTiersMap[pid] = [];
          priceTiersMap[pid].push({
            id: tier.id,
            price: Number(tier.price),
            price_type_id: Number(tier.price_type_id),
            price_type: tier.price_type ? {
              id: Number(tier.price_type.id),
              name: String(tier.price_type.name),
              slug: String(tier.price_type.slug),
              is_active: Boolean(tier.price_type.is_active),
            } : null,
          });
        }
      }

      // Adicionar variações e tipos de preço aos produtos (sempre, mesmo que vazios)
      mappedRows = mappedRows.map((product: any) => {
        const pid = Number(product.id);
        const productVariants = variantsMap[pid] || [];
        const productPriceTiers = priceTiersMap[pid] || [];
        
        return {
          ...product,
          variants: productVariants,
          price_tiers: productPriceTiers,
        };
      });
    } else {
      // Se não há produtos, garantir que cada produto tenha arrays vazios
      mappedRows = mappedRows.map((product: any) => ({
        ...product,
        variants: [],
        price_tiers: [],
      }));
    }

    // Log para debug
    if (sku) {
      console.log(`✅ GET /products - SKU "${sku}": ${mappedRows.length} produtos encontrados no tenant ${tenant_id}`);
    } else {
      console.log(`✅ GET /products - ${mappedRows.length} produtos encontrados para tenant ${tenant_id}`);
    }

    // 🚀 OTIMIZAÇÃO: Cache com revalidação (60 segundos para produtos)
    return NextResponse.json(
      { success: true, data: mappedRows },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' } }
    );

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
    const { 
      id, 
      name, 
      sku,
      description, 
      category,
      brand,
      price, 
      cost_price,
      stock, 
      barcode,
      unit,
      tenant_id, 
      has_variations,
      ncm,
      cest,
      cfop_default,
      tax_origem,
      tax_icms_cst,
      tax_icms_aliquota,
      tax_pis_cst,
      tax_pis_aliquota,
      tax_cofins_cst,
      tax_cofins_aliquota,
      tax_ipi_cst,
      tax_ipi_aliquota
    } = body;
    const price_tiers = Array.isArray(body?.price_tiers) ? body.price_tiers : [];
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const normalizeCodeUpdate = (val: string | null | undefined) => val ? val.replace(/\D/g, '') : null;
    const safeFloatUpdate = (val: any) => {
      if (val === undefined || val === null || val === '') return null;
      const f = parseFloat(val);
      return isNaN(f) ? null : f;
    };

    const updatePayload: any = {
      name,
      sku,
      description,
      category,
      brand,
      unit,
      cost_price: safeFloatUpdate(cost_price),
      sale_price: safeFloatUpdate(price),
      stock_quantity: (stock !== undefined && stock !== null) ? parseInt(stock) : undefined,
      barcode: barcode || null,
      ncm: normalizeCodeUpdate(ncm),
      cest: normalizeCodeUpdate(cest),
      cfop_default: normalizeCodeUpdate(cfop_default),
      tax_origem: tax_origem || '0',
      tax_icms_cst: tax_icms_cst || null,
      tax_icms_aliquota: safeFloatUpdate(tax_icms_aliquota),
      tax_pis_cst: tax_pis_cst || null,
      tax_pis_aliquota: safeFloatUpdate(tax_pis_aliquota),
      tax_cofins_cst: tax_cofins_cst || null,
      tax_cofins_aliquota: safeFloatUpdate(tax_cofins_aliquota),
      tax_ipi_cst: tax_ipi_cst || null,
      tax_ipi_aliquota: safeFloatUpdate(tax_ipi_aliquota),
      updated_at: new Date().toISOString(),
    };
    if (has_variations !== undefined) {
      updatePayload.has_variations = Boolean(has_variations);
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ✅ Atualizar price_tiers (se fornecido) para o produto
    try {
      const resolvedTenantId = tenant_id || (data as any)?.tenant_id;
      const productId = Number((data as any)?.id || id);
      if (resolvedTenantId && productId && Array.isArray(price_tiers) && price_tiers.length > 0) {
        const now = new Date().toISOString();
        const cleaned = price_tiers
          .map((t: any) => ({
            name: String(t?.name || '').trim(),
            price: Number(t?.price),
          }))
          .filter((t: any) => t.name && Number.isFinite(t.price) && t.price > 0);

        const uniqBySlug = new Map<string, { tenant_id: string; name: string; slug: string; is_active: boolean; updated_at: string }>();
        for (const t of cleaned) {
          const slug = slugify(t.name);
          if (!slug) continue;
          if (!uniqBySlug.has(slug)) {
            uniqBySlug.set(slug, { tenant_id: resolvedTenantId, name: t.name, slug, is_active: true, updated_at: now });
          }
        }

        const typesPayload = Array.from(uniqBySlug.values());
        if (typesPayload.length > 0) {
          const { data: typeRows, error: typeErr } = await supabaseAdmin
            .from('product_price_types')
            .upsert(typesPayload, { onConflict: 'tenant_id,slug' })
            .select('id,slug');

          if (!typeErr && typeRows && typeRows.length > 0) {
            const slugToId = new Map<string, number>();
            for (const r of typeRows as any[]) slugToId.set(String(r.slug), Number(r.id));

            const tiersPayload = cleaned
              .map((t: any) => {
                const slug = slugify(t.name);
                const typeId = slugToId.get(slug);
                if (!typeId) return null;
                return {
                  tenant_id: resolvedTenantId,
                  product_id: productId,
                  price_type_id: typeId,
                  price: t.price,
                  updated_at: now,
                };
              })
              .filter(Boolean) as any[];

            if (tiersPayload.length > 0) {
              const { error: tiersErr } = await supabaseAdmin
                .from('product_price_tiers')
                .upsert(tiersPayload, { onConflict: 'tenant_id,product_id,price_type_id' });
              if (tiersErr) console.warn('⚠️ Falha ao salvar price_tiers no PUT:', tiersErr);
            }
          } else if (typeErr) {
            console.warn('⚠️ Falha ao upsert product_price_types no PUT:', typeErr);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao atualizar price_tiers no PUT (ignorado):', e);
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