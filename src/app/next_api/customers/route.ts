
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar clientes
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset, search } = parseQueryParams(request);
    const customersCrud = new CrudOperations("customers", context.token);
    
    const filters = {
      user_id: context.payload?.sub,
      is_active: true,
    };

    let customers = await customersCrud.findMany(filters, { 
      limit: limit || 50, 
      offset,
      orderBy: { column: 'name', direction: 'asc' }
    });

    // Filtro de busca no lado da aplicação
    if (search && customers) {
      customers = customers.filter((customer: any) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email?.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.includes(search) ||
        customer.document?.includes(search)
      );
    }

    return createSuccessResponse(customers || []);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar clientes",
      status: 500,
    });
  }
}, true);

// POST - criar cliente
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name) {
      return createErrorResponse({
        errorMessage: "Nome é obrigatório",
        status: 400,
      });
    }

    const customersCrud = new CrudOperations("customers", context.token);
    // Evitar duplicado por documento (quando informado)
    if (body.document) {
      const existing = await customersCrud.findMany({
        user_id: context.payload?.sub,
        document: body.document,
      }, { limit: 1, offset: 0 });
      if (existing && existing.length > 0) {
        return createErrorResponse({
          errorMessage: "Documento já cadastrado",
          status: 409,
        });
      }
    }
    
    const customerData = {
      user_id: context.payload?.sub,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      document: body.document || null,
      address: body.address || null,
      neighborhood: body.neighborhood || null,
      city: body.city || null,
      state: body.state || null,
      zipcode: body.zipcode || null,
      notes: body.notes || null,
      is_active: body.is_active !== false,
    };

    const customer = await customersCrud.create(customerData);
    return createSuccessResponse(customer, 201);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar cliente",
      status: 500,
    });
  }
}, true);

// PUT - atualizar cliente
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do cliente é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const customersCrud = new CrudOperations("customers", context.token);
    
    // Verificar se o cliente existe e pertence ao usuário
    const existing = await customersCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Cliente não encontrado",
        status: 404,
      });
    }

    const updateData = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      document: body.document || null,
      address: body.address || null,
      neighborhood: body.neighborhood || null,
      city: body.city || null,
      state: body.state || null,
      zipcode: body.zipcode || null,
      notes: body.notes || null,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const customer = await customersCrud.update(id, updateData);
    return createSuccessResponse(customer);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar cliente",
      status: 500,
    });
  }
}, true);

// DELETE - excluir cliente
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do cliente é obrigatório",
        status: 400,
      });
    }

    const customersCrud = new CrudOperations("customers", context.token);
    
    // Verificar se o cliente existe e pertence ao usuário
    const existing = await customersCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Cliente não encontrado",
        status: 404,
      });
    }

    // Soft delete - marcar como inativo
    await customersCrud.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString(),
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return createErrorResponse({
      errorMessage: "Erro ao excluir cliente",
      status: 500,
    });
  }
}, true);
