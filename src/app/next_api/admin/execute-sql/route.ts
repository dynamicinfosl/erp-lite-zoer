import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { sql } = body;

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query é obrigatória' },
        { status: 400 }
      );
    }

    console.log('🔧 Executando SQL:', sql);

    // Executar SQL via Supabase
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return NextResponse.json(
        { error: 'Erro ao executar SQL: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('❌ Erro no endpoint:', error);
    return NextResponse.json(
      { error: 'Erro interno: ' + error.message },
      { status: 500 }
    );
  }
}







