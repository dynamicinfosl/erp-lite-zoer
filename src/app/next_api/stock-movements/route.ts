
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar movimentações de estoque
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const movementsCrud = new CrudOperations("stock_movements", context.token);
    
    const filters = {
      user_id: context.payload?.sub || '00000000-0000-0000-0000-000000000000',
    };

    const movements = await movementsCrud.findMany(filters, { 
      limit: limit || 100, 
      offset,
      orderBy: { column: 'created_at', direction: 'desc' }
    });

    return createSuccessResponse(movements || []);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar movimentações",
      status: 500,
    });
  }
}, false);

// POST - criar movimentação de estoque
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.product_id || !body.movement_type || !body.quantity) {
      return createErrorResponse({
        errorMessage: "Produto, tipo de movimentação e quantidade são obrigatórios",
        status: 400,
      });
    }

    const movementsCrud = new CrudOperations("stock_movements", context.token);
    const productsCrud = new CrudOperations("products", context.token);
    
    // Verificar se o produto existe e pertence ao usuário
    const product = await productsCrud.findById(body.product_id);
    if (!product || product.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Produto não encontrado",
        status: 404,
      });
    }

    // Calcular novo estoque
    let newStock = product.stock_quantity;
    const quantity = parseInt(body.quantity);
    
    switch (body.movement_type) {
      case 'entrada':
        newStock += quantity;
        break;
      case 'saida':
        newStock -= quantity;
        break;
      case 'ajuste':
        newStock = quantity; // Ajuste define o valor absoluto
        break;
    }

    if (newStock < 0) {
      return createErrorResponse({
        errorMessage: "Estoque não pode ficar negativo",
        status: 400,
      });
    }

    // Criar movimentação
    const movementData = {
      user_id: context.payload?.sub || '00000000-0000-0000-0000-000000000000',
      product_id: body.product_id,
      movement_type: body.movement_type,
      quantity: body.movement_type === 'ajuste' ? 
        (quantity - product.stock_quantity) : // Para ajuste, registra a diferença
        quantity,
      unit_cost: body.unit_cost ? parseFloat(body.unit_cost) : null,
      reference_type: body.reference_type || 'ajuste',
      reference_id: body.reference_id || null,
      notes: body.notes || null,
    };

    const movement = await movementsCrud.create(movementData);

    // Atualizar estoque do produto
    await productsCrud.update(body.product_id, {
      stock_quantity: newStock,
      updated_at: new Date().toISOString(),
    });

    return createSuccessResponse(movement, 201);
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar movimentação",
      status: 500,
    });
  }
}, false);
