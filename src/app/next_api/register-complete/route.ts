import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

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

    console.log('🚀 Iniciando cadastro completo...');
    console.log('🔑 Service Key configurada:', !!supabaseServiceKey);
    const data: CompleteRegistrationData = await request.json();
    console.log('📋 Dados recebidos:', {
      responsible: { name: data.responsible?.name, email: data.responsible?.email },
      company: { name: data.company?.name, document: data.company?.document },
      address: { city: data.address?.city, state: data.address?.state },
      plan_id: data.plan_id
    });
    
    // Validar dados obrigatórios
    if (!data.responsible?.email || !data.responsible?.password || !data.responsible?.name) {
      console.error('❌ Dados do responsável inválidos:', data.responsible);
      return NextResponse.json(
        { error: 'Dados do responsável são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!data.company?.name || !data.company?.document) {
      console.error('❌ Dados da empresa inválidos:', data.company);
      return NextResponse.json(
        { error: 'Dados da empresa são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!data.address?.zip_code || !data.address?.address || !data.address?.city || !data.address?.state) {
      console.error('❌ Dados de endereço inválidos:', data.address);
      return NextResponse.json(
        { error: 'Endereço completo é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Criar usuário no Supabase Auth
    console.log('👤 Criando usuário no Supabase Auth...');
    console.log('📧 Email:', data.responsible.email);
    console.log('🔑 Senha (primeiros 3 caracteres):', data.responsible.password.substring(0, 3) + '***');
    
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
      console.error('❌ Erro ao criar usuário:', authError);
      console.error('❌ Código do erro:', authError.status);
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + authError.message },
        { status: 400 }
      );
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('👤 User ID:', authData.user?.id);
    console.log('📧 Email confirmado:', authData.user?.email_confirmed_at);
    console.log('🎫 Auth UID:', authData.user?.id);

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

    // 3. Criar tenant (empresa) - versão robusta que funciona com qualquer schema
    console.log('🏢 Criando tenant (empresa)...');
    let tenant;
    let tenantError;

    // Primeiro, tentar com todos os campos
    try {
      console.log('📝 Tentando criar tenant com todos os campos...');
      const fullTenantData = {
        name: data.company.name,
        slug: uniqueSlug,
        // Dados gerais da empresa
        tipo: data.company.document_type === 'CPF' ? 'fisica' : 'juridica',
        document: data.company.document,
        nome_fantasia: data.company.fantasy_name || data.company.name,
        razao_social: data.company.name,
        // Contato
        email: data.responsible.email,
        phone: data.responsible.phone,
        // Endereço completo
        address: data.address.address,
        numero: data.address.number,
        complemento: data.address.complement,
        bairro: data.address.neighborhood,
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zip_code,
        // Status e trial
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await supabaseAdmin
        .from('tenants')
        .insert(fullTenantData)
        .select()
        .single();
      
      tenant = result.data;
      tenantError = result.error;
      
      if (tenantError) {
        console.warn('⚠️ Erro com todos os campos:', tenantError.message);
        throw new Error('Tentando campos básicos');
      } else {
        console.log('✅ Tenant criado com todos os campos');
      }
    } catch (error) {
      console.warn('🔄 Tentativa com todos os campos falhou, tentando apenas campos essenciais...');
      
      // Se falhar, tentar apenas com campos essenciais
      const basicTenantData = {
        name: data.company.name,
        slug: uniqueSlug,
        // Dados básicos da empresa
        tipo: data.company.document_type === 'CPF' ? 'fisica' : 'juridica',
        document: data.company.document,
        nome_fantasia: data.company.fantasy_name || data.company.name,
        razao_social: data.company.name,
        // Contato básico
        email: data.responsible.email,
        phone: data.responsible.phone,
        // Endereço básico
        address: data.address.address,
        numero: data.address.number,
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zip_code,
        // Status e trial
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      console.log('📝 Tentando criar tenant com campos básicos...');
      const result = await supabaseAdmin
        .from('tenants')
        .insert(basicTenantData)
        .select()
        .single();
      
      tenant = result.data;
      tenantError = result.error;
      
      if (tenantError) {
        console.error('❌ Erro mesmo com campos básicos:', tenantError);
      } else {
        console.log('✅ Tenant criado com campos básicos');
      }
    }

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

    // 5. Criar/Atualizar subscription (empresa → plano)
    try {
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existingSub) {
        if (data.plan_id) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_id: data.plan_id,
              status: 'trialing',
              trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', existingSub.id);
        }
      } else {
        const { error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            tenant_id: tenant.id,
            plan_id: data.plan_id,
            status: 'trialing',
            trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (subscriptionError) {
          console.warn('Subscription não criada:', subscriptionError.message);
        } else {
          console.log('Subscription criada com sucesso');
        }
      }
    } catch (error) {
      console.warn('Erro ao configurar subscription:', error);
      // Não falhar aqui, pois o usuário e tenant já foram criados com sucesso
    }

    // 5.5 Disparar webhook para o n8n (Boas-vindas ao cadastrar)
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://project1-n8n-editor.y7f9fe.easypanel.host/webhook/juga-boas-vindas';
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'signup',
          tenant_id: tenant.id,
          user_name: data.responsible.name,
          user_email: data.responsible.email,
          company_name: tenant.name,
          phone: data.responsible.phone || '',
        }),
      }).catch(err => console.error('⚠️ Falha silenciosa no fetch do n8n cadastro:', err));
    } catch (n8nErr) {
      console.error('⚠️ Erro ao disparar n8n cadastro:', n8nErr);
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
