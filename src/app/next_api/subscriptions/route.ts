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
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando subscription para tenant: ${tenant_id}`);
    
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar subscription:', error);
        // Se o erro for "not found", retornar null ao invés de erro
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          console.log('⚠️ Nenhuma subscription encontrada para tenant:', tenant_id);
          return NextResponse.json({ 
            success: true, 
            data: null,
            message: 'Nenhuma subscription encontrada para este tenant'
          });
        }
        return NextResponse.json(
          { error: 'Erro ao buscar subscription: ' + error.message },
          { status: 400 }
        );
      }

      // Se não encontrou subscription, retornar null ao invés de erro
      if (!data) {
        console.log('⚠️ Nenhuma subscription encontrada para tenant:', tenant_id);
        return NextResponse.json({ 
          success: true, 
          data: null,
          message: 'Nenhuma subscription encontrada para este tenant'
        });
      }

      console.log('✅ Subscription encontrada:', {
        id: data.id,
        status: data.status,
        plan_id: data.plan_id,
        plan_name: Array.isArray(data.plan) ? data.plan[0]?.name : data.plan?.name,
        current_period_end: data.current_period_end
      });

      return NextResponse.json({ success: true, data });
    } catch (queryError) {
      console.error('❌ Erro na query de subscription:', queryError);
      // Em caso de erro inesperado, retornar null ao invés de erro 500
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'Erro ao buscar subscription, retornando null'
      });
    }

  } catch (error) {
    console.error('Erro no handler de busca:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
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
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { tenant_id, plan_id, status = 'trial' } = body as { tenant_id?: string; plan_id?: string; status?: 'trial' | 'active' };

    if (!tenant_id || !plan_id) {
      return NextResponse.json(
        { error: 'Tenant ID e Plan ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Se não veio plan_id, escolher o plano 'free' ativo, senão o mais barato ativo
    if (!plan_id) {
      const { data: freePlan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('slug', 'free')
        .eq('is_active', true)
        .single();

      if (freePlan?.id) {
        plan_id = freePlan.id;
      } else {
        const { data: cheapest } = await supabaseAdmin
          .from('plans')
          .select('id')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true })
          .limit(1)
          .single();
        plan_id = cheapest?.id ?? plan_id;
      }
    } else {
      // Validar o plano informado
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('id', plan_id)
        .eq('is_active', true)
        .single();
      if (planError || !plan) {
        return NextResponse.json(
          { error: 'Plano não encontrado ou inativo' },
          { status: 400 }
        );
      }
    }

    // Verificar se já existe subscription para este tenant
    const { data: existingSub, error: existingError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('tenant_id', tenant_id)
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: 'Tenant já possui uma subscription ativa' },
        { status: 400 }
      );
    }

    // Criar subscription
    const trialEndsAt = status === 'trial' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      : null;

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        tenant_id,
        plan_id,
        status,
        // coluna correta no schema base
        trial_end: trialEndsAt,
        current_period_start: new Date().toISOString(),
        current_period_end: status === 'active' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
          : null,
      })
      .select(`
        *,
        plan:plans(*)
      `)
      .single();

    if (error) {
      console.error('Erro ao criar subscription:', error);
      return NextResponse.json(
        { error: 'Erro ao criar subscription: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription criada com sucesso',
      data 
    });

  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

