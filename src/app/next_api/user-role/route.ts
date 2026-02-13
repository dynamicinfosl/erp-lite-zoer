import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Obter role do usuário para o sidebar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const tenant_id = searchParams.get('tenant_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar membership do usuário
    let query = supabaseAdmin
      .from('user_memberships')
      .select('role, branch_id')
      .eq('user_id', user_id)
      .eq('is_active', true);

    // Se tenant_id fornecido, filtrar por tenant também
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data: memberships, error: membershipError } = await query.limit(1);
    
    const membership = memberships && memberships.length > 0 ? memberships[0] : null;

    if (membershipError) {
      console.error('[user-role] Erro ao buscar membership:', membershipError);
      return NextResponse.json(
        { success: false, error: membershipError.message },
        { status: 400 },
      );
    }

    // Buscar role_type do user_profiles (aqui é onde realmente diferencia Admin de Operador)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user_id)
      .maybeSingle();

    if (profileError) {
      console.warn('[user-role] Erro ao buscar profile (continuando):', profileError);
    }

    // Determinar se é admin baseado em:
    // 1. Se membership.role === 'owner' → sempre admin
    // 2. Se profile.role_type === 'admin' → admin
    // 3. Caso contrário → operador (vendedor)
    let isAdmin = false;
    let roleForSidebar = 'vendedor';

    if (membership?.role === 'owner') {
      // Owners são sempre admin
      isAdmin = true;
      roleForSidebar = 'admin';
    } else if (profile?.role_type === 'admin') {
      // Se role_type é 'admin', é admin
      isAdmin = true;
      roleForSidebar = 'admin';
    } else {
      // Se role_type é 'vendedor' ou não tem profile, é operador
      isAdmin = false;
      roleForSidebar = 'vendedor';
    }

    console.log('[user-role] Role determinado:', { 
      user_id, 
      tenant_id, 
      membership_role: membership?.role,
      profile_role_type: profile?.role_type,
      roleForSidebar,
      isAdmin 
    });

    return NextResponse.json({
      success: true,
      data: {
        role: roleForSidebar,
        isAdmin,
        membershipRole: membership?.role,
        profileRoleType: profile?.role_type,
      },
    });
  } catch (error: any) {
    console.error('[user-role] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
