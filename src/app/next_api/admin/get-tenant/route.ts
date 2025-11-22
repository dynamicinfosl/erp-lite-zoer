import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Buscar tenant de um usuário
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cliente Supabase não configurado' 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID é obrigatório' 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Buscando tenant para usuário: ${user_id}`);
    
    // Buscar membership ativo
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error('❌ [API] Erro ao buscar membership:', membershipError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar membership: ' + membershipError.message 
        },
        { status: 400 }
      );
    }

    if (!membership?.tenant_id) {
      console.log('⚠️ [API] Nenhum membership encontrado para usuário:', user_id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nenhum membership ativo encontrado para este usuário' 
        },
        { status: 404 }
      );
    }

    const tenantId = membership.tenant_id;
    console.log('✅ [API] Membership encontrado, tenant_id:', tenantId);

    // Buscar dados do tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status, email, phone, document, address, city, state, zip_code')
      .eq('id', tenantId)
      .maybeSingle();

    if (tenantError) {
      console.error('❌ [API] Erro ao buscar tenant:', tenantError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar tenant: ' + tenantError.message 
        },
        { status: 400 }
      );
    }

    if (!tenant) {
      console.log('⚠️ [API] Tenant não encontrado:', tenantId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tenant não encontrado' 
        },
        { status: 404 }
      );
    }

    console.log('✅ [API] Tenant encontrado:', tenant.name, 'ID:', tenant.id);

    return NextResponse.json({ 
      success: true, 
      data: tenant 
    });

  } catch (error: any) {
    console.error('❌ [API] Erro no handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno: ' + (error?.message || 'Erro desconhecido') 
      },
      { status: 500 }
    );
  }
}

