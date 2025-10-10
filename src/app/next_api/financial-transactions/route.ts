
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - buscar transações financeiras
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Buscando transações financeiras...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    
    if (!tenantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'tenant_id é obrigatório' 
      }, { status: 400 });
    }

    console.log('🔍 Buscando transações para tenant:', tenantId);

    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar transações' 
      }, { status: 500 });
    }

    console.log('✅ Transações encontradas:', transactions?.length || 0);
    return NextResponse.json({ 
      success: true, 
      data: transactions || [] 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST - criar transação financeira
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Criando transação financeira...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    console.log('📝 Dados recebidos:', body);
    
    // Debug: verificar se tenant_id está presente
    if (!body.tenant_id) {
      console.error('❌ tenant_id não encontrado nos dados:', body);
      return NextResponse.json({ 
        success: false, 
        error: 'tenant_id é obrigatório' 
      }, { status: 400 });
    }
    
    if (!body.description || !body.amount || !body.category || !body.transaction_type) {
      console.error('❌ Campos obrigatórios faltando:', {
        description: !!body.description,
        amount: !!body.amount,
        category: !!body.category,
        transaction_type: !!body.transaction_type
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Descrição, valor, categoria e tipo são obrigatórios' 
      }, { status: 400 });
    }

    // Validar valor (não pode ser negativo)
    const amount = parseFloat(body.amount) || 0;
    if (amount < 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valor não pode ser negativo' 
      }, { status: 400 });
    }
    
    const transactionData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Usuário padrão
      tenant_id: body.tenant_id,
      transaction_type: body.transaction_type,
      category: body.category,
      description: body.description,
      amount: amount,
      payment_method: body.payment_method || null,
      reference_type: body.reference_type || null,
      reference_id: body.reference_id || null,
      due_date: body.due_date || new Date().toISOString().split('T')[0],
      paid_date: body.status === 'pago' ? (body.paid_date || new Date().toISOString().split('T')[0]) : null,
      status: body.status || 'pendente',
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Salvando no banco:', transactionData);

    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar transação:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar transação' 
      }, { status: 500 });
    }

    console.log('✅ Transação salva com sucesso:', transaction);
    return NextResponse.json({ 
      success: true, 
      data: transaction 
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// PUT - atualizar transação financeira
export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ Atualizando transação financeira...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID da transação é obrigatório' 
      }, { status: 400 });
    }

    const body = await request.json();
    console.log('📝 Dados de atualização:', body);
    
    // Validar valor se fornecido (não pode ser negativo)
    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Valor deve ser um número positivo' 
        }, { status: 400 });
      }
    }

    const updateData = {
      ...(body.transaction_type && { transaction_type: body.transaction_type }),
      ...(body.category && { category: body.category }),
      ...(body.description && { description: body.description }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.payment_method !== undefined && { payment_method: body.payment_method }),
      ...(body.due_date !== undefined && { due_date: body.due_date }),
      ...(body.status !== undefined && { 
        status: body.status,
        paid_date: body.status === 'pago' ? (body.paid_date || new Date().toISOString().split('T')[0]) : null
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Atualizando transação:', updateData);

    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar transação' 
      }, { status: 500 });
    }

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transação não encontrada' 
      }, { status: 404 });
    }

    console.log('✅ Transação atualizada com sucesso:', transaction);
    return NextResponse.json({ 
      success: true, 
      data: transaction 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar transação:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// DELETE - excluir transação financeira
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deletando transação financeira...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID da transação é obrigatório' 
      }, { status: 400 });
    }

    console.log('🗑️ Deletando transação ID:', id);

    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar transação:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao deletar transação' 
      }, { status: 500 });
    }

    console.log('✅ Transação deletada com sucesso');
    return NextResponse.json({ 
      success: true, 
      data: { id } 
    });
  } catch (error) {
    console.error('❌ Erro ao deletar transação:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
