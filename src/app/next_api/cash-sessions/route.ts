import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET status da sessão atual por register_id
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { register_id } = parseQueryParams(request);
    const sessionsCrud = new CrudOperations('cash_sessions', context.token);

    let session = null;
    if (register_id) {
      const list = await sessionsCrud.findMany({ user_id: context.payload?.sub, register_id, status: 'open' }, { limit: 1 });
      session = list?.[0] || null;
    } else {
      const list = await sessionsCrud.findMany({ user_id: context.payload?.sub, status: 'open' }, { limit: 1 });
      session = list?.[0] || null;
    }

    return createSuccessResponse(session);
  } catch (error) {
    console.error('Erro ao obter sessão de caixa:', error);
    return createErrorResponse({ errorMessage: 'Erro ao obter sessão de caixa', status: 500 });
  }
}, true);

// POST /open - abrir sessão
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const { action } = parseQueryParams(request);
    const sessionsCrud = new CrudOperations('cash_sessions', context.token);
    const transactionsCrud = new CrudOperations('cash_transactions', context.token);

    if (action === 'open') {
      if (!body.register_id) {
        return createErrorResponse({ errorMessage: 'register_id é obrigatório', status: 400 });
      }

      // verificar sessão aberta existente
      const openExists = await sessionsCrud.findMany({ user_id: context.payload?.sub, register_id: body.register_id, status: 'open' }, { limit: 1 });
      if (openExists && openExists.length > 0) {
        return createErrorResponse({ errorMessage: 'Já existe uma sessão aberta para este caixa', status: 400 });
      }

      const openingAmount = parseFloat(body.opening_amount || '0');

      const session = await sessionsCrud.create({
        user_id: context.payload?.sub,
        register_id: body.register_id,
        status: 'open',
        opened_by: context.payload?.sub,
        opening_amount: openingAmount,
        notes: body.notes || null,
      });

      await transactionsCrud.create({
        user_id: context.payload?.sub,
        session_id: session.id,
        type: 'opening',
        method: 'cash',
        amount: openingAmount,
        description: 'Abertura de caixa',
        created_by: context.payload?.sub,
      });

      return createSuccessResponse(session, 201);
    }

    if (action === 'close') {
      const { session_id } = body;
      if (!session_id) {
        return createErrorResponse({ errorMessage: 'session_id é obrigatório', status: 400 });
      }

      const existing = await sessionsCrud.findById(session_id);
      if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
        return createErrorResponse({ errorMessage: 'Sessão não encontrada', status: 404 });
      }

      const closing = {
        status: 'closed',
        closed_by: context.payload?.sub,
        closed_at: new Date().toISOString(),
        closing_amount_cash: parseFloat(body.closing_amount_cash || '0'),
        closing_amount_card: parseFloat(body.closing_amount_card || '0'),
        closing_amount_pix: parseFloat(body.closing_amount_pix || '0'),
        difference_amount: parseFloat(body.difference_amount || '0'),
        difference_reason: body.difference_reason || null,
      };

      const updated = await sessionsCrud.update(session_id, closing);

      await transactionsCrud.create({
        user_id: context.payload?.sub,
        session_id,
        type: 'closing',
        amount: closing.closing_amount_cash + closing.closing_amount_card + closing.closing_amount_pix,
        description: 'Fechamento de caixa',
        created_by: context.payload?.sub,
      });

      return createSuccessResponse(updated);
    }

    return createErrorResponse({ errorMessage: 'Ação inválida', status: 400 });
  } catch (error) {
    console.error('Erro em cash-sessions:', error);
    return createErrorResponse({ errorMessage: 'Erro em cash-sessions', status: 500 });
  }
}, true);


