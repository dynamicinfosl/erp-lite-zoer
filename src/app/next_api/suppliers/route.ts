import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - listar fornecedores
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset, search } = parseQueryParams(request);
    const crud = new CrudOperations("suppliers", context.token);

    const filters: Record<string, any> = { user_id: context.payload?.sub || '00000000-0000-0000-0000-000000000000' };

    let result = await crud.findMany(filters, {
      limit: limit || 100,
      offset,
      orderBy: { column: 'created_at', direction: 'desc' }
    });

    if (search) {
      const s = search.toLowerCase();
      result = (result || []).filter((r: any) =>
        r.name?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.phone?.toLowerCase().includes(s)
      );
    }

    return createSuccessResponse(result || []);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    return createErrorResponse({ errorMessage: 'Erro ao buscar fornecedores', status: 500 });
  }
}, false);

// POST - criar fornecedor
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    if (!body.name) {
      return createErrorResponse({ errorMessage: 'Nome é obrigatório', status: 400 });
    }

    const crud = new CrudOperations("suppliers", context.token);
    const userId = context.payload?.sub || '00000000-0000-0000-0000-000000000000';
    
    // Evitar duplicado por documento (quando informado)
    if (body.document) {
      const existing = await crud.findMany({
        user_id: userId,
        document: body.document,
      }, { limit: 1, offset: 0 });
      if (existing && existing.length > 0) {
        return createErrorResponse({ errorMessage: 'Documento já cadastrado', status: 409 });
      }
    }
    const data = await crud.create({
      user_id: userId,
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
      is_active: body.is_active ?? true,
    });

    return createSuccessResponse(data, 201);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    return createErrorResponse({ errorMessage: 'Erro ao criar fornecedor', status: 500 });
  }
}, false);

// PUT - atualizar fornecedor
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    if (!id) {
      return createErrorResponse({ errorMessage: 'ID é obrigatório', status: 400 });
    }
    const body = await validateRequestBody(request);
    const crud = new CrudOperations("suppliers", context.token);
    const data = await crud.update(id as unknown as number, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      document: body.document,
      address: body.address,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      zipcode: body.zipcode,
      notes: body.notes,
      is_active: body.is_active,
      updated_at: new Date().toISOString(),
    });

    return createSuccessResponse(data);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return createErrorResponse({ errorMessage: 'Erro ao atualizar fornecedor', status: 500 });
  }
}, false);

// DELETE - excluir fornecedor
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    if (!id) {
      return createErrorResponse({ errorMessage: 'ID é obrigatório', status: 400 });
    }
    const crud = new CrudOperations("suppliers", context.token);
    await crud.delete(id as unknown as number);
    return createSuccessResponse({ id: Number(id) });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    return createErrorResponse({ errorMessage: 'Erro ao excluir fornecedor', status: 500 });
  }
}, false);


