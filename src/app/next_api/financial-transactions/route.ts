import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurações hardcoded para garantir funcionamento
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET - buscar transações financeiras
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📊 Buscando transações financeiras para tenant:', tenant_id);

    try {
      const { data: transactions, error: dbError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (dbError) {
        console.log('❌ Erro ao buscar transações:', dbError);
        return NextResponse.json({ success: true, data: [] });
      }

      console.log('✅ Transações reais retornadas:', transactions?.length || 0);
      return NextResponse.json({ success: true, data: transactions || [] });

    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.log('⚠️ Erro ao buscar do banco, retornando lista vazia:', errorMessage);
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - criar transação financeira
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.description || !body.amount || !body.category || !body.transaction_type) {
      return NextResponse.json(
        { success: false, error: 'Descrição, valor, categoria e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    const transactionData = {
      user_id: body.user_id || '00000000-0000-0000-0000-000000000000',
      tenant_id: body.tenant_id,
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

    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar transação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - atualizar transação financeira
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updateData = {
      transaction_type: body.transaction_type,
      category: body.category,
      description: body.description,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method || null,
      due_date: body.due_date,
      paid_date: body.status === 'pago' ? (body.paid_date || new Date().toISOString().split('T')[0]) : null,
      status: body.status || 'pendente',
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar transação:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar transação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - excluir transação financeira
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir transação:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir transação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}