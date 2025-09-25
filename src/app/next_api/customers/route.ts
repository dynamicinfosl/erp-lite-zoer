
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";
import { getTenantContext, applyTenantFilter, ensureTenantId } from '../../../lib/tenant-utils';

// GET - buscar clientes
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset, search } = parseQueryParams(request);
    
    // Obter contexto do tenant - MODO SIMPLIFICADO SEM RLS
    const tenantContext = await getTenantContext(context.token);
    if (!tenantContext) {
      console.log('❌ Tenant context não encontrado, usando fallback');
      // Fallback: usar tenant padrão se não conseguir obter contexto
      const fallbackTenantId = '00000000-0000-0000-0000-000000000000';
      const customersCrud = new CrudOperations("customers", context.token);
      
      const filters = {
        tenant_id: fallbackTenantId,
        is_active: true,
      };

      const { rows, total } = await customersCrud.findManyWithCount(filters, { 
        limit: limit || 50, 
        offset,
        search: search ? { name: search } : undefined
      });

      return createSuccessResponse({
        data: rows,
        total,
        limit: limit || 50,
        offset: offset || 0
      });
    }

    const customersCrud = new CrudOperations("customers", context.token);
    
    const filters = {
      tenant_id: tenantContext.tenantId,
      is_active: true,
    };

    const { rows, total } = await customersCrud.findManyWithCount(filters, { 
      limit: limit || 50, 
      offset,
      orderBy: { column: 'name', direction: 'asc' }
    });

    // Filtro de busca no lado da aplicação
    let customers = rows;
    if (search && customers) {
      // Filtro em memória (apenas na página atual)
      customers = customers.filter((customer: any) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email?.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.includes(search) ||
        customer.document?.includes(search)
      );
    }

    return createSuccessResponse({ rows: customers || [], total });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar clientes",
      status: 500,
    });
  }
}, false);

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

    // Obter contexto do tenant
    const tenantContext = await getTenantContext(context.token);
    if (!tenantContext) {
      return createErrorResponse({
        errorMessage: "Acesso não autorizado",
        status: 401,
      });
    }

    const customersCrud = new CrudOperations("customers", context.token);
    
    // Upsert: tentar localizar por documento (preferencial) ou email+phone dentro do tenant
    let existing: any = null;
    if (body.document) {
      const found = await customersCrud.findMany({
        tenant_id: tenantContext.tenantId,
        document: body.document,
      }, { limit: 1, offset: 0 });
      existing = found && found.length > 0 ? found[0] : null;
    }
    if (!existing && (body.email || body.phone)) {
      const filters: any = { tenant_id: tenantContext.tenantId };
      if (body.email) filters.email = body.email;
      if (body.phone) filters.phone = body.phone;
      const found = await customersCrud.findMany(filters, { limit: 1, offset: 0 });
      existing = found && found.length > 0 ? found[0] : null;
    }

    // Adicionar tenant_id aos dados (normalizados)
    // Apenas colunas suportadas pela tabela customers
    const allowedKeys = [
      'tenant_id','user_id','name','email','phone','document','address','neighborhood','city','state','zipcode','notes','is_active'
    ];
    const normalized: any = ensureTenantId({
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      document: body.document ?? null,
      address: body.address ?? null,
      neighborhood: body.neighborhood ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zipcode: body.zipcode ?? null,
      notes: body.notes ?? null,
      is_active: body.is_active !== false,
      // Atribuir user_id padrão (SEM RLS) para satisfazer NOT NULL
      user_id: 0,
      // Campos extras são ignorados para evitar erros de schema (attachments, photo, etc.)
    }, tenantContext.tenantId);
    const customerData = Object.fromEntries(Object.entries(normalized).filter(([k]) => allowedKeys.includes(k)));

    console.log('Dados normalizados do cliente:', customerData);

    let customer;
    if (existing) {
      // Atualiza apenas os campos enviados (não sobrescrever com null/undefined)
      const updatePayload = Object.fromEntries(
        Object.entries(customerData).filter(([k, v]) => allowedKeys.includes(k) && v !== undefined)
      );
      customer = await customersCrud.update(existing.id, updatePayload);
      return createSuccessResponse(customer, 200);
    } else {
      customer = await customersCrud.create(customerData);
      return createSuccessResponse(customer, 201);
    }
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return createErrorResponse({
      errorMessage: `Erro ao criar cliente: ${error?.message || error}`,
      status: 500,
    });
  }
}, false);

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
}, false);

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
}, false);
