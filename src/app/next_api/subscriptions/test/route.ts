import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Endpoint de teste para diagnosticar problemas
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 1. Verificar variáveis de ambiente
  results.checks.env_vars = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ Configurado' : '❌ Não configurado',
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '✅ Configurado' : '❌ Não configurado',
  };

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      success: false,
      error: 'Variáveis de ambiente não configuradas',
      results
    }, { status: 500 });
  }

  // 2. Criar cliente
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  results.checks.client_created = '✅ Cliente criado';

  // 3. Testar conexão básica
  try {
    const { data: plansData, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('id, name, slug, is_active')
      .limit(1);
    
    results.checks.connection = plansError 
      ? `❌ Erro: ${plansError.message}` 
      : '✅ Conexão OK';
    results.checks.plans_count = plansData?.length || 0;
  } catch (error: any) {
    results.checks.connection = `❌ Erro: ${error.message}`;
  }

  // 4. Verificar estrutura da tabela subscriptions
  try {
    const { data: subsData, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .limit(0);
    
    results.checks.subscriptions_table = subsError 
      ? `❌ Erro: ${subsError.message} (${subsError.code})` 
      : '✅ Tabela acessível';
  } catch (error: any) {
    results.checks.subscriptions_table = `❌ Erro: ${error.message}`;
  }

  // 5. Verificar planos disponíveis
  try {
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('id, name, slug, is_active, price_monthly')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    
    results.checks.available_plans = plansError 
      ? `❌ Erro: ${plansError.message}` 
      : plans || [];
  } catch (error: any) {
    results.checks.available_plans = `❌ Erro: ${error.message}`;
  }

  // 6. Testar inserção (sem commit)
  const testTenantId = request.nextUrl.searchParams.get('tenant_id');
  if (testTenantId) {
    try {
      // Buscar plano trial
      const { data: trialPlan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .or('slug.eq.trial,slug.eq.free')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (trialPlan) {
        const { data: testInsert, error: testError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            tenant_id: testTenantId,
            plan_id: trialPlan.id,
            status: 'trial',
            trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            current_period_start: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (testError) {
          results.checks.test_insert = {
            success: false,
            error: testError.message,
            code: testError.code,
            details: testError.details,
            hint: testError.hint
          };
        } else {
          // Deletar o teste
          await supabaseAdmin
            .from('subscriptions')
            .delete()
            .eq('id', testInsert.id);
          
          results.checks.test_insert = {
            success: true,
            message: 'Inserção de teste funcionou!'
          };
        }
      } else {
        results.checks.test_insert = {
          success: false,
          error: 'Nenhum plano trial encontrado'
        };
      }
    } catch (error: any) {
      results.checks.test_insert = {
        success: false,
        error: error.message
      };
    }
  }

  return NextResponse.json({
    success: true,
    results
  });
}

