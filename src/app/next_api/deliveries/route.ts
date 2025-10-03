
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar entregas
export const GET = requestMiddleware(async (request, context) => {
  try {
    // Em desenvolvimento, se não houver sessão/token, retorne lista vazia para evitar 500
    if (!context?.token || !context?.payload?.sub) {
      return createSuccessResponse([]);
    }
    const { limit, offset } = parseQueryParams(request);
    const deliveriesCrud = new CrudOperations("deliveries", context.token);
    
    const filters = {
      user_id: context.payload?.sub,
    };

    const deliveries = await deliveriesCrud.findMany(filters, { 
      limit: limit || 50, 
      offset,
      orderBy: { column: 'created_at', direction: 'desc' }
    });

    return createSuccessResponse(deliveries || []);
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar entregas",
      status: 500,
    });
  }
}, true);

// PUT - atualizar status da entrega
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da entrega é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const deliveriesCrud = new CrudOperations("deliveries", context.token);
    
    // Verificar se a entrega existe e pertence ao usuário
    const existing = await deliveriesCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Entrega não encontrada",
        status: 404,
      });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;
      
      if (body.status === 'entregue') {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (body.driver_id !== undefined) {
      updateData.driver_id = body.driver_id;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const delivery = await deliveriesCrud.update(id, updateData);
    return createSuccessResponse(delivery);
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar entrega",
      status: 500,
    });
  }
}, true);
