import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
// IMPORTANTE: este endpoint precisa do service_role para conseguir ler sale_items mesmo com RLS habilitado.
// Se cair no anon key, a listagem de itens tende a vir vazia (0 itens).
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Handler original para criar venda
async function createSaleHandler(request: NextRequest) {
  try {

    const body = await request.json();
    const { 
      customer_id, 
      products, 
      total, 
      total_amount, 
      payment_method, 
      tenant_id, 
      user_id, 
      branch_id,
      sale_type,
      sale_source,
      customer_name,
      seller_name,
      carrier_name,
      payment_condition,
      delivery_date,
      delivery_address,
      notes
    } = body;
    
    // Usar total_amount se fornecido, senão usar total
    const finalTotal = total_amount || total;

    console.log('📝 Dados recebidos na venda:', { 
      tenant_id, 
      total, 
      finalTotal, 
      payment_method, 
      productsCount: products?.length,
      customer_name: body.customer_name,
      user_id: user_id 
    });

    // ✅ DEBUG: Log detalhado do tenant_id
    console.log('🔍 DEBUG - Tenant ID recebido:', tenant_id);
    console.log('🔍 DEBUG - Tipo do tenant_id:', typeof tenant_id);
    console.log('🔍 DEBUG - Tenant_id é string vazia?', tenant_id === '');
    console.log('🔍 DEBUG - Tenant_id é null?', tenant_id === null);
    console.log('🔍 DEBUG - Tenant_id é undefined?', tenant_id === undefined);

    if (!products || !finalTotal) {
      return NextResponse.json(
        { error: 'Produtos e total são obrigatórios' },
        { status: 400 }
      );
    }

    if (!tenant_id || tenant_id === '00000000-0000-0000-0000-000000000000') {
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    // ✅ Verificar se o tenant existe na base de dados
    const { data: tenantExists, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenantExists) {
      console.error('❌ Tenant não encontrado:', tenant_id, tenantError);
      
      // ✅ Tentar criar o tenant se não existir
      console.log('🔄 Tentando criar tenant:', tenant_id);
      
      try {
        const { data: newTenant, error: createError } = await supabaseAdmin
          .from('tenants')
          .insert({
            id: tenant_id,
            name: 'Minha Empresa',
            slug: `tenant-${tenant_id.slice(0, 8)}`,
            status: 'trial',
            email: null,
            phone: null,
            document: null,
            address: null,
            city: null,
            state: null,
            zip_code: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Erro ao criar tenant:', createError);
          return NextResponse.json(
            { error: 'Erro ao criar tenant: ' + createError.message },
            { status: 400 }
          );
        }

        console.log('✅ Tenant criado com sucesso:', newTenant.id);
      } catch (error) {
        console.error('❌ Erro ao criar tenant:', error);
        return NextResponse.json(
          { error: 'Erro ao criar tenant: ' + (error instanceof Error ? error.message : String(error)) },
          { status: 400 }
        );
      }
    } else {
      console.log('✅ Tenant validado:', tenantExists.id);
    }

    // Gerar número da venda (versão simplificada)
    const { data: saleNumber, error: numberError } = await supabaseAdmin
      .rpc('generate_sale_number');

    if (numberError) {
      console.error('Erro ao gerar número da venda:', numberError);
      return NextResponse.json(
        { error: 'Erro ao gerar número da venda' },
        { status: 400 }
      );
    }

    // Criar a venda (versão simplificada)
    const currentDate = new Date();
    const createdAt = currentDate.toISOString();
    
    console.log('📅 Data da venda sendo criada:', {
      iso: createdAt,
      local: currentDate.toLocaleString('pt-BR'),
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
      day: currentDate.getDate()
    });
    
    const saleData: any = {
      tenant_id: tenant_id, // ✅ Usar tenant_id validado
      user_id: user_id || '00000000-0000-0000-0000-000000000000', // ✅ Adicionar user_id
      branch_id: branch_id || null,
      sale_type: sale_type || null, // ✅ Usar NULL como padrão
      sale_number: saleNumber,
      customer_id: customer_id || null,
      customer_name: customer_name || body.customer_name || 'Cliente Avulso',
      total_amount: parseFloat(finalTotal),
      final_amount: parseFloat(finalTotal),
      payment_method,
      status: null, // ✅ Usar NULL para evitar constraint
      notes: notes || body.notes || null,
      created_at: createdAt,
    };

    // Adicionar novos campos se fornecidos
    if (sale_source) {
      saleData.sale_source = sale_source;
    }
    if (seller_name) {
      saleData.seller_name = seller_name;
    }
    if (carrier_name) {
      saleData.carrier_name = carrier_name;
    }
    if (payment_condition) {
      saleData.payment_condition = payment_condition;
    }
    if (delivery_date) {
      saleData.delivery_date = delivery_date;
    }
    if (delivery_address) {
      saleData.delivery_address = delivery_address;
    }

    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao criar venda:', saleError);
      return NextResponse.json(
        { error: 'Erro ao criar venda: ' + saleError.message },
        { status: 400 }
      );
    }

    // Criar itens da venda (versão simplificada sem discount_percentage)
    const saleItems = products.map((product: any) => {
      const discountAmount = (product.price * product.quantity * (product.discount || 0)) / 100;
      const subtotal = (product.price * product.quantity) - discountAmount;
      
      // Permitir product_id como null para vendas importadas ou sem produto específico
      const itemData: any = {
        sale_id: sale.id,
        tenant_id: tenant_id, // ✅ REATIVADO - coluna agora existe na tabela
        user_id: user_id || '00000000-0000-0000-0000-000000000000', // ✅ Adicionar user_id
        product_name: product.name || 'Produto',
        // product_code: product.code, // ✅ Removido temporariamente
        unit_price: product.price,
        quantity: product.quantity,
        // discount_percentage: product.discount || 0, // ✅ Removido temporariamente
        subtotal: subtotal,
        total_price: subtotal, // ✅ Adicionar total_price (mesmo valor do subtotal)
      };

      // Adicionar product_id apenas se fornecido (pode ser null para vendas importadas)
      if (product.id !== null && product.id !== undefined) {
        itemData.product_id = product.id;
      }

      // Adicionar variant_id se fornecido (variação do produto)
      if (product.variant_id !== null && product.variant_id !== undefined) {
        itemData.variant_id = product.variant_id;
      }

      // Adicionar price_type_id se fornecido (tipo de preço usado)
      if (product.price_type_id !== null && product.price_type_id !== undefined) {
        itemData.price_type_id = product.price_type_id;
      }
      
      return itemData;
    });

    // ✅ DEBUG: Log dos itens antes da inserção
    console.log('📦 Itens da venda a serem inseridos:', saleItems.length);
    console.log('📦 Primeiro item:', saleItems[0]);
    console.log('📦 Tenant ID nos itens:', saleItems[0]?.tenant_id);
    console.log('📦 Sale ID nos itens:', saleItems[0]?.sale_id);

    // ✅ Usar service role que tem bypass de RLS
    const { error: itemsError } = await supabaseAdmin
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('❌ Erro ao criar itens da venda:', itemsError);
      console.error('❌ Detalhes do erro:', {
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
        code: itemsError.code
      });
      
      // Tentar deletar a venda criada
      await supabaseAdmin.from('sales').delete().eq('id', sale.id);
      return NextResponse.json(
        { error: 'Erro ao criar itens da venda: ' + itemsError.message },
        { status: 400 }
      );
    }

    console.log('✅ Itens da venda criados com sucesso');
    console.log('✅ Venda completa criada:', sale.id);

    return NextResponse.json({ success: true, data: sale });

  } catch (error: any) {
    console.error('❌ Erro no handler de criação:', error);
    console.error('❌ Stack trace:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error?.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handler original para listar vendas
async function listSalesHandler(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const today = searchParams.get('today');
    const tenant_id = searchParams.get('tenant_id');
    const sale_source = searchParams.get('sale_source');
    const branch_id = searchParams.get('branch_id'); // ✅ Novo: filtrar por filial
    const branch_scope = searchParams.get('branch_scope'); // 'all' | 'branch'
    const tzParam = searchParams.get('tz'); // minutos de offset do fuso (ex: -180 para BRT)

    console.log(`💰 [SALES API] GET /sales INICIADO`);
    console.log(`💰 [SALES API] tenant_id: ${tenant_id}`);
    console.log(`💰 [SALES API] branch_id: ${branch_id}`);
    console.log(`💰 [SALES API] branch_scope: ${branch_scope}`);
    console.log(`💰 [SALES API] today: ${today}`);
    console.log(`💰 [SALES API] sale_source: ${sale_source}`);
    console.log(`💰 [SALES API] tz: ${tzParam}`);
    console.log(`💰 [SALES API] URL completa: ${request.url}`);

    // Buscar apenas as vendas (sem JOIN para evitar erro de relacionamento)
    let query = supabaseAdmin
      .from('sales')
      .select('*');

    // Filtrar por tenant_id se fornecido
    if (tenant_id && tenant_id !== '00000000-0000-0000-0000-000000000000') {
      query = query.eq('tenant_id', tenant_id);
      console.log(`🔍 Buscando vendas com tenant_id: ${tenant_id}`);
    } else {
      console.log('⚠️ GET /sales - Nenhum tenant_id válido fornecido');
    }

    // ✅ Filtrar por branch_id ou branch_scope
    // - Se branch_scope='all': buscar TODAS as vendas do tenant (sem filtrar por branch_id)
    // - Se branch_id fornecido: buscar vendas daquela filial específica
    if (branch_scope === 'all') {
      // Buscar TODAS as vendas do tenant (sem filtrar por branch_id)
      // Isso inclui vendas da matriz (branch_id IS NULL ou branch_id da HQ) e todas as filiais
      console.log(`🔍 [Matriz] Buscando TODAS as vendas do tenant (branch_scope=all)`);
      // Não aplicar filtro de branch_id - buscar todas
    } else if (branch_id) {
      const bid = Number(branch_id);
      if (Number.isFinite(bid) && bid > 0) {
        query = query.eq('branch_id', bid);
        console.log(`🔍 Filtrando vendas da filial: ${bid}`);
      } else {
        // Se branch_id inválido, não retornar nada
        console.log(`⚠️ branch_id inválido, retornando array vazio`);
        return NextResponse.json({ success: true, data: [] });
      }
    } else {
      // Se não tem branch_id nem branch_scope='all', não retornar vendas
      console.log(`⚠️ Sem branch_id ou branch_scope='all' fornecido, retornando array vazio`);
      return NextResponse.json({ success: true, data: [] });
    }

    // Filtrar por sale_source se fornecido
    if (sale_source) {
      query = query.eq('sale_source', sale_source);
      console.log(`🔍 Filtrando por sale_source: ${sale_source}`);
    }

    // Se solicitado apenas vendas de hoje
    if (today === 'true') {
      console.log('🗓️ [SALES API] Filtrando vendas de hoje...');
      
      // Offset do fuso do cliente em minutos (Brasil = -180, ou seja, UTC-3)
      const clientOffsetMin = Number.isFinite(Number(tzParam)) ? parseInt(tzParam as string, 10) : 0;
      console.log('🕐 [SALES API] Client offset (minutos):', clientOffsetMin);
      
      // Pegar a hora atual no fuso do cliente
      const nowUtc = new Date();
      const nowClientTime = new Date(nowUtc.getTime() + clientOffsetMin * 60000);
      
      console.log('🕐 [SALES API] Hora atual UTC:', nowUtc.toISOString());
      console.log('🕐 [SALES API] Hora atual no cliente:', nowClientTime.toISOString());
      
      // Meia-noite de hoje no fuso do cliente
      const midnightClient = new Date(Date.UTC(
        nowClientTime.getUTCFullYear(),
        nowClientTime.getUTCMonth(),
        nowClientTime.getUTCDate(),
        0, 0, 0, 0
      ));
      
      // Converter de volta para UTC (subtraindo o offset)
      const startUtc = new Date(midnightClient.getTime() - clientOffsetMin * 60000);
      const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

      console.log('📅 [SALES API] Janela de busca:');
      console.log('   Meia-noite cliente (hora local):', midnightClient.toISOString());
      console.log('   Start UTC (00:00 cliente):', startUtc.toISOString());
      console.log('   End UTC (23:59 cliente):', endUtc.toISOString());

      query = query
        .gte('created_at', startUtc.toISOString())
        .lte('created_at', endUtc.toISOString());
    }

    console.log('🔄 [SALES API] Executando query no banco...');
    let { data, error } = await query.order('created_at', { ascending: false });

    console.log('📊 [SALES API] Query executada!');
    console.log('📊 [SALES API] Erro:', error ? JSON.stringify(error) : 'null');
    console.log('📊 [SALES API] Dados recebidos:', data ? `${data.length} registros` : 'null');

    if (error) {
      console.error('❌ [SALES API] Erro ao listar vendas:', error);
      return NextResponse.json(
        { error: 'Erro ao listar vendas: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [SALES API] Vendas encontradas: ${data?.length || 0} para tenant: ${tenant_id}`);
    if (data && data.length > 0) {
      console.log('📋 [SALES API] Primeira venda encontrada:', JSON.stringify(data[0], null, 2));
    }
    
    // Buscar itens de venda para cada venda
    // Importante: IDs podem ser number OU string/UUID, então trabalhamos sempre com string para compatibilidade.
    if (data && data.length > 0) {
      const saleIds = (data || [])
        .map((sale: any) => sale?.id)
        .filter((id: any) => id !== null && id !== undefined && String(id).trim() !== '');

      console.log(`🔍 Buscando itens para ${saleIds.length} vendas...`);

      if (saleIds.length === 0) {
        console.warn('⚠️ Nenhum ID de venda válido encontrado para buscar itens');
      } else {
        // Supabase/PostgREST costuma aplicar limite (~1000) por request.
        // Se buscarmos itens de centenas de vendas numa única query, os itens das vendas mais recentes podem ficar fora.
        // Então buscamos em LOTES (chunks) por sale_id para garantir que venha tudo.
        const chunkSize = 10; // conservador para evitar estourar o limite de linhas
        const chunks: string[][] = [];
        for (let i = 0; i < saleIds.length; i += chunkSize) {
          chunks.push(saleIds.slice(i, i + chunkSize).map((x: any) => String(x)));
        }

        let allItems: any[] = [];
        for (const chunk of chunks) {
          const { data: chunkItems, error: chunkError } = await supabaseAdmin
            .from('sale_items')
            .select('sale_id, product_id, variant_id, price_type_id, product_name, unit_price, quantity, subtotal, total_price')
            .in('sale_id', chunk);

          if (chunkError) {
            console.error('❌ Erro ao buscar itens de venda (chunk):', chunkError, { chunkSize: chunk.length });
            continue;
          }

          const count = chunkItems?.length || 0;
          if (count >= 1000) {
            console.warn('⚠️ Chunk retornou 1000 itens (pode estar truncado). Considere reduzir chunkSize.', { chunkSize: chunk.length });
          }

          allItems = allItems.concat(chunkItems || []);
        }

        console.log(`✅ Itens encontrados (total): ${allItems.length}`);

        // Agrupar itens por sale_id (usar string para garantir compatibilidade)
        const itemsBySaleId: Record<string, any[]> = {};
        allItems.forEach((item: any) => {
          const saleId = String(item.sale_id || '');
          if (saleId) {
            if (!itemsBySaleId[saleId]) {
              itemsBySaleId[saleId] = [];
            }
            itemsBySaleId[saleId].push(item);
          } else {
            console.warn(`⚠️ sale_id inválido no item:`, item.sale_id, item);
          }
        });

        console.log(`📊 Itens agrupados por sale_id:`, Object.keys(itemsBySaleId).length, 'vendas com itens');

        // Adicionar itens a cada venda
        data = data.map((sale: any) => {
          const saleId = String(sale.id || '');
          const saleItems = itemsBySaleId[saleId] || [];
          console.log(`📦 Venda ${sale.sale_number} (ID: ${saleId}): ${saleItems.length} itens`);
          return {
            ...sale,
            items: saleItems,
          };
        });
      }
    }
    
    // Debug: verificar se os itens foram adicionados
    if (data && data.length > 0) {
      const totalItems = data.reduce((sum: number, sale: any) => sum + (sale.items?.length || 0), 0);
      console.log(`✅ Total de itens em todas as vendas: ${totalItems}`);
    }
    
    // Retornar no formato esperado pelo frontend
    console.log('✅ [SALES API] Preparando resposta...');
    if (today === 'true') {
      console.log(`✅ [SALES API] Retornando ${data?.length || 0} vendas no formato 'sales'`);
      return NextResponse.json(
        { success: true, sales: data },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } else {
      console.log(`✅ [SALES API] Retornando ${data?.length || 0} vendas no formato 'data'`);
      return NextResponse.json(
        { success: true, data: data },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers com validação de plano
export const POST = withPlanValidation(createSaleHandler, 'create_sale');
export const GET = listSalesHandler;