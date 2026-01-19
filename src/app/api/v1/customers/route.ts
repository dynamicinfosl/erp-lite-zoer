import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Normaliza texto removendo acentos e convertendo para lowercase
 * Exemplo: "João Silva" -> "joao silva", "Café" -> "cafe"
 */
function normalizeText(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

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

    const { name, email, phone, document, address, neighborhood, state, zipcode, notes, is_active, branch_id } = body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Opcional: permitir cadastrar diretamente em uma filial
    // - Se branch_id for informado: cliente aparece na filial (created_at_branch_id = branch_id)
    // - Se não: cliente fica na matriz (created_at_branch_id = NULL)
    let createdAtBranchId: number | null = null;
    if (branch_id !== undefined && branch_id !== null && String(branch_id).trim() !== '') {
      const bid = typeof branch_id === 'number' ? branch_id : parseInt(String(branch_id), 10);
      if (!Number.isFinite(bid) || bid <= 0) {
        return NextResponse.json(
          { success: false, error: 'branch_id inválido' },
          { status: 400 }
        );
      }

      // Validar que a filial pertence ao tenant
      const { data: branch, error: branchError } = await supabaseAdmin
        .from('branches')
        .select('id, tenant_id')
        .eq('id', bid)
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      if (branchError || !branch) {
        return NextResponse.json(
          { success: false, error: 'Filial (branch_id) não encontrada para este tenant' },
          { status: 400 }
        );
      }

      createdAtBranchId = bid;
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
      created_at_branch_id: createdAtBranchId, // NULL = matriz | number = filial
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
    // Buscamos mais resultados para poder filtrar com normalização depois
    const searchTerm = search && search.trim().length > 0 ? search.trim() : null;
    const normalizedSearch = searchTerm ? normalizeText(searchTerm) : null;
    
    if (searchTerm) {
      // Busca inicial usando ilike (case-insensitive, mas não remove acentos)
      // Buscamos mais resultados (até 3x o limite) para garantir que encontremos clientes mesmo com variações de acentos
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`);
      query = query.range(offset, offset + (limit * 3) - 1); // Buscar mais para filtrar depois
    }

    const { data: allCustomers, error } = await query;

    if (error) {
      console.error('❌ Erro ao listar clientes:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao listar clientes: ' + error.message },
        { status: 500 }
      );
    }

    // Se há busca, filtrar usando normalização para garantir flexibilidade com acentos e espaços
    let customers = allCustomers || [];
    if (normalizedSearch && customers.length > 0) {
      customers = customers.filter((customer: any) => {
        const normalizedName = normalizeText(customer.name || '');
        const normalizedEmail = normalizeText(customer.email || '');
        const normalizedDocument = normalizeText(customer.document || '');
        
        return (
          normalizedName.includes(normalizedSearch) ||
          normalizedEmail.includes(normalizedSearch) ||
          normalizedDocument.includes(normalizedSearch)
        );
      });
      
      // Quando há busca, aplicamos paginação no resultado filtrado
      // (porque buscamos mais resultados para garantir que encontremos clientes mesmo com variações de acentos)
      customers = customers.slice(offset, offset + limit);
    }
    // Quando não há busca, customers já está paginado pelo range do Supabase

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        limit,
        offset,
        count: customers.length,
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
