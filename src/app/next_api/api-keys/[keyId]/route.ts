import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * DELETE /next_api/api-keys/[keyId]
 * Revoga (desativa) uma API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'ID da API key é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a key existe
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('api_keys')
      .select('id, tenant_id, name')
      .eq('id', keyId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'API key não encontrada' },
        { status: 404 }
      );
    }

    // Desativar a key (não deletar para manter histórico)
    const { error: updateError } = await supabaseAdmin
      .from('api_keys')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId);

    if (updateError) {
      console.error('❌ Erro ao revogar API key:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao revogar API key: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `API key "${existing.name}" foi revogada com sucesso`,
    });
  } catch (error) {
    console.error('❌ Erro no DELETE /api-keys/[keyId]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /next_api/api-keys/[keyId]
 * Atualiza uma API key (nome, permissões, status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params;
    const body = await request.json();
    const { name, permissions, is_active, expires_at } = body;

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'ID da API key é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a key existe
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'API key não encontrada' },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (permissions !== undefined) {
      updateData.permissions = Array.isArray(permissions) ? permissions : [];
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    if (expires_at !== undefined) {
      updateData.expires_at = expires_at || null;
    }

    // Atualizar
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('api_keys')
      .update(updateData)
      .eq('id', keyId)
      .select('id, name, tenant_id, permissions, is_active, expires_at, updated_at')
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar API key:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar API key: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('❌ Erro no PATCH /api-keys/[keyId]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
