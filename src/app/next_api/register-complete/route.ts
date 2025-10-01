import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface CompleteRegistrationData {
  // Dados do responsável
  responsible: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    password: string;
  };
  
  // Dados da empresa
  company: {
    name: string;
    fantasy_name?: string;
    document: string;
    document_type: 'CNPJ' | 'CPF';
    corporate_email?: string;
    corporate_phone?: string;
  };
  
  // Endereço
  address: {
    zip_code: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
  };
  
  // Plano selecionado
  plan_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: CompleteRegistrationData = await request.json();
    
    // Validar dados obrigatórios
    if (!data.responsible.email || !data.responsible.password || !data.responsible.name) {
      return NextResponse.json(
        { error: 'Dados do responsável são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!data.company.name || !data.company.document) {
      return NextResponse.json(
        { error: 'Dados da empresa são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!data.address.zip_code || !data.address.address || !data.address.city || !data.address.state) {
      return NextResponse.json(
        { error: 'Endereço completo é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.responsible.email,
      password: data.responsible.password,
      user_metadata: {
        name: data.responsible.name,
        phone: data.responsible.phone,
        cpf: data.responsible.cpf,
      },
      email_confirm: true, // Auto-confirmar email para desenvolvimento
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 400 }
      );
    }

    // 2. Criar slug único para a empresa
    const baseSlug = data.company.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // 3. Criar tenant (empresa)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: data.company.name,
        slug: uniqueSlug,
        fantasy_name: data.company.fantasy_name,
        document: data.company.document,
        document_type: data.company.document_type,
        corporate_email: data.company.corporate_email,
        corporate_phone: data.company.corporate_phone,
        email: data.responsible.email, // Email do responsável como contato principal
        phone: data.responsible.phone,
        address: `${data.address.address}, ${data.address.number}`,
        complement: data.address.complement,
        neighborhood: data.address.neighborhood,
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zip_code,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 dias de trial
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Erro ao criar tenant:', tenantError);
      // Tentar deletar o usuário criado em caso de erro
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Erro ao criar empresa: ' + tenantError.message },
        { status: 400 }
      );
    }

    // 4. Criar membership (usuário → empresa)
    const { error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenant.id,
        role: 'owner',
        is_active: true,
      });

    if (membershipError) {
      console.error('Erro ao criar membership:', membershipError);
      // Tentar limpar dados criados em caso de erro
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Erro ao vincular usuário à empresa: ' + membershipError.message },
        { status: 400 }
      );
    }

    // 5. Criar subscription (empresa → plano)
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan_id: data.plan_id,
        status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (subscriptionError) {
      console.error('Erro ao criar subscription:', subscriptionError);
      // Não falhar aqui, pois o usuário já foi criado com sucesso
      console.warn('Subscription não criada, mas usuário criado com sucesso');
    }

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      data: {
        user_id: authData.user.id,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        trial_ends_at: tenant.trial_ends_at,
      }
    });

  } catch (error) {
    console.error('Erro no cadastro completo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
