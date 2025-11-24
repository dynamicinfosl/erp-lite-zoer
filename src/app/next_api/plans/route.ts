import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const fallbackPostgrestUrl = process.env.POSTGREST_URL?.replace(/\/rest\/v1\/?$/, '');
const supabaseUrl = rawSupabaseUrl || fallbackPostgrestUrl;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

// Listar todos os planos disponíveis
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /next_api/plans - Iniciando busca de planos...');
    
    if (!supabaseAdmin) {
      console.error('❌ Cliente Supabase não configurado');
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    console.log('🔍 Buscando planos ativos na tabela plans...');
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      console.error('❌ Erro ao listar planos:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { error: 'Erro ao listar planos: ' + error.message },
        { status: 400 }
      );
    }

    console.log(`✅ Planos encontrados: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('📦 Planos:', data.map(p => ({ id: p.id, name: p.name, slug: p.slug })));
    } else {
      console.warn('⚠️ Nenhum plano ativo encontrado na tabela plans!');
      console.warn('💡 Execute o script criar-planos-basicos.sql no Supabase SQL Editor');
    }

    return NextResponse.json({ success: true, data: data || [] });

  } catch (error) {
    console.error('❌ Erro no handler de listagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
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

