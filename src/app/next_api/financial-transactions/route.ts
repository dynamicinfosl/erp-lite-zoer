
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar transações financeiras
export const GET = requestMiddleware(async (request, context) => {
  try {
    const queryParams = parseQueryParams(request);
    const { limit, offset, tenant_id } = queryParams;
    
    if (!tenant_id) {
      return createErrorResponse({
        errorMessage: "tenant_id é obrigatório",
        status: 400,
      });
    }

    console.log('📊 Buscando transações financeiras para tenant:', tenant_id);

    // Dados mockados temporariamente até a tabela ser criada
    const mockTransactions = [
      {
        id: '1',
        tenant_id: tenant_id,
        transaction_type: 'receita',
        category: 'Vendas',
        description: 'Venda de produto A',
        amount: 150.00,
        payment_method: 'PIX',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        status: 'pago',
        notes: 'Pagamento recebido',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        tenant_id: tenant_id,
        transaction_type: 'despesa',
        category: 'Fornecedores',
        description: 'Compra de materiais',
        amount: 75.50,
        payment_method: 'Cartão',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: null,
        status: 'pendente',
        notes: 'Aguardando pagamento',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('✅ Transações mockadas retornadas:', mockTransactions.length);

    return createSuccessResponse(mockTransactions);
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
