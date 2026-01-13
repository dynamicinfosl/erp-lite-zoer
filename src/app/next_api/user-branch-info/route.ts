import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Obter informações sobre branch do usuário atual
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar membership do usuário
    const { data: membership, error } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id, role, branch_id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar membership:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Membership não encontrado' },
        { status: 404 },
      );
    }

    // Se tem branch_id, é admin de filial; senão, é admin matriz/owner
    const isBranchAdmin = !!membership.branch_id;
    const isMatrixAdmin = !isBranchAdmin && (membership.role === 'owner' || membership.role === 'admin');

    // Se for admin de filial, buscar informações da filial
    let branchInfo = null;
    if (isBranchAdmin && membership.branch_id) {
      const { data: branch } = await supabaseAdmin
        .from('branches')
        .select('id, name, is_headquarters')
        .eq('id', membership.branch_id)
        .maybeSingle();

      if (branch) {
        branchInfo = {
          id: branch.id,
          name: branch.name,
          is_headquarters: branch.is_headquarters,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isBranchAdmin,
        isMatrixAdmin,
        branch_id: membership.branch_id || null,
        branch: branchInfo,
        role: membership.role,
      },
    });
  } catch (error: any) {
    console.error('Erro ao obter informações de branch:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
