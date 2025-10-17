
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
    
    const filters: any = {
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

// POST - criar nova entrega
export const POST = requestMiddleware(async (request, context) => {
  try {
    if (!context?.token || !context?.payload?.sub) {
      return createErrorResponse({
        errorMessage: "Autenticação necessária",
        status: 401,
      });
    }

    const body = await validateRequestBody(request);
    
    // Validações
    if (!body.customer_name) {
      return createErrorResponse({
        errorMessage: "Nome do cliente é obrigatório",
        status: 400,
      });
    }
    
    if (!body.delivery_address) {
      return createErrorResponse({
        errorMessage: "Endereço de entrega é obrigatório",
        status: 400,
      });
    }

    if (!body.tenant_id) {
      return createErrorResponse({
        errorMessage: "Tenant ID é obrigatório",
        status: 400,
      });
    }

    const deliveriesCrud = new CrudOperations("deliveries", context.token);
    
    const deliveryData = {
      user_id: parseInt(context.payload?.sub || '0'),
      tenant_id: body.tenant_id,
      sale_id: body.sale_id || null,
      customer_name: body.customer_name,
      delivery_address: body.delivery_address,
      neighborhood: body.neighborhood || null,
      phone: body.phone || null,
      delivery_fee: body.delivery_fee || 0,
      status: body.status || 'aguardando',
      notes: body.notes || null,
      driver_id: body.driver_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const delivery = await deliveriesCrud.create(deliveryData);
    return createSuccessResponse(delivery);
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar entrega",
      status: 500,
    });
  }
}, true);

// PUT - atualizar status da entrega
export const PUT = requestMiddleware(async (request, context) => {
  try {
    if (!context?.token || !context?.payload?.sub) {
      return createErrorResponse({
        errorMessage: "Autenticação necessária",
        status: 401,
      });
    }

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

    // Validar status se fornecido
    if (body.status) {
      const validStatuses = ['aguardando', 'em_rota', 'entregue', 'cancelada'];
      if (!validStatuses.includes(body.status)) {
        return createErrorResponse({
          errorMessage: "Status inválido. Use: aguardando, em_rota, entregue ou cancelada",
          status: 400,
        });
      }
      
      updateData.status = body.status;
      
      if (body.status === 'entregue' && !existing.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (body.driver_id !== undefined) {
      updateData.driver_id = body.driver_id;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.customer_name) {
      updateData.customer_name = body.customer_name;
    }

    if (body.delivery_address) {
      updateData.delivery_address = body.delivery_address;
    }

    if (body.neighborhood !== undefined) {
      updateData.neighborhood = body.neighborhood;
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    if (body.delivery_fee !== undefined) {
      updateData.delivery_fee = body.delivery_fee;
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

// DELETE - deletar entrega
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    if (!context?.token || !context?.payload?.sub) {
      return createErrorResponse({
        errorMessage: "Autenticação necessária",
        status: 401,
      });
    }

    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da entrega é obrigatório",
        status: 400,
      });
    }

    const deliveriesCrud = new CrudOperations("deliveries", context.token);
    
    // Verificar se a entrega existe e pertence ao usuário
    const existing = await deliveriesCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Entrega não encontrada",
        status: 404,
      });
    }

    // Não permitir deletar entregas entregues
    if (existing.status === 'entregue') {
      return createErrorResponse({
        errorMessage: "Não é possível deletar entregas já finalizadas",
        status: 400,
      });
    }

    await deliveriesCrud.delete(id);
    return createSuccessResponse({ message: "Entrega deletada com sucesso" });
  } catch (error) {
    console.error('Erro ao deletar entrega:', error);
    return createErrorResponse({
      errorMessage: "Erro ao deletar entrega",
      status: 500,
    });
  }
}, true);
