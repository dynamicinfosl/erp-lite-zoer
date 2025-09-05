
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar entregadores
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const driversCrud = new CrudOperations("delivery_drivers", context.token);
    
    const filters = {
      user_id: context.payload?.sub,
      is_active: true,
    };

    const drivers = await driversCrud.findMany(filters, { 
      limit: limit || 50, 
      offset,
      orderBy: { column: 'name', direction: 'asc' }
    });

    return createSuccessResponse(drivers || []);
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar entregadores",
      status: 500,
    });
  }
}, true);

// POST - criar entregador
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.phone || !body.vehicle_type) {
      return createErrorResponse({
        errorMessage: "Nome, telefone e tipo de veículo são obrigatórios",
        status: 400,
      });
    }

    const driversCrud = new CrudOperations("delivery_drivers", context.token);
    
    const driverData = {
      user_id: context.payload?.sub,
      name: body.name,
      phone: body.phone,
      vehicle_type: body.vehicle_type,
      vehicle_plate: body.vehicle_plate || null,
      is_active: body.is_active !== false,
    };

    const driver = await driversCrud.create(driverData);
    return createSuccessResponse(driver, 201);
  } catch (error) {
    console.error('Erro ao criar entregador:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar entregador",
      status: 500,
    });
  }
}, true);

// PUT - atualizar entregador
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do entregador é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const driversCrud = new CrudOperations("delivery_drivers", context.token);
    
    // Verificar se o entregador existe e pertence ao usuário
    const existing = await driversCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Entregador não encontrado",
        status: 404,
      });
    }

    const updateData = {
      name: body.name,
      phone: body.phone,
      vehicle_type: body.vehicle_type,
      vehicle_plate: body.vehicle_plate || null,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const driver = await driversCrud.update(id, updateData);
    return createSuccessResponse(driver);
  } catch (error) {
    console.error('Erro ao atualizar entregador:', error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar entregador",
      status: 500,
    });
  }
}, true);

// DELETE - excluir entregador
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do entregador é obrigatório",
        status: 400,
      });
    }

    const driversCrud = new CrudOperations("delivery_drivers", context.token);
    
    // Verificar se o entregador existe e pertence ao usuário
    const existing = await driversCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Entregador não encontrado",
        status: 404,
      });
    }

    // Soft delete - marcar como inativo
    await driversCrud.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString(),
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erro ao excluir entregador:', error);
    return createErrorResponse({
      errorMessage: "Erro ao excluir entregador",
      status: 500,
    });
  }
}, true);
