import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
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







