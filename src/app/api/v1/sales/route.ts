import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/v1/sales
 * Cria uma nova venda via API externa
 * Quando sale_type='entrega', cria automaticamente o registro de entrega
 */
async function createSaleHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const body = await request.json();

    const {
      customer_id,
      customer_name,
      products,
      total_amount,
      payment_method,
      sale_type,
      delivery_address,
      delivery_neighborhood,
      delivery_phone,
      delivery_fee,
      notes,
    } = body;

    // Validações básicas
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de produtos é obrigatória e não pode estar vazia' },
        { status: 400 }
      );
    }

    if (!total_amount || isNaN(Number(total_amount))) {
      return NextResponse.json(
        { success: false, error: 'total_amount é obrigatório e deve ser um número' },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { success: false, error: 'payment_method é obrigatório' },
        { status: 400 }
      );
    }

    // Validação: Para vendas de entrega, cliente é obrigatório
    if (sale_type === 'entrega') {
      if (!customer_id && !customer_name) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cliente é obrigatório para vendas de entrega. É necessário fornecer customer_id ou customer_name' 
          },
          { status: 400 }
        );
      }
      
      // Verificar se customer_name não é "Cliente Avulso" ou vazio
      if (!customer_id && (!customer_name || customer_name.trim() === '' || customer_name.trim().toLowerCase() === 'cliente avulso')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Não é permitido criar venda de entrega sem cliente especificado. É necessário fornecer um customer_id válido ou um customer_name diferente de "Cliente Avulso"' 
          },
          { status: 400 }
        );
      }
    }

    // Buscar dados do cliente se customer_id for fornecido (para usar endereço cadastrado)
    let customerData: any = null;
    if (customer_id) {
      const { data: customer, error: customerError } = await supabaseAdmin
        .from('customers')
        .select('id, name, address, neighborhood, city, state, zipcode, phone')
        .eq('id', Number(customer_id))
        .eq('tenant_id', tenant_id)
        .single();

      if (customerError || !customer) {
        // Se é venda de entrega e o cliente não foi encontrado, retornar erro
        if (sale_type === 'entrega') {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cliente não encontrado. O customer_id fornecido (${customer_id}) não existe no sistema.` 
            },
            { status: 400 }
          );
        }
        // Para vendas de balcão, apenas logar o erro mas continuar
        console.warn('⚠️ Cliente não encontrado:', customer_id, customerError);
      } else {
        customerData = customer;
        console.log('✅ Dados do cliente encontrados:', {
          id: customer.id,
          name: customer.name,
          hasAddress: !!customer.address,
          hasNeighborhood: !!customer.neighborhood,
          hasPhone: !!customer.phone,
        });
      }
    }

    // Gerar número da venda
    const { data: saleNumber, error: numberError } = await supabaseAdmin.rpc('generate_sale_number');

    if (numberError || !saleNumber) {
      console.error('❌ Erro ao gerar número da venda:', numberError);
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar número da venda' },
        { status: 500 }
      );
    }

    // Criar a venda
    const currentDate = new Date();
    const createdAt = currentDate.toISOString();

    const saleData: any = {
      tenant_id,
      user_id: '00000000-0000-0000-0000-000000000000', // API externa usa UUID padrão
      branch_id: null,
      sale_type: sale_type || 'balcao',
      sale_number: saleNumber,
      customer_id: customer_id || null,
      customer_name: sale_type === 'entrega' 
        ? (customer_name || (customerData?.name || 'Cliente não especificado'))
        : (customer_name || 'Cliente Avulso'),
      total_amount: parseFloat(String(total_amount)),
      discount_amount: 0,
      final_amount: parseFloat(String(total_amount)),
      payment_method,
      status: null,
      notes: notes || null,
      sale_source: 'api', // Marcar como venda via API
      created_at: createdAt,
    };

    // Adicionar campos de entrega na venda se aplicável
    if (sale_type === 'entrega') {
      if (delivery_address) {
        saleData.delivery_address = delivery_address;
      }
    }

    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) {
      console.error('❌ Erro ao criar venda:', saleError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar venda: ' + saleError.message },
        { status: 500 }
      );
    }

    // Criar itens da venda
    const saleItems = products.map((product: any) => {
      const subtotal = (Number(product.price) || 0) * (Number(product.quantity) || 0);

      const itemData: any = {
        sale_id: sale.id,
        tenant_id,
        user_id: '00000000-0000-0000-0000-000000000000',
        product_name: product.name || 'Produto',
        unit_price: Number(product.price) || 0,
        quantity: Number(product.quantity) || 0,
        subtotal,
        total_price: subtotal,
      };

      // Adicionar product_id se fornecido
      if (product.product_id !== null && product.product_id !== undefined) {
        itemData.product_id = Number(product.product_id);
      }

      // Adicionar variant_id se fornecido (variação do produto)
      if (product.variant_id !== null && product.variant_id !== undefined) {
        itemData.variant_id = Number(product.variant_id);
      }

      // Adicionar price_type_id se fornecido (tipo de preço usado)
      if (product.price_type_id !== null && product.price_type_id !== undefined) {
        itemData.price_type_id = Number(product.price_type_id);
      }

      return itemData;
    });

    const { error: itemsError } = await supabaseAdmin.from('sale_items').insert(saleItems);

    if (itemsError) {
      console.error('❌ Erro ao criar itens da venda:', itemsError);
      // Tentar deletar a venda criada
      await supabaseAdmin.from('sales').delete().eq('id', sale.id);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar itens da venda: ' + itemsError.message },
        { status: 500 }
      );
    }

    // Se for venda de entrega, criar registro de entrega automaticamente
    // Se a entrega falhar, fazer rollback (deletar venda e itens)
    let delivery = null;
    if (sale_type === 'entrega') {
      // Priorizar endereço do cliente cadastrado, depois usar campos do body
      const finalDeliveryAddress = 
        delivery_address || 
        (customerData?.address ? `${customerData.address}${customerData.neighborhood ? `, ${customerData.neighborhood}` : ''}` : null) ||
        null;
      
      const finalNeighborhood = 
        delivery_neighborhood || 
        customerData?.neighborhood || 
        null;
      
      const finalPhone = 
        delivery_phone || 
        customerData?.phone || 
        null;

      const deliveryData: any = {
        tenant_id,
        user_id: '00000000-0000-0000-0000-000000000000',
        sale_id: sale.id,
        customer_name: customer_name || (customerData?.name || 'Cliente não especificado'),
        delivery_address: finalDeliveryAddress || 'Endereço não informado', // Usar valor padrão se não houver endereço
        neighborhood: finalNeighborhood || null,
        phone: finalPhone || null,
        delivery_fee: delivery_fee ? parseFloat(String(delivery_fee)) : 0,
        status: 'aguardando',
        notes: notes || `Venda de entrega criada via API - Venda #${saleNumber}`,
        branch_id: null, // Usar mesmo branch_id da venda (null para vendas via API)
        created_at: createdAt,
        updated_at: createdAt,
      };

      // Nota: A tabela deliveries não possui coluna customer_id.
      // O relacionamento com o cliente é feito através do sale_id -> sales.customer_id

      const { data: createdDelivery, error: deliveryError } = await supabaseAdmin
        .from('deliveries')
        .insert(deliveryData)
        .select()
        .single();

      if (deliveryError) {
        console.error('❌ Erro ao criar entrega automaticamente:', deliveryError);
        console.error('❌ Delivery data tentado:', JSON.stringify(deliveryData, null, 2));
        
        // Tentar novamente com endereço padrão explícito se o erro for sobre delivery_address
        let retrySucceeded = false;
        if (deliveryError.message?.includes('delivery_address') || 
            deliveryError.code === '23502' || 
            (!finalDeliveryAddress && deliveryError.message?.includes('null'))) {
          
          const retryDeliveryData = {
            ...deliveryData,
            delivery_address: 'Endereço não informado - será atualizado posteriormente',
          };
          
          const { data: retryDelivery, error: retryError } = await supabaseAdmin
            .from('deliveries')
            .insert(retryDeliveryData)
            .select()
            .single();
          
          if (!retryError && retryDelivery) {
            console.log('✅ Entrega criada com sucesso após retry');
            delivery = retryDelivery;
            retrySucceeded = true;
          } else {
            console.error('❌ Erro ao criar entrega mesmo com valor padrão:', retryError);
          }
        }

        // Se ainda não conseguiu criar a entrega (nem no retry), fazer rollback
        if (!retrySucceeded) {
          console.error('❌ Falha ao criar entrega. Fazendo rollback (deletando venda e itens)...');
          
          // Deletar itens da venda primeiro (devido à foreign key)
          await supabaseAdmin
            .from('sale_items')
            .delete()
            .eq('sale_id', sale.id);
          
          // Deletar a venda
          await supabaseAdmin
            .from('sales')
            .delete()
            .eq('id', sale.id);
          
          const errorMessage = `Erro ao criar entrega: ${deliveryError.message}. Código: ${deliveryError.code || 'N/A'}. A venda não foi criada.`;
          
          return NextResponse.json(
            { 
              success: false, 
              error: 'Não foi possível criar a venda de entrega',
              details: errorMessage,
            },
            { status: 500 }
          );
        }
      } else {
        console.log('✅ Entrega criada com sucesso:', createdDelivery?.id);
        delivery = createdDelivery;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sale,
        delivery, // Incluir dados da entrega se foi criada
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de criação de venda:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/sales
 * Lista vendas do tenant
 */
async function listSalesHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sale_type = searchParams.get('sale_type');
    const search = searchParams.get('search'); // Buscar por nome, telefone ou CPF do cliente

    // Se tem busca por nome/telefone/CPF, precisamos buscar via customers primeiro
    let customerIds: number[] | null = null;
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      
      // Buscar clientes que correspondem ao termo de busca
      const { data: customers, error: customerSearchError } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('tenant_id', tenant_id)
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`);

      if (!customerSearchError && customers && customers.length > 0) {
        customerIds = customers.map(c => c.id);
      } else if (!customerSearchError) {
        // Se não encontrou clientes, também buscar por customer_name nas vendas
        customerIds = []; // Array vazio, mas não null para não filtrar
      }
    }

    let query = supabaseAdmin
      .from('sales')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sale_type) {
      query = query.eq('sale_type', sale_type);
    }

    // Filtrar por IDs de clientes se busca foi fornecida
    if (customerIds !== null && search) {
      const searchTerm = search.trim();
      if (customerIds.length === 0) {
        // Se não encontrou clientes, buscar apenas por customer_name nas vendas
        query = query.ilike('customer_name', `%${searchTerm}%`);
      } else {
        // Buscar vendas que têm customer_id nos IDs encontrados OU customer_name correspondente
        // Usamos uma abordagem: buscar vendas com customer_id primeiro, depois unir com customer_name
        // Por limitações do Supabase, vamos fazer duas queries e combinar os resultados
        let queryById = supabaseAdmin
          .from('sales')
          .select('*')
          .eq('tenant_id', tenant_id)
          .in('customer_id', customerIds);

        let queryByName = supabaseAdmin
          .from('sales')
          .select('*')
          .eq('tenant_id', tenant_id)
          .ilike('customer_name', `%${searchTerm}%`);

        // Aplicar filtro de sale_type se fornecido
        if (sale_type) {
          queryById = queryById.eq('sale_type', sale_type);
          queryByName = queryByName.eq('sale_type', sale_type);
        }

        const [resultById, resultByName] = await Promise.all([
          queryById.order('created_at', { ascending: false }),
          queryByName.order('created_at', { ascending: false }),
        ]);

        // Combinar e remover duplicatas
        const combinedSales = [
          ...(resultById.data || []),
          ...(resultByName.data || []),
        ];
        const uniqueSales = combinedSales.filter((sale, index, self) =>
          index === self.findIndex((s) => s.id === sale.id)
        );

        // Ordenar por created_at (mais recente primeiro) e aplicar paginação
        uniqueSales.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const paginatedSales = uniqueSales.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          data: paginatedSales || [],
          pagination: {
            limit,
            offset,
            count: paginatedSales?.length || 0,
          },
        });
      }
    }

    const { data: sales, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar vendas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar vendas: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sales || [],
      pagination: {
        limit,
        offset,
        count: sales?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de listagem de vendas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export const POST = withApiKeyAuth(createSaleHandler, 'sales:create');
export const GET = withApiKeyAuth(listSalesHandler, 'sales:read');
