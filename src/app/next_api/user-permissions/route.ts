import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getUserPermissions,
  saveUserPermissions,
  createDefaultPermissions,
  DEFAULT_OPERATOR_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  type UserPermissions,
} from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper: verificar se usuário é admin
async function isAdmin(userId: string, tenantId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .maybeSingle();

  return data?.role === 'owner' || data?.role === 'admin';
}

// GET - buscar permissões de um usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id'); // Usuário cujas permissões serão visualizadas
    const tenantId = searchParams.get('tenant_id');
    const currentUserId = searchParams.get('current_user_id'); // Admin que está visualizando

    if (!userId || !tenantId || !currentUserId) {
      return NextResponse.json(
        { success: false, error: 'user_id, tenant_id e current_user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se quem está fazendo a requisição é admin
    const isCurrentUserAdmin = await isAdmin(currentUserId, tenantId);
    if (!isCurrentUserAdmin) {
      return NextResponse.json({ success: false, error: 'Apenas admins podem visualizar permissões' }, { status: 403 });
    }

    const permissions = await getUserPermissions(userId, tenantId);

    // Se não tem permissões, retornar padrões baseados no role_type
    if (!permissions) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role_type')
        .eq('user_id', userId)
        .maybeSingle();

      const defaults =
        profile?.role_type === 'admin'
          ? DEFAULT_ADMIN_PERMISSIONS
          : DEFAULT_OPERATOR_PERMISSIONS;

      return NextResponse.json({
        success: true,
        data: {
          user_id: userId,
          tenant_id: tenantId,
          ...defaults,
        },
      });
    }

    return NextResponse.json({ success: true, data: permissions });
  } catch (error: any) {
    console.error('[user-permissions GET] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST/PUT - salvar permissões
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, tenant_id, current_user_id, ...permissions } = body;

    if (!user_id || !tenant_id || !current_user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id, tenant_id e current_user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se quem está salvando é admin
    const isCurrentUserAdmin = await isAdmin(current_user_id, tenant_id);
    if (!isCurrentUserAdmin) {
      return NextResponse.json({ success: false, error: 'Apenas admins podem configurar permissões' }, { status: 403 });
    }

    const result = await saveUserPermissions(user_id, tenant_id, permissions);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[user-permissions POST] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Mesma lógica
}
