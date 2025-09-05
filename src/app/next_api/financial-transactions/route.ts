
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar transações financeiras
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const transactionsCrud = new CrudOperations("financial_transactions", context.token);
    
    const filters = {
      user_id: context.payload?.sub,
    };

    const transactions = await transactionsCrud.findMany(filters, { 
      limit: limit || 100, 
      offset,
      orderBy: { column: 'created_at', direction: 'desc' }
    });

    return createSuccessResponse(transactions || []);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar transações",
      status: 500,
    });
  }
}, true);

// POST - criar transação financeira
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.description || !body.amount || !body.category || !body.transaction_type) {
      return createErrorResponse({
        errorMessage: "Descrição, valor, categoria e tipo são obrigatórios",
        status: 400,
      });
    }

    const transactionsCrud = new CrudOperations("financial_transactions", context.token);
    
    const transactionData = {
      user_id: context.payload?.sub,
      transaction_type: body.transaction_type,
      category: body.category,
      description: body.description,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method || null,
      reference_type: body.reference_type || null,
      reference_id: body.reference_id || null,
      due_date: body.due_date || new Date().toISOString().split('T')[0],
      paid_date: body.status === 'pago' ? (body.paid_date || new Date().toISOString().split('T')[0]) : null,
      status: body.status || 'pendente',
      notes: body.notes || null,
    };

    const transaction = await transactionsCrud.create(transactionData);
    return createSuccessResponse(transaction, 201);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return createErrorResponse({
      errorMessage: "Erro ao criar transação",
      status: 500,
    });
  }
}, true);

// PUT - atualizar transação financeira
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da transação é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const transactionsCrud = new CrudOperations("financial_transactions", context.token);
    
    // Verificar se a transação existe e pertence ao usuário
    const existing = await transactionsCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Transação não encontrada",
        status: 404,
      });
    }

    const updateData = {
      transaction_type: body.transaction_type,
      category: body.category,
      description: body.description,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method || null,
      due_date: body.due_date || existing.due_date,
      paid_date: body.status === 'pago' ? (body.paid_date || new Date().toISOString().split('T')[0]) : null,
      status: body.status || 'pendente',
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    const transaction = await transactionsCrud.update(id, updateData);
    return createSuccessResponse(transaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar transação",
      status: 500,
    });
  }
}, true);

// DELETE - excluir transação financeira
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da transação é obrigatório",
        status: 400,
      });
    }

    const transactionsCrud = new CrudOperations("financial_transactions", context.token);
    
    // Verificar se a transação existe e pertence ao usuário
    const existing = await transactionsCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Transação não encontrada",
        status: 404,
      });
    }

    await transactionsCrud.delete(id);
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return createErrorResponse({
      errorMessage: "Erro ao excluir transação",
      status: 500,
    });
  }
}, true);
