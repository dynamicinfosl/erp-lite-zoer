import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint de teste para diagnosticar problemas com cash-sessions
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 1. Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  results.checks.env_vars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado (usando fallback)',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Não configurado',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado',
    using_fallback_url: !process.env.NEXT_PUBLIC_SUPABASE_URL,
    using_fallback_key: !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  if (!supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      error: 'Nenhuma chave do Supabase configurada',
      results
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // 2. Criar cliente
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    results.checks.client_created = '✅ Cliente criado';
  } catch (error: any) {
    results.checks.client_created = `❌ Erro ao criar cliente: ${error.message}`;
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar cliente Supabase',
      results
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // 3. Testar conexão básica
  try {
    const { data: testData, error: testError } = await supabaseAdmin
      .from('cash_sessions')
      .select('id')
      .limit(1);
    
    results.checks.connection = testError 
      ? `❌ Erro: ${testError.message} (${testError.code})` 
      : '✅ Conexão OK';
    
    if (testError) {
      results.checks.connection_details = {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      };
    }
  } catch (error: any) {
    results.checks.connection = `❌ Erro: ${error.message}`;
  }

  // 4. Verificar estrutura da tabela cash_sessions
  try {
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('cash_sessions')
      .select('*')
      .limit(0);
    
    results.checks.table_accessible = tableError 
      ? `❌ Erro: ${tableError.message} (${tableError.code})` 
      : '✅ Tabela acessível';
    
    if (tableError) {
      results.checks.table_error_details = {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint
      };
    }
  } catch (error: any) {
    results.checks.table_accessible = `❌ Erro: ${error.message}`;
  }

  // 5. Verificar colunas necessárias
  const requiredColumns = [
    'closing_amount_card_debit',
    'closing_amount_card_credit',
    'difference_amount',
    'expected_cash',
    'expected_card_debit',
    'expected_card_credit',
    'difference_cash',
    'difference_card_debit',
    'difference_card_credit',
  ];

  try {
    // Tentar uma query que usa essas colunas
    const { error: columnsError } = await supabaseAdmin
      .from('cash_sessions')
      .select(requiredColumns.join(', '))
      .limit(0);
    
    if (columnsError) {
      results.checks.required_columns = `❌ Erro ao acessar colunas: ${columnsError.message}`;
      results.checks.required_columns_details = {
        code: columnsError.code,
        message: columnsError.message,
        hint: columnsError.hint
      };
    } else {
      results.checks.required_columns = '✅ Todas as colunas necessárias existem';
    }
  } catch (error: any) {
    results.checks.required_columns = `❌ Erro: ${error.message}`;
  }

  // 6. Contar sessões existentes
  try {
    const { count, error: countError } = await supabaseAdmin
      .from('cash_sessions')
      .select('*', { count: 'exact', head: true });
    
    results.checks.total_sessions = countError 
      ? `❌ Erro: ${countError.message}` 
      : count || 0;
  } catch (error: any) {
    results.checks.total_sessions = `❌ Erro: ${error.message}`;
  }

  // 7. Verificar sessões abertas
  try {
    const { data: openSessions, error: openError } = await supabaseAdmin
      .from('cash_sessions')
      .select('id, status, opened_at, tenant_id')
      .eq('status', 'open')
      .limit(5);
    
    results.checks.open_sessions = openError 
      ? `❌ Erro: ${openError.message}` 
      : openSessions || [];
    results.checks.open_sessions_count = openSessions?.length || 0;
  } catch (error: any) {
    results.checks.open_sessions = `❌ Erro: ${error.message}`;
  }

  return NextResponse.json({
    success: true,
    results
  }, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}



