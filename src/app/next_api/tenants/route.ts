import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Erro ao buscar tenant:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados da empresa', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: tenant });
  } catch (error: any) {
    console.error('Erro na API tenants GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do tenant é obrigatório' }, { status: 400 });
    }

    console.log('📝 Atualizando tenant:', id, updateData);

    // Remover campos que podem não existir no schema
    const safeUpdateData: any = {};
    
    // Campos que existem na tabela tenants
    if (updateData.name !== undefined) safeUpdateData.name = updateData.name;
    if (updateData.email !== undefined) safeUpdateData.email = updateData.email;
    if (updateData.phone !== undefined) safeUpdateData.phone = updateData.phone;
    if (updateData.document !== undefined) safeUpdateData.document = updateData.document;
    if (updateData.address !== undefined) safeUpdateData.address = updateData.address;
    if (updateData.city !== undefined) safeUpdateData.city = updateData.city;
    if (updateData.state !== undefined) safeUpdateData.state = updateData.state;
    if (updateData.zip_code !== undefined) safeUpdateData.zip_code = updateData.zip_code;

    console.log('📝 Dados seguros para atualizar:', safeUpdateData);

    // Primeiro, verificar se o tenant existe
    const { data: existingTenant, error: checkError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTenant) {
      console.error('❌ Tenant não encontrado:', id, checkError);
      return NextResponse.json({ 
        error: 'Empresa não encontrada', 
        details: checkError?.message || 'ID inválido'
      }, { status: 404 });
    }

    console.log('✅ Tenant encontrado:', existingTenant.name);

    // Atualizar o tenant
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .update(safeUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar tenant:', error);
      return NextResponse.json({ 
        error: 'Erro ao atualizar dados da empresa', 
        details: error.message 
      }, { status: 500 });
    }

    if (!tenant) {
      console.error('❌ Nenhum dado retornado após update');
      return NextResponse.json({ 
        error: 'Erro ao atualizar: nenhum dado retornado'
      }, { status: 500 });
    }

    console.log('✅ Tenant atualizado com sucesso:', tenant);
    return NextResponse.json({ data: tenant, success: true });
  } catch (error: any) {
    console.error('❌ Erro na API tenants PUT:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}





