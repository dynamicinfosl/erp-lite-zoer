import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const fallbackPostgrestUrl = process.env.POSTGREST_URL?.replace(/\/rest\/v1\/?$/, '');
const supabaseUrl = rawSupabaseUrl || fallbackPostgrestUrl;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

const fallbackPlans = [
  {
    id: 'basic',
    name: 'Básico',
    slug: 'basic',
    description: 'Ideal para começar',
    price_monthly: 79.9,
    price_yearly: 799,
    features: ['1 usuário', '100 produtos', 'Relatórios básicos'],
    limits: {
      max_users: 1,
      max_products: 100,
      max_customers: 1000,
    },
  },
  {
    id: 'pro',
    name: 'Profissional',
    slug: 'pro',
    description: 'Para empresas em crescimento',
    price_monthly: 139.9,
    price_yearly: 1399,
    features: ['5 usuários', '1000 produtos', 'Relatórios avançados', 'Integrações'],
    limits: {
      max_users: 5,
      max_products: 1000,
      max_customers: 10000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Recursos ilimitados',
    price_monthly: 299.9,
    price_yearly: 2999,
    features: ['Usuários ilimitados', 'Produtos ilimitados', 'Suporte dedicado'],
    limits: {
      max_users: -1,
      max_products: -1,
      max_customers: -1,
    },
  },
];

function respondWithFallback(reason: string) {
  console.warn(`⚠️ Usando fallback de planos (${reason})`);
  return NextResponse.json({
    success: true,
    data: fallbackPlans,
    warning: reason,
  });
}

// Listar todos os planos disponíveis
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /next_api/plans - Iniciando busca de planos...');
    
    if (!supabaseAdmin) {
      return respondWithFallback('Supabase não configurado');
    }

    console.log('🔍 Buscando planos ativos na tabela plans...');
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      console.error('❌ Erro ao listar planos:', error);
      return respondWithFallback(`Erro Supabase: ${error.message}`);
    }

    console.log(`✅ Planos encontrados: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('📦 Planos:', data.map(p => ({ id: p.id, name: p.name, slug: p.slug })));
    } else {
      console.warn('⚠️ Nenhum plano ativo encontrado na tabela plans!');
      console.warn('💡 Execute o script criar-planos-basicos.sql no Supabase SQL Editor');
      return respondWithFallback('Nenhum plano encontrado no Supabase');
    }

    return NextResponse.json({ success: true, data: data || [] });

  } catch (error) {
    console.error('❌ Erro no handler de listagem:', error);
    return respondWithFallback(
      'Erro inesperado ao buscar planos: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

// Criar novo plano (apenas para admin)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, slug, description, price_monthly, price_yearly, features, limits } = body;

    if (!name || !slug || !price_monthly) {
      return NextResponse.json(
        { error: 'Nome, slug e preço mensal são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('plans')
      .insert({
        name,
        slug,
        description,
        price_monthly: parseFloat(price_monthly),
        price_yearly: price_yearly ? parseFloat(price_yearly) : null,
        features: features || {},
        limits: limits || {},
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar plano:', error);
      return NextResponse.json(
        { error: 'Erro ao criar plano: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

