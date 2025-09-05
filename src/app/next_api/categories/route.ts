
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar categorias
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const categoriesCrud = new CrudOperations("categories", context.token);
    
    const filters = {
      is_active: true,
    };

    const categories = await categoriesCrud.findMany(filters, { 
      limit: limit || 50, 
      offset,
      orderBy: { column: 'name', direction: 'asc' }
    });

    return createSuccessResponse(categories || []);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar categorias",
      status: 500,
    });
  }
}, true);

// POST - criar categoria
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name) {
      return createErrorResponse({
        errorMessage: "Nome da categoria é obrigatório",
        status: 400,
      });
    }

    const categoriesCrud = new CrudOperations("categories", context.token);
    
    const categoryData = {
      name: body.name,
      description: body.description || null,
      color: body.color || '#2c3e50',
      is_active: body.is_active !== false,
    };

    const category = await categoriesCrud.create(categoryData);
    return createSuccessResponse(category, 201);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar categoria",
      status: 500,
    });
  }
}, true);

// PUT - atualizar categoria
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da categoria é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const categoriesCrud = new CrudOperations("categories", context.token);
    
    const existing = await categoriesCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Categoria não encontrada",
        status: 404,
      });
    }

    const updateData = {
      name: body.name,
      description: body.description || null,
      color: body.color || '#2c3e50',
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const category = await categoriesCrud.update(id, updateData);
    return createSuccessResponse(category);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar categoria",
      status: 500,
    });
  }
}, true);

// DELETE - excluir categoria
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da categoria é obrigatório",
        status: 400,
      });
    }

    const categoriesCrud = new CrudOperations("categories", context.token);
    
    const existing = await categoriesCrud.findById(id);
    if (!existing) {
      return createErrorResponse({
        errorMessage: "Categoria não encontrada",
        status: 404,
      });
    }

    // Soft delete - marcar como inativa
    await categoriesCrud.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString(),
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return createErrorResponse({
      errorMessage: "Erro ao excluir categoria",
      status: 500,
    });
  }
}, true);
