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

    const { data: memberships, error } = await query.limit(1);
    
    const membership = memberships && memberships.length > 0 ? memberships[0] : null;

    if (error) {
      console.error('[user-role] Erro ao buscar membership:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    if (!membership) {
      return NextResponse.json({
        success: true,
        data: { role: 'vendedor', isAdmin: false },
      });
    }

    // Determinar se é admin
    const isAdmin = membership.role === 'owner' || membership.role === 'admin';
    const roleForSidebar = isAdmin ? 'admin' : 'vendedor';

    console.log('[user-role] Role determinado:', { 
      user_id, 
      tenant_id, 
      membership_role: membership.role, 
      roleForSidebar,
      isAdmin 
    });

    return NextResponse.json({
      success: true,
      data: {
        role: roleForSidebar,
        isAdmin,
        membershipRole: membership.role,
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
