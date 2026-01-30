import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Listar operações de caixa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const cash_session_id = searchParams.get('cash_session_id');
    const operation_type = searchParams.get('operation_type'); // 'sangria' | 'reforco' | 'abertura' | 'fechamento'

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('cash_operations')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (cash_session_id) {
      query = query.eq('cash_session_id', cash_session_id);
    }

    if (operation_type) {
      query = query.eq('operation_type', operation_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[cash-operations] Erro ao buscar operações:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('[cash-operations] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar operação de caixa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      cash_session_id,
      user_id,
      operation_type,
      amount,
      description,
      notes,
      created_by,
    } = body;

    // Validações
    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!cash_session_id) {
      return NextResponse.json(
        { success: false, error: 'cash_session_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!operation_type || !['sangria', 'reforco', 'abertura', 'fechamento'].includes(operation_type)) {
      return NextResponse.json(
        { success: false, error: 'operation_type deve ser: sangria, reforco, abertura ou fechamento' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount deve ser um número positivo' },
        { status: 400 }
      );
    }

    const operationData: any = {
      tenant_id,
      cash_session_id,
      operation_type,
      amount: Number(amount),
      description: description || null,
      notes: notes || null,
      created_by: created_by || null,
      user_id: user_id || null,
    };

    const { data, error } = await supabaseAdmin
      .from('cash_operations')
      .insert(operationData)
      .select()
      .single();

    if (error) {
      console.error('[cash-operations] Erro ao criar operação:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[cash-operations] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
