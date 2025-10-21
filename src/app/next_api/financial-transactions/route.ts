
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

    // ✅ BUSCAR DADOS REAIS DO BANCO COM ISOLAMENTO POR TENANT
    try {
      // Usar Supabase diretamente em vez de CrudOperations
      const { createClient } = await import('@supabase/supabase-js');
      
      const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
      const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      const { data: transactions, error: dbError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .limit(limit || 100)
        .range(offset || 0, (offset || 0) + (limit || 100) - 1);

      if (dbError) {
        console.log('❌ Erro ao buscar transações:', dbError.message);
        return createSuccessResponse([]);
      }

      console.log('✅ Transações reais retornadas:', transactions?.length || 0);
      return createSuccessResponse(transactions || []);
    } catch (dbError) {
      console.log('⚠️ Erro ao buscar do banco, retornando lista vazia:', dbError.message);
      // Se não conseguir buscar do banco, retornar lista vazia para evitar dados cruzados
      return createSuccessResponse([]);
    }
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
