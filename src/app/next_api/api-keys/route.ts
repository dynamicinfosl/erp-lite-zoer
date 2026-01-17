import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateApiKey, hashApiKey } from '@/lib/api-key-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /next_api/api-keys
 * Cria uma nova API key para um tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, name, permissions, expires_at } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se tenant existe
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Gerar nova API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    // Preparar dados para inserção
    const apiKeyData: any = {
      tenant_id,
      key_hash: keyHash,
      name: name.trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
      is_active: true,
      expires_at: expires_at || null,
    };

    // Inserir no banco
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('api_keys')
      .insert(apiKeyData)
      .select('id, name, tenant_id, permissions, expires_at, created_at')
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar API key:', insertError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar API key: ' + insertError.message },
        { status: 500 }
      );
    }

    // Retornar API key apenas uma vez (não armazenar em logs)
    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        api_key: apiKey, // ⚠️ Mostrar apenas uma vez
        name: inserted.name,
        tenant_id: inserted.tenant_id,
        permissions: inserted.permissions,
        expires_at: inserted.expires_at,
        created_at: inserted.created_at,
      },
      warning: 'Guarde esta API key em local seguro. Ela não será exibida novamente.',
    });
  } catch (error) {
    console.error('❌ Erro no POST /api-keys:', error);
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
 * GET /next_api/api-keys?tenant_id=...
 * Lista todas as API keys de um tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const include_inactive = searchParams.get('include_inactive') === 'true';

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('api_keys')
      .select('id, name, tenant_id, permissions, is_active, expires_at, last_used_at, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (!include_inactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar API keys:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar API keys: ' + error.message },
        { status: 500 }
      );
    }

    // Não retornar key_hash por segurança
    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('❌ Erro no GET /api-keys:', error);
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
