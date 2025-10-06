import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withPlanValidation } from '@/lib/plan-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
      address,
      neighborhood,
      state,
      zipcode,
      notes
    } = body;

    if (!tenant_id || !name) {
      console.log('❌ Validação falhou:', { tenant_id, name });
      return NextResponse.json(
        { error: 'Tenant ID e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Preparar dados para inserção (usando schema original da tabela)
    const customerData: any = {
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
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Campos tenant_id e type não existem na tabela customers atual
    // Removidos para evitar erros de schema

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
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    console.log('🔍 Debug - Listando clientes para tenant:', tenant_id);

    // Como a tabela customers não tem tenant_id configurado corretamente,
    // vamos listar todos os clientes por enquanto
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar clientes:', error);
      return NextResponse.json(
        { error: 'Erro ao listar clientes: ' + error.message },
        { status: 400 }
      );
    }

    console.log('🔍 Debug - Clientes encontrados:', data?.length || 0);
    return NextResponse.json({ success: true, data });

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
    const fields = ['name','email','phone','document','city','address','neighborhood','state','zipcode','notes','is_active'];
    for (const key of fields) if (key in body) allowed[key] = body[key];
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