import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Campos básicos
    if (updateData.name !== undefined) safeUpdateData.name = updateData.name;
    if (updateData.email !== undefined) safeUpdateData.email = updateData.email;
    if (updateData.phone !== undefined) safeUpdateData.phone = updateData.phone;
    if (updateData.document !== undefined) safeUpdateData.document = updateData.document;
    
    // Dados gerais da empresa
    if (updateData.tipo !== undefined) safeUpdateData.tipo = updateData.tipo;
    if (updateData.nome_fantasia !== undefined) safeUpdateData.nome_fantasia = updateData.nome_fantasia;
    if (updateData.razao_social !== undefined) safeUpdateData.razao_social = updateData.razao_social;
    if (updateData.inscricao_estadual !== undefined) safeUpdateData.inscricao_estadual = updateData.inscricao_estadual;
    if (updateData.inscricao_municipal !== undefined) safeUpdateData.inscricao_municipal = updateData.inscricao_municipal;
    if (updateData.cnae_principal !== undefined) safeUpdateData.cnae_principal = updateData.cnae_principal;
    if (updateData.regime_tributario !== undefined) safeUpdateData.regime_tributario = updateData.regime_tributario;
    if (updateData.regime_especial !== undefined) safeUpdateData.regime_especial = updateData.regime_especial;
    
    // Contato
    if (updateData.celular !== undefined) safeUpdateData.celular = updateData.celular;
    if (updateData.site !== undefined) safeUpdateData.site = updateData.site;
    
    // Endereço completo
    if (updateData.address !== undefined) safeUpdateData.address = updateData.address;
    if (updateData.numero !== undefined) safeUpdateData.numero = updateData.numero;
    if (updateData.complemento !== undefined) safeUpdateData.complemento = updateData.complemento;
    if (updateData.bairro !== undefined) safeUpdateData.bairro = updateData.bairro;
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

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, name, slug, ...extraData } = body;

    if (!id || !name) {
      return NextResponse.json({ 
        error: 'ID e nome do tenant são obrigatórios' 
      }, { status: 400 });
    }

    console.log('📝 Criando novo tenant:', id, name);

    // Verificar se tenant já existe
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json({ 
        error: 'Tenant já existe. Use PUT para atualizar.' 
      }, { status: 409 });
    }

    const baseSlug = (slug || name || 'minha empresa')
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'minha-empresa';

    let finalSlug = baseSlug;
    let suffix = 1;
    while (true) {
      const { data: slugConflict } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (!slugConflict) break;
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
      if (suffix > 50) {
        finalSlug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
        break;
      }
    }

    // Criar novo tenant
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        id,
        name,
        slug: finalSlug,
        status: 'trial',
        ...extraData
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar tenant:', error);
      return NextResponse.json({ 
        error: 'Erro ao criar empresa', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Tenant criado com sucesso:', tenant);
    return NextResponse.json({ data: tenant, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Erro na API tenants POST:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 });
  }
}

