import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/v1/customers
 * Cria um novo cliente via API externa
 */
async function createCustomerHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const body = await request.json();

    const { name, email, phone, document, address, neighborhood, state, zipcode, notes, is_active } = body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Preparar dados para inserção
    const customerData: any = {
      tenant_id,
      user_id: '00000000-0000-0000-0000-000000000000', // API externa usa UUID padrão
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      document: document ? document.trim() : null,
      address: address ? address.trim() : null,
      neighborhood: neighborhood ? neighborhood.trim() : null,
      state: state ? state.trim().substring(0, 2).toUpperCase() : null, // Limitar a 2 caracteres
      zipcode: zipcode ? zipcode.trim() : null,
      notes: notes ? notes.trim() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_at_branch_id: null, // API externa não tem branch por padrão
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cliente: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Erro no handler de criação de cliente:', error);
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
 * GET /api/v1/customers
 * Lista clientes do tenant
 */
async function listCustomersHandler(
  request: NextRequest,
  context: { tenant_id: string; api_key_id: string; permissions: string[] }
) {
  try {
    const { tenant_id } = context;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search'); // Busca por nome, email ou documento

    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por status ativo/inativo
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Busca por nome, email ou documento
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar clientes:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar clientes: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customers || [],
      pagination: {
        limit,
        offset,
        count: customers?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Erro no handler de listagem de clientes:', error);
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

export const POST = withApiKeyAuth(createCustomerHandler, 'customers:create');
export const GET = withApiKeyAuth(listCustomersHandler, 'customers:read');
