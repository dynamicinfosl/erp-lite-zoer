import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Handler original para criar cliente
async function createCustomerHandler(request: NextRequest) {
  try {

    const body = await request.json();
    console.log('📝 Dados recebidos:', body);

    const {
      tenant_id,
      name,
      email,
      phone,
      document,
      city,
      type,
      status,
      address,
      neighborhood,
      state,
      zipcode,
      notes,
      external_code,
      is_active,
      branch_id // ✅ Novo: ID da filial onde está sendo cadastrado (null = matriz)
    } = body;

    if (!tenant_id || !name) {
      console.log('❌ Validação falhou:', { tenant_id, name });
      return NextResponse.json(
        { error: 'Tenant ID e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Determinar is_active: priorizar status, depois is_active, default é true (ativo)
    let activeStatus = true;
    if (status !== undefined) {
      activeStatus = status === 'active';
    } else if (is_active !== undefined) {
      activeStatus = Boolean(is_active);
    }

    // Preparar dados para inserção (incluindo tenant_id)
    const customerData: any = {
      tenant_id: tenant_id, // ✅ Agora incluímos o tenant_id
      user_id: '00000000-0000-0000-0000-000000000000', // UUID padrão temporário
      name,
      email: email || null,
      phone: phone || null,
      document: document || null,
      city: city || null,
      address: address || null,
      neighborhood: neighborhood || null,
      state: state || null,
      zipcode: zipcode || null,
      notes: notes || null,
      external_code: external_code || null,
      is_active: activeStatus,
      created_at_branch_id: branch_id ? Number(branch_id) : null, // ✅ Salvar onde foi cadastrado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Inserindo dados:', customerData);

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return NextResponse.json(
        { error: 'Erro ao criar cliente: ' + error.message },
        { status: 400 }
      );
    }

    console.log('✅ Cliente criado com sucesso:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erro no handler de criação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler original para listar clientes
async function listCustomersHandler(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Cliente Supabase não configurado');
      return NextResponse.json(
        { error: 'Sistema não configurado - entre em contato com o suporte' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const branch_id = searchParams.get('branch_id'); // ✅ Novo: filtrar por filial
    const branch_scope = searchParams.get('branch_scope'); // 'all' | 'branch'

    console.log(`👥 GET /customers - tenant_id: ${tenant_id}, branch_id: ${branch_id}, scope: ${branch_scope}`);

    if (!tenant_id) {
      console.log('⚠️ GET /customers - Nenhum tenant_id fornecido, retornando lista vazia');
      return NextResponse.json({ success: true, data: [] });
    }

    // ✅ Lógica de compartilhamento:
    // - Se branch_scope='all' (matriz): retorna apenas clientes cadastrados na matriz
    // - Se branch_id fornecido (filial ou matriz visitando filial): retorna clientes daquela filial
    let query;

    // Select de clientes (usando * para compatibilidade com schema variável)
    if (branch_scope === 'all') {
      // Matriz vê todos os clientes cadastrados (matriz e filiais)
      query = supabaseAdmin
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant_id);
      console.log(`🔍 [Matriz] Buscando todos os clientes do tenant`);
    } else if (branch_id) {
      // Filial: buscar apenas clientes compartilhados
      const bid = Number(branch_id);
      if (Number.isFinite(bid) && bid > 0) {
        // Primeiro: buscar IDs dos clientes compartilhados
        const { data: sharedCustomers } = await supabaseAdmin
          .from('branch_customers')
          .select('customer_id')
          .eq('tenant_id', tenant_id)
          .eq('branch_id', bid)
          .eq('is_active', true);

        const customerIds = (sharedCustomers || [])
          .map((c: any) => Number(c.customer_id))
          .filter((id: number) => Number.isFinite(id) && id > 0);

        // 🚀 OTIMIZAÇÃO: Buscar clientes compartilhados e da filial em PARALELO
        const allCustomers: any[] = [];
        const seenIds = new Set<number>();

        // Fazer as duas queries em paralelo
        const [sharedResult, branchResult] = await Promise.all([
          // Query 1: Clientes compartilhados
          customerIds.length > 0
            ? supabaseAdmin
              .from('customers')
              .select('*')
              .eq('tenant_id', tenant_id)
              .in('id', customerIds)
            : Promise.resolve({ data: null, error: null }),
          // Query 2: Clientes cadastrados nesta filial
          supabaseAdmin
            .from('customers')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('created_at_branch_id', bid)
        ]);

        // Processar clientes compartilhados
        if (!sharedResult.error && sharedResult.data) {
          for (const customer of sharedResult.data) {
            const id = Number(customer.id);
            if (!seenIds.has(id)) {
              seenIds.add(id);
              allCustomers.push(customer);
            }
          }
        }

        // Processar clientes da filial

        if (!branchResult.error && branchResult.data) {
          for (const customer of branchResult.data) {
            const id = Number(customer.id);
            if (!seenIds.has(id)) {
              seenIds.add(id);
              allCustomers.push(customer);
            }
          }
        }

        console.log(`🔍 [Filial ${bid}] Encontrados ${allCustomers.length} clientes (compartilhados + cadastrados aqui)`);
        return NextResponse.json({ success: true, data: allCustomers });
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    } else {
      // Fallback: retornar todos (compatibilidade com código antigo)
      query = supabaseAdmin
        .from('customers')
        .select('*')
        .eq('tenant_id', tenant_id);
      console.log(`🔍 [Fallback] Buscando todos os clientes do tenant`);
    }

    const { data, error } = await query.order('is_active', { ascending: false }).order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar clientes:', error);
      return NextResponse.json(
        { error: 'Erro ao listar clientes: ' + error.message },
        { status: 400 }
      );
    }

    console.log(`✅ GET /customers - ${data?.length || 0} clientes encontrados para tenant ${tenant_id}`);

    // 🚀 OTIMIZAÇÃO: Cache com revalidação (45 segundos para clientes)
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'public, max-age=45, stale-while-revalidate=90' } }
    );

  } catch (error) {
    console.error('Erro no handler de listagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler para atualizar cliente
async function updateCustomerHandler(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const allowed: Record<string, any> = {};
    // Campos compatíveis com o schema atual da tabela `customers`
    const fields = ['name', 'email', 'phone', 'document', 'city', 'address', 'neighborhood', 'state', 'zipcode', 'notes', 'external_code', 'is_active'];
    for (const key of fields) if (key in body) allowed[key] = body[key];

    // Mapear status para is_active se fornecido
    if ('status' in body) {
      allowed.is_active = body.status === 'active';
    }

    allowed.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('customers')
      .update(allowed)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar cliente: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erro no handler de atualização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Handler para excluir cliente (soft delete se coluna existir, senão delete físico)
async function deleteCustomerHandler(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Tentar soft delete: marcar is_active=false se coluna existir
    const { data: colInfo } = await supabaseAdmin
      .from('customers')
      .select('is_active')
      .eq('id', id)
      .limit(1);

    if (Array.isArray(colInfo) && colInfo.length > 0 && colInfo[0] && typeof colInfo[0].is_active !== 'undefined') {
      const { error: updErr } = await supabaseAdmin
        .from('customers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updErr) {
        return NextResponse.json(
          { error: 'Erro ao desativar cliente: ' + updErr.message },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, id });
    }

    // Caso contrário, excluir fisicamente
    const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { error: 'Erro ao excluir cliente: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erro no handler de exclusão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers (sem validação de plano temporariamente)
export const POST = createCustomerHandler;
export const GET = listCustomersHandler;
export const PUT = updateCustomerHandler;
export const DELETE = deleteCustomerHandler;