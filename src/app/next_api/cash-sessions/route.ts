import { NextRequest } from "next/server";
import { CrudOperations } from "@/lib/crud-operations";
import { createSuccessResponse, createErrorResponse } from "@/lib/create-response";
import { getTenantContext, ensureTenantId } from "@/lib/tenant-utils";

interface CashSessionQuery {
  register_id?: string;
  status?: string;
}

export const GET = requestMiddleware(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const query: CashSessionQuery = {
      register_id: searchParams.get("register_id") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    };

    const tenantContext = await getTenantContext(context.token);
    const cashSessionsCrud = new CrudOperations("cash_sessions", context.token);
    const filters = ensureTenantId({ ...query }, tenantContext.tenantId);
    const { rows } = await cashSessionsCrud.findMany(filters, { limit: 100 });

    return createSuccessResponse({ data: rows });
  } catch (error) {
    console.error("Erro ao listar sessões de caixa:", error);
    return createErrorResponse("Erro ao listar sessões de caixa", 500);
  }
}, true);

interface CashSessionBody {
  register_id: string;
  opened_at: string;
  initial_amount: number;
  status?: string;
  notes?: string;
}

export const POST = requestMiddleware(async (request, context) => {
  try {
    const body: CashSessionBody = await request.json();
    const tenantContext = await getTenantContext(context.token);

    const cashSessionsCrud = new CrudOperations("cash_sessions", context.token);
    const data = ensureTenantId(body, tenantContext.tenantId);

    const created = await cashSessionsCrud.create(data);
    return createSuccessResponse({ data: created }, 201);
  } catch (error) {
    console.error("Erro ao criar sessão de caixa:", error);
    return createErrorResponse("Erro ao criar sessão de caixa", 500);
  }
}, true);

interface CashSessionParams {
  params: { id: string };
}

export const PATCH = requestMiddleware(async (request, context, { params }: CashSessionParams) => {
  try {
    const body = (await request.json()) as Partial<CashSessionBody> & {
      closed_at?: string;
      closing_amount?: number;
      action?: string;
    };

    const tenantContext = await getTenantContext(context.token);
    const cashSessionsCrud = new CrudOperations("cash_sessions", context.token);

    const data = ensureTenantId(body, tenantContext.tenantId);
    const updated = await cashSessionsCrud.update(params.id, data);

    return createSuccessResponse({ data: updated });
  } catch (error) {
    console.error("Erro ao atualizar sessão de caixa:", error);
    return createErrorResponse("Erro ao atualizar sessão de caixa", 500);
  }
}, true);

export const DELETE = requestMiddleware(async (_request, context, { params }: CashSessionParams) => {
  try {
    const tenantContext = await getTenantContext(context.token);
    const cashSessionsCrud = new CrudOperations("cash_sessions", context.token);

    await cashSessionsCrud.delete(params.id, tenantContext.tenantId);
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Erro ao excluir sessão de caixa:", error);
    return createErrorResponse("Erro ao excluir sessão de caixa", 500);
  }
}, true);


