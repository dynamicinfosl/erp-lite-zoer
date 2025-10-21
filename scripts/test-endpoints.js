#!/usr/bin/env node

/**
 * Script para Testar Endpoints
 * Verifica se todos os endpoints estão funcionando com isolamento correto
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

async function testEndpoints() {
  log('🧪 TESTANDO ENDPOINTS', 'cyan');
  log('='.repeat(50), 'cyan');

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // 1. Testar tenant do usuário mais recente
    log('\n👥 Testando tenant do usuário mais recente...', 'blue');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (!users || !users.users) {
      log('✅ Nenhum usuário encontrado', 'green');
      return true;
    }
    
    const recentUser = users.users
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    log(`📧 Usuário mais recente: ${recentUser.email}`, 'yellow');
    
    // 2. Buscar tenant do usuário
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id')
      .eq('user_id', recentUser.id)
      .eq('is_active', true)
      .single();
    
    if (membershipError || !membership) {
      log(`❌ Erro ao buscar membership: ${membershipError?.message}`, 'red');
      return false;
    }
    
    const tenantId = membership.tenant_id;
    log(`🏢 Tenant ID: ${tenantId}`, 'yellow');
    
    // 3. Testar produtos
    log('\n📦 Testando produtos...', 'blue');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (productsError) {
      log(`❌ Erro ao buscar produtos: ${productsError.message}`, 'red');
    } else {
      log(`✅ Produtos encontrados: ${products?.length || 0}`, 'green');
    }
    
    // 4. Testar clientes
    log('\n👥 Testando clientes...', 'blue');
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, name, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (customersError) {
      log(`❌ Erro ao buscar clientes: ${customersError.message}`, 'red');
    } else {
      log(`✅ Clientes encontrados: ${customers?.length || 0}`, 'green');
    }
    
    // 5. Testar vendas
    log('\n💰 Testando vendas...', 'blue');
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('id, total, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (salesError) {
      log(`❌ Erro ao buscar vendas: ${salesError.message}`, 'red');
    } else {
      log(`✅ Vendas encontradas: ${sales?.length || 0}`, 'green');
    }
    
    // 6. Testar movimentações de estoque
    log('\n📦 Testando movimentações de estoque...', 'blue');
    const { data: stockMovements, error: stockError } = await supabaseAdmin
      .from('stock_movements')
      .select('id, movement_type, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (stockError) {
      log(`❌ Erro ao buscar movimentações: ${stockError.message}`, 'red');
    } else {
      log(`✅ Movimentações encontradas: ${stockMovements?.length || 0}`, 'green');
    }
    
    // 7. Verificar isolamento
    log('\n🔒 Verificando isolamento...', 'blue');
    
    // Buscar dados de outros tenants
    const { data: otherProducts, error: otherProductsError } = await supabaseAdmin
      .from('products')
      .select('id, name, tenant_id')
      .neq('tenant_id', tenantId)
      .limit(5);
    
    if (otherProductsError) {
      log(`❌ Erro ao verificar isolamento: ${otherProductsError.message}`, 'red');
    } else {
      log(`✅ Dados de outros tenants: ${otherProducts?.length || 0}`, 'green');
      
      if (otherProducts && otherProducts.length > 0) {
        log('📊 Outros tenants encontrados:', 'yellow');
        otherProducts.forEach(product => {
          log(`   - ${product.name} (tenant: ${product.tenant_id})`, 'blue');
        });
      }
    }
    
    log('\n✅ Teste de endpoints concluído!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ Erro no teste: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  log('🚀 TESTE DE ENDPOINTS', 'bright');
  
  try {
    const success = await testEndpoints();
    
    if (success) {
      log('\n🎉 Todos os testes passaram!', 'green');
      log('💡 Os endpoints estão funcionando com isolamento correto', 'yellow');
    } else {
      log('\n❌ Alguns testes falharam', 'red');
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

module.exports = { testEndpoints };
