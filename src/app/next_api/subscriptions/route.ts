import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Buscar subscription de um tenant
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Cliente Supabase não configurado');
      return NextResponse.json(
        { 
          success: true, 
          data: null,
          message: 'Cliente Supabase não configurado' 
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      console.warn('⚠️ Tenant ID não fornecido');
      return NextResponse.json(
        { 
          success: true, 
          data: null,
          message: 'Tenant ID é obrigatório' 
        },
        { status: 200 }
      );
    }

    console.log(`🔍 [SUBSCRIPTIONS API] Buscando subscription para tenant: ${tenant_id}`);
    
    try {
      // ✅ Buscar TODAS as subscriptions do tenant (pode haver múltiplas)
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false });

      if (subError) {
        console.error('❌ [SUBSCRIPTIONS API] Erro ao buscar subscription:', subError);
        // Sempre retornar sucesso com data null, mesmo em caso de erro
        if (subError.code === 'PGRST116' || subError.message?.includes('0 rows') || subError.message?.includes('not found')) {
          console.log('⚠️ [SUBSCRIPTIONS API] Nenhuma subscription encontrada para tenant:', tenant_id);
          return NextResponse.json({ 
            success: true, 
            data: null,
            message: 'Nenhuma subscription encontrada para este tenant'
          });
        }
        // Para outros erros, também retornar null ao invés de erro
        console.warn('⚠️ [SUBSCRIPTIONS API] Erro ao buscar subscription, retornando null:', subError.message);
        return NextResponse.json({ 
          success: true, 
          data: null,
          message: 'Erro ao buscar subscription: ' + subError.message
        });
      }

      // Se não encontrou subscription, retornar null
      if (!subscriptions || subscriptions.length === 0) {
        console.log('⚠️ [SUBSCRIPTIONS API] Nenhuma subscription encontrada para tenant:', tenant_id);
        return NextResponse.json({ 
          success: true, 
          data: null,
          message: 'Nenhuma subscription encontrada para este tenant'
        });
      }

      // ✅ Priorizar subscription ativa, senão pegar a mais recente
      let subscription = subscriptions.find(s => s.status === 'active') || subscriptions[0];
      
      console.log(`✅ [SUBSCRIPTIONS API] Encontradas ${subscriptions.length} subscription(s), usando:`, {
        id: subscription.id,
        status: subscription.status,
        created_at: subscription.created_at
      });

      // Buscar plan separadamente se plan_id existir
      let plan = null;
      if (subscription.plan_id) {
        try {
          const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', subscription.plan_id)
            .maybeSingle();
          
          if (!planError && planData) {
            plan = planData;
          } else {
            console.warn('⚠️ Erro ao buscar plan:', planError?.message);
          }
        } catch (planErr: any) {
          console.warn('⚠️ Erro ao buscar plan, continuando sem plan:', planErr?.message || planErr);
        }
      }

      // Montar resposta com subscription e plan
      const responseData = {
        ...subscription,
        plan: plan
      };

      console.log('✅ [SUBSCRIPTIONS API] Subscription encontrada e retornada:', {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        plan_name: plan?.name,
        plan_slug: plan?.slug,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end
      });

      return NextResponse.json({ success: true, data: responseData });
    } catch (queryError: any) {
      console.error('❌ [SUBSCRIPTIONS API] Erro na query de subscription:', queryError);
      console.error('❌ [SUBSCRIPTIONS API] Stack:', queryError?.stack);
      // Em caso de erro inesperado, retornar null ao invés de erro 500
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'Erro ao buscar subscription: ' + (queryError?.message || 'Erro desconhecido')
      });
    }

  } catch (error: any) {
    console.error('❌ Erro no handler de busca:', error);
    // Sempre retornar sucesso com data null, nunca erro 500
    return NextResponse.json({ 
      success: true, 
      data: null,
      message: 'Erro interno: ' + (error?.message || 'Erro desconhecido')
    });
  }
}

// Atualizar plano de um tenant
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tenant_id, plan_id } = body;

    if (!tenant_id || !plan_id) {
      return NextResponse.json(
        { error: 'Tenant ID e Plan ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o plano existe
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado ou inativo' },
        { status: 400 }
      );
    }

    // Atualizar plano diretamente com service role
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // zera trial quando faz upgrade
        trial_end: null,
      })
      .eq('tenant_id', tenant_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar plano: ' + updateError.message },
        { status: 400 }
      );
    }

    // Buscar subscription atualizada
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('tenant_id', tenant_id)
      .single();

    if (subError) {
      console.error('Erro ao buscar subscription atualizada:', subError);
      return NextResponse.json(
        { error: 'Plano atualizado, mas erro ao buscar dados atualizados' },
        { status: 200 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plano atualizado com sucesso',
      data: subscription 
    });

  } catch (error) {
    console.error('Erro no handler de atualização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Criar subscription para um tenant
export async function POST(request: NextRequest) {
  try {
    // Verificação mais rigorosa do cliente Supabase
    if (!supabaseAdmin) {
      console.error('❌ [POST] Cliente Supabase não configurado');
      console.error('❌ [POST] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado');
      console.error('❌ [POST] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Não configurado');
      return NextResponse.json(
        { 
          error: 'Cliente Supabase não configurado',
          details: 'Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { tenant_id, plan_id, status = 'trial' } = body as { tenant_id?: string; plan_id?: string | null; status?: 'trial' | 'active' };

    if (!tenant_id) {
      console.error('❌ [POST] Tenant ID é obrigatório');
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🔍 [POST] Criando subscription para tenant: ${tenant_id}, plan_id: ${plan_id || 'null'}, status: ${status}`);

    // ✅ Se não veio plan_id, escolher automaticamente um plano
    if (!plan_id) {
      console.log('🔍 [POST] Plan ID não fornecido, buscando plano padrão...');
      
      // Tentar buscar plano 'trial' ou 'free' primeiro
      const { data: trialPlan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .or('slug.eq.trial,slug.eq.free')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (trialPlan?.id) {
        plan_id = trialPlan.id;
        console.log('✅ [POST] Plano trial/free encontrado:', plan_id);
      } else {
        // Se não encontrou trial/free, buscar o mais barato
        const { data: cheapest } = await supabaseAdmin
          .from('plans')
          .select('id')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (cheapest?.id) {
          plan_id = cheapest.id;
          console.log('✅ [POST] Plano mais barato encontrado:', plan_id);
        } else {
          console.error('❌ [POST] Nenhum plano ativo encontrado no banco');
          return NextResponse.json(
            { error: 'Nenhum plano ativo encontrado. Configure planos no sistema primeiro.' },
            { status: 400 }
          );
        }
      }
    } else {
      // Validar o plano informado
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('id', plan_id)
        .eq('is_active', true)
        .maybeSingle();
        
      if (planError || !plan) {
        console.error('❌ [POST] Plano não encontrado ou inativo:', plan_id, planError);
        return NextResponse.json(
          { error: 'Plano não encontrado ou inativo' },
          { status: 400 }
        );
      }
    }

    // Verificar se já existe subscription para este tenant
    const { data: existingSubs, error: existingError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('tenant_id', tenant_id);

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('❌ [POST] Erro ao verificar subscription existente:', existingError);
      // Continuar mesmo com erro, pois pode ser que a tabela não exista ainda
    }

    if (existingSubs && existingSubs.length > 0) {
      // Se já existe subscription ativa, retornar ela ao invés de criar nova
      const activeSub = existingSubs.find(s => s.status === 'active') || existingSubs[0];
      console.log('⚠️ [POST] Tenant já possui subscription, retornando existente:', activeSub.id);
      
      // Buscar subscription completa
      const { data: fullSub } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('id', activeSub.id)
        .maybeSingle();
      
      if (fullSub) {
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription já existe',
          data: fullSub 
        });
      }
    }

    // Criar subscription
    const trialEndsAt = status === 'trial' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      : null;

    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = status === 'active' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      : null;

    console.log('📝 [POST] Dados para inserção:', {
      tenant_id,
      plan_id,
      status,
      trial_end: trialEndsAt,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd
    });

    // Verificar se o tenant existe antes de criar subscription
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name')
      .eq('id', tenant_id)
      .maybeSingle();
    
    if (tenantError) {
      console.error('❌ [POST] Erro ao verificar tenant:', tenantError);
      return NextResponse.json(
        { 
          error: 'Erro ao verificar tenant: ' + tenantError.message,
          code: tenantError.code
        },
        { status: 400 }
      );
    }
    
    if (!tenantData) {
      console.error('❌ [POST] Tenant não encontrado:', tenant_id);
      return NextResponse.json(
        { error: 'Tenant não encontrado. Verifique se o tenant_id está correto.' },
        { status: 400 }
      );
    }
    
    console.log('✅ [POST] Tenant verificado:', tenantData.name);
    
    // Primeiro inserir sem o join para evitar problemas
    // Usar .rpc() ou garantir que estamos usando service_role corretamente
    console.log('📝 [POST] Tentando inserir subscription...');
    
    const insertPayload = {
        tenant_id,
        plan_id,
        status,
        trial_end: trialEndsAt,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
    };
    
    console.log('📝 [POST] Payload de inserção:', JSON.stringify(insertPayload, null, 2));
    
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ [POST] Erro ao inserir subscription:', insertError);
      console.error('❌ [POST] Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json(
        { 
          error: 'Erro ao criar subscription: ' + insertError.message,
          details: insertError.details,
          code: insertError.code
        },
        { status: 400 }
      );
    }

    if (!insertedData) {
      console.error('❌ [POST] Subscription inserida mas sem dados retornados');
      return NextResponse.json(
        { error: 'Subscription criada mas não foi possível recuperar os dados' },
        { status: 500 }
      );
    }

    console.log('✅ [POST] Subscription criada com sucesso:', insertedData.id);

    // Buscar plan separadamente
    let plan = null;
    if (insertedData.plan_id) {
      try {
        const { data: planData, error: planError } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('id', insertedData.plan_id)
          .maybeSingle();
        
        if (!planError && planData) {
          plan = planData;
          console.log('✅ [POST] Plan encontrado:', plan.name);
        } else {
          console.warn('⚠️ [POST] Erro ao buscar plan:', planError?.message);
        }
      } catch (planErr: any) {
        console.warn('⚠️ [POST] Erro ao buscar plan, continuando sem plan:', planErr?.message || planErr);
      }
    }

    // Montar resposta com subscription e plan
    const responseData = {
      ...insertedData,
      plan: plan
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription criada com sucesso',
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ [POST] Erro inesperado no handler de criação:', error);
    console.error('❌ [POST] Stack trace:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor: ' + (error?.message || 'Erro desconhecido'),
        type: error?.name || 'UnknownError'
      },
      { status: 500 }
    );
  }
}

