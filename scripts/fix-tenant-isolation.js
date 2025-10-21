#!/usr/bin/env node

/**
 * Script para Corrigir Isolamento de Tenants
 * Verifica e corrige problemas de dados cruzados entre usuários
 */

const { createClient } = require('@supabase/supabase-js');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

async function checkTenantIsolation() {
  log('🔍 VERIFICAÇÃO DE ISOLAMENTO DE TENANTS', 'cyan');
  log('='.repeat(50), 'cyan');

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // 1. Listar todos os usuários
    log('\n👥 Listando todos os usuários...', 'blue');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (!users || !users.users) {
      log('✅ Nenhum usuário encontrado', 'green');
      return true;
    }
    
    log(`📊 Total de usuários: ${users.users.length}`, 'yellow');
    
    // 2. Listar todos os tenants
    log('\n🏢 Listando todos os tenants...', 'blue');
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false });
    
    if (tenantsError) {
      log(`❌ Erro ao listar tenants: ${tenantsError.message}`, 'red');
    } else if (tenants) {
      log(`📊 Total de tenants: ${tenants.length}`, 'yellow');
      
      tenants.forEach((tenant, index) => {
        const createdAt = new Date(tenant.created_at).toLocaleString('pt-BR');
        log(`${index + 1}. ${tenant.name} (${tenant.id})`, 'yellow');
        log(`   Email: ${tenant.email || 'N/A'}`, 'blue');
        log(`   Criado: ${createdAt}`, 'blue');
      });
    }
    
    // 3. Listar todos os membros
    log('\n👥 Listando todos os membros...', 'blue');
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('user_memberships')
      .select('*');
    
    if (membershipsError) {
      log(`❌ Erro ao listar membros: ${membershipsError.message}`, 'red');
    } else if (memberships) {
      log(`📊 Total de membros: ${memberships.length}`, 'yellow');
      
      memberships.forEach((membership, index) => {
        const user = users.users.find(u => u.id === membership.user_id);
        const tenant = tenants?.find(t => t.id === membership.tenant_id);
        log(`${index + 1}. Usuário: ${user?.email || 'N/A'}`, 'yellow');
        log(`   Tenant: ${tenant?.name || 'N/A'} (${membership.tenant_id})`, 'blue');
        log(`   Role: ${membership.role}`, 'blue');
        log(`   Ativo: ${membership.is_active ? 'Sim' : 'Não'}`, 'blue');
      });
    }
    
    // 4. Verificar dados de produtos
    log('\n📦 Verificando produtos por tenant...', 'blue');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, tenant_id, created_at')
      .order('created_at', { ascending: false });
    
    if (productsError) {
      log(`❌ Erro ao listar produtos: ${productsError.message}`, 'red');
    } else if (products) {
      log(`📊 Total de produtos: ${products.length}`, 'yellow');
      
      // Agrupar por tenant
      const productsByTenant = {};
      products.forEach(product => {
        if (!productsByTenant[product.tenant_id]) {
          productsByTenant[product.tenant_id] = [];
        }
        productsByTenant[product.tenant_id].push(product);
      });
      
      Object.entries(productsByTenant).forEach(([tenantId, tenantProducts]) => {
        const tenant = tenants?.find(t => t.id === tenantId);
        log(`\n🏢 ${tenant?.name || 'Tenant Desconhecido'} (${tenantId}):`, 'yellow');
        log(`   Produtos: ${tenantProducts.length}`, 'blue');
        tenantProducts.forEach(product => {
          log(`     - ${product.name}`, 'green');
        });
      });
    }
    
    // 5. Verificar dados de clientes
    log('\n👥 Verificando clientes por tenant...', 'blue');
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, name, tenant_id, created_at')
      .order('created_at', { ascending: false });
    
    if (customersError) {
      log(`❌ Erro ao listar clientes: ${customersError.message}`, 'red');
    } else if (customers) {
      log(`📊 Total de clientes: ${customers.length}`, 'yellow');
      
      // Agrupar por tenant
      const customersByTenant = {};
      customers.forEach(customer => {
        if (!customersByTenant[customer.tenant_id]) {
          customersByTenant[customer.tenant_id] = [];
        }
        customersByTenant[customer.tenant_id].push(customer);
      });
      
      Object.entries(customersByTenant).forEach(([tenantId, tenantCustomers]) => {
        const tenant = tenants?.find(t => t.id === tenantId);
        log(`\n🏢 ${tenant?.name || 'Tenant Desconhecido'} (${tenantId}):`, 'yellow');
        log(`   Clientes: ${tenantCustomers.length}`, 'blue');
        tenantCustomers.forEach(customer => {
          log(`     - ${customer.name}`, 'green');
        });
      });
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na verificação: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  log('🚀 VERIFICAÇÃO DE ISOLAMENTO DE TENANTS', 'bright');
  
  try {
    const success = await checkTenantIsolation();
    
    if (success) {
      log('\n🎉 Verificação concluída!', 'green');
      log('💡 Verifique se os dados estão isolados corretamente', 'yellow');
    } else {
      log('\n❌ Erro na verificação', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkTenantIsolation };
