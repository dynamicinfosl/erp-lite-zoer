
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar vendas
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const salesCrud = new CrudOperations("sales", context.token);
    
    const filters = {
      user_id: context.payload?.sub,
    };

    const sales = await salesCrud.findMany(filters, { 
      limit: limit || 50, 
      offset,
      orderBy: { column: 'sold_at', direction: 'desc' }
    });

    return createSuccessResponse(sales || []);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar vendas",
      status: 500,
    });
  }
}, true);

// POST - criar venda
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createErrorResponse({
        errorMessage: "Itens da venda são obrigatórios",
        status: 400,
      });
    }

    const salesCrud = new CrudOperations("sales", context.token);
    const saleItemsCrud = new CrudOperations("sale_items", context.token);
    const productsCrud = new CrudOperations("products", context.token);
    const stockMovementsCrud = new CrudOperations("stock_movements", context.token);
    const deliveriesCrud = new CrudOperations("deliveries", context.token);
    const financialCrud = new CrudOperations("financial_transactions", context.token);

    // Gerar número da venda
    const saleNumber = `V${Date.now()}`;
    
    // Calcular totais
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of body.items) {
      const product = await productsCrud.findById(item.product_id);
      if (!product || product.user_id !== parseInt(context.payload?.sub || '0')) {
        return createErrorResponse({
          errorMessage: `Produto ${item.product_id} não encontrado`,
          status: 400,
        });
      }

      if (product.stock_quantity < item.quantity) {
        return createErrorResponse({
          errorMessage: `Estoque insuficiente para ${product.name}`,
          status: 400,
        });
      }

      const itemTotal = item.quantity * product.sale_price;
      totalAmount += itemTotal;
      
      validatedItems.push({
        product_id: item.product_id,
        product,
        quantity: item.quantity,
        unit_price: product.sale_price,
        total_price: itemTotal,
      });
    }

    const discountAmount = parseFloat(body.discount_amount) || 0;
    const finalAmount = totalAmount - discountAmount;

    // Criar venda
    const saleData = {
      user_id: context.payload?.sub,
      sale_number: saleNumber,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      payment_method: body.payment_method,
      sale_type: body.sale_type,
      status: 'finalizada',
      notes: body.notes || null,
      sold_at: new Date().toISOString(),
    };

    const sale = await salesCrud.create(saleData);

    // Criar itens da venda
    for (const item of validatedItems) {
      await saleItemsCrud.create({
        user_id: context.payload?.sub,
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      });

      // Atualizar estoque
      const newStock = item.product.stock_quantity - item.quantity;
      await productsCrud.update(item.product_id, {
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      });

      // Registrar movimentação de estoque
      await stockMovementsCrud.create({
        user_id: context.payload?.sub,
        product_id: item.product_id,
        movement_type: 'saida',
        quantity: item.quantity,
        reference_type: 'venda',
        reference_id: sale.id,
        notes: `Venda ${saleNumber}`,
      });
    }

    // Criar entrega se necessário
    if (body.sale_type === 'entrega' && body.customer_info) {
      await deliveriesCrud.create({
        user_id: context.payload?.sub,
        sale_id: sale.id,
        customer_name: body.customer_info.name,
        delivery_address: body.customer_info.address,
        phone: body.customer_info.phone || null,
        delivery_fee: 0,
        status: 'aguardando',
      });
    }

    // Registrar transação financeira
    await financialCrud.create({
      user_id: context.payload?.sub,
      transaction_type: 'receita',
      category: 'Vendas',
      description: `Venda ${saleNumber}`,
      amount: finalAmount,
      payment_method: body.payment_method,
      reference_type: 'venda',
      reference_id: sale.id,
      due_date: new Date().toISOString().split('T')[0],
      paid_date: body.payment_method !== 'fiado' ? new Date().toISOString().split('T')[0] : null,
      status: body.payment_method !== 'fiado' ? 'pago' : 'pendente',
    });

    return createSuccessResponse(sale, 201);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar venda",
      status: 500,
    });
  }
}, true);
