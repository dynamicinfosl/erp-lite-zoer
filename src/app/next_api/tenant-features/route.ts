import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


// Função auxiliar para inicializar o cliente Supabase apenas quando necessário
function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseServiceKey) {
    throw new Error('Supabase Service Role Key não configurada');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Garantir que sempre retorna JSON, mesmo em caso de erro
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    if (!tenant_id) {
      return NextResponse.json(
        { success: true, data: { features: {} } },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('tenant_feature_flags')
        .select('tenant_id, features, updated_at')
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      if (error) {
        // Se a tabela ainda não existir em algum ambiente, não quebrar o app
        console.warn('⚠️ /tenant-features erro:', error.message);
        return NextResponse.json(
          { success: true, data: { features: {} }, warning: error.message },
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return NextResponse.json(
        { success: true, data: data || { tenant_id, features: {} } },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (dbError: any) {
      // Erro ao acessar o banco - retornar JSON de fallback
      console.error('⚠️ Erro ao acessar banco de dados:', dbError);
      return NextResponse.json(
        { success: true, data: { features: {} }, warning: 'Erro ao acessar banco de dados' },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error: any) {
    // Erro geral - sempre retornar JSON
    console.error('❌ Erro ao buscar tenant features:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Erro interno',
        data: { features: {} }
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

