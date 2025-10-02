import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Listar todos os planos disponíveis
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      console.error('Erro ao listar planos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar planos: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Criar novo plano (apenas para admin)
export async function POST(request: NextRequest) {
  try {
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

