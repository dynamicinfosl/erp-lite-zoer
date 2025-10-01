/**
 * Script para vincular o usuário de desenvolvimento ao tenant
 * Execute com: node scripts/setup-tenant-dev.js
 */

const { createClient } = require('@supabase/supabase-js');

// Credenciais diretas do Supabase
const supabaseUrl = 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas no .env.local');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações
const USER_EMAIL = 'gabrieldecousa100@gmail.com'; // Seu email
const TENANT_ID = '11111111-1111-1111-1111-111111111111'; // ID do tenant de desenvolvimento

async function setupTenantDev() {
  console.log('🚀 Iniciando configuração do tenant de desenvolvimento...\n');
  
  try {
    // 1. Verificar se o tenant existe
    console.log('1️⃣ Verificando tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', TENANT_ID)
      .single();
    
    if (tenantError) {
      console.error('❌ Erro ao buscar tenant:', tenantError.message);
      console.log('\n⚠️  Execute primeiro o script SQL no Supabase:');
      console.log('   scripts/setup-complete-saas.sql');
      return;
    }
    
    console.log('✅ Tenant encontrado:', tenant.name);
    console.log('   Status:', tenant.status);
    console.log('   Trial até:', tenant.trial_ends_at);
    
    // 2. Chamar função para vincular usuário
    console.log('\n2️⃣ Vinculando usuário ao tenant...');
    const { data: result, error: linkError } = await supabase
      .rpc('link_user_to_tenant', {
        p_user_email: USER_EMAIL,
        p_tenant_id: TENANT_ID,
        p_role: 'owner'
      });
    
    if (linkError) {
      console.error('❌ Erro ao vincular usuário:', linkError.message);
      return;
    }
    
    if (!result.success) {
      console.error('❌', result.message);
      console.log('\n💡 Dica: Primeiro faça login no sistema com este email para criar o usuário no Supabase Auth');
      return;
    }
    
    console.log('✅', result.message);
    console.log('   User ID:', result.user_id);
    console.log('   Role:', result.role);
    
    // 3. Verificar assinatura
    console.log('\n3️⃣ Verificando assinatura...');
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, slug)
      `)
      .eq('tenant_id', TENANT_ID)
      .single();
    
    if (subError) {
      console.warn('⚠️  Nenhuma assinatura encontrada');
    } else {
      console.log('✅ Assinatura ativa:');
      console.log('   Plano:', subscription.plan.name);
      console.log('   Status:', subscription.status);
      console.log('   Válido até:', subscription.current_period_end);
    }
    
    // 4. Verificar membership
    console.log('\n4️⃣ Verificando membership...');
    const { data: memberships, error: memberError } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('tenant_id', TENANT_ID);
    
    if (!memberError && memberships) {
      console.log('✅ Memberships ativos:', memberships.length);
      memberships.forEach(m => {
        console.log(`   - User: ${m.user_id.substring(0, 8)}... (${m.role})`);
      });
    }
    
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Ative a autenticação no .env.local (NEXT_PUBLIC_ENABLE_AUTH=true)');
    console.log('   2. Reinicie o servidor (npm run dev)');
    console.log('   3. Faça login com:', USER_EMAIL);
    console.log('   4. Você terá acesso completo ao sistema como owner do tenant!\n');
    
  } catch (error) {
    console.error('\n❌ Erro inesperado:', error.message);
    console.error(error);
  }
}

setupTenantDev();

