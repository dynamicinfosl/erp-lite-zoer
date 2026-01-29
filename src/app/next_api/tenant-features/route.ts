import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

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

