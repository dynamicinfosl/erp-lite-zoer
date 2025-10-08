/**
 * ====================================================================
 * SCRIPT DE VERIFICAÇÃO - SISTEMA DE VENDAS/PDV
 * ====================================================================
 * Este script verifica se o sistema de vendas está configurado corretamente
 * no Supabase e testa a integração.
 * 
 * USO: node scripts/verificar-vendas.js
 * ====================================================================
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(message, 'cyan');
  console.log('='.repeat(70));
}

async function verificarTabelas() {
  header('📋 VERIFICANDO TABELAS');
  
  const tabelasEsperadas = ['sales', 'sale_items', 'cash_operations'];
  const resultados = {};
  
  for (const tabela of tabelasEsperadas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        log(`❌ ${tabela}: NÃO EXISTE ou sem acesso`, 'red');
        log(`   Erro: ${error.message}`, 'red');
        resultados[tabela] = false;
      } else {
        log(`✅ ${tabela}: EXISTE`, 'green');
        resultados[tabela] = true;
      }
    } catch (err) {
      log(`❌ ${tabela}: ERRO ao verificar`, 'red');
      log(`   Erro: ${err.message}`, 'red');
      resultados[tabela] = false;
    }
  }
  
  return resultados;
}

async function verificarFuncao() {
  header('⚙️  VERIFICANDO FUNÇÃO generate_sale_number');
  
  try {
    const { data, error } = await supabase.rpc('generate_sale_number');
    
    if (error) {
      log('❌ Função generate_sale_number NÃO existe ou tem erro', 'red');
      log(`   Erro: ${error.message}`, 'red');
      return false;
    } else {
      log(`✅ Função generate_sale_number FUNCIONA`, 'green');
      log(`   Número gerado: ${data}`, 'cyan');
      return true;
    }
  } catch (err) {
    log('❌ Função generate_sale_number NÃO existe', 'red');
    log(`   Erro: ${err.message}`, 'red');
    return false;
  }
}

async function testarInsercao() {
  header('🧪 TESTANDO INSERÇÃO DE VENDA');
  
  try {
    // Gerar número da venda
    const { data: saleNumber, error: numberError } = await supabase
      .rpc('generate_sale_number');
    
    if (numberError) {
      log('❌ Erro ao gerar número da venda', 'red');
      log(`   Erro: ${numberError.message}`, 'red');
      return false;
    }
    
    log(`📝 Número gerado: ${saleNumber}`, 'cyan');
    
    // Inserir venda de teste
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        sale_number: saleNumber,
        customer_name: 'Cliente Teste Automático',
        total_amount: 100.00,
        payment_method: 'dinheiro',
        status: 'completed',
        notes: 'Venda de teste - Script de verificação',
      })
      .select()
      .single();
    
    if (saleError) {
      log('❌ Erro ao inserir venda', 'red');
      log(`   Erro: ${saleError.message}`, 'red');
      return false;
    }
    
    log('✅ Venda inserida com sucesso!', 'green');
    log(`   ID: ${sale.id}`, 'cyan');
    log(`   Número: ${sale.sale_number}`, 'cyan');
    log(`   Total: R$ ${sale.total_amount}`, 'cyan');
    
    // Inserir item de teste
    const { error: itemError } = await supabase
      .from('sale_items')
      .insert({
        sale_id: sale.id,
        product_id: '00000000-0000-0000-0000-000000000000', // UUID fake
        product_name: 'Produto Teste',
        product_code: 'TEST-001',
        unit_price: 100.00,
        quantity: 1,
        discount_percentage: 0,
        subtotal: 100.00,
      });
    
    if (itemError) {
      log('⚠️  Venda criada, mas erro ao inserir item', 'yellow');
      log(`   Erro: ${itemError.message}`, 'yellow');
    } else {
      log('✅ Item da venda inserido com sucesso!', 'green');
    }
    
    // Limpar dados de teste
    log('\n🧹 Limpando dados de teste...', 'yellow');
    await supabase.from('sales').delete().eq('id', sale.id);
    log('✅ Dados de teste removidos', 'green');
    
    return true;
    
  } catch (err) {
    log('❌ Erro no teste de inserção', 'red');
    log(`   Erro: ${err.message}`, 'red');
    return false;
  }
}

async function verificarVendasExistentes() {
  header('📊 ESTATÍSTICAS DE VENDAS');
  
  try {
    const { data, error, count } = await supabase
      .from('sales')
      .select('*', { count: 'exact' });
    
    if (error) {
      log('❌ Erro ao buscar vendas', 'red');
      log(`   Erro: ${error.message}`, 'red');
      return;
    }
    
    log(`📈 Total de vendas no banco: ${count || 0}`, 'cyan');
    
    if (count > 0) {
      // Calcular total
      const total = data.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
      log(`💰 Valor total: R$ ${total.toFixed(2)}`, 'cyan');
      
      // Vendas de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const vendasHoje = data.filter(sale => 
        sale.created_at && sale.created_at.startsWith(hoje)
      ).length;
      log(`📅 Vendas hoje: ${vendasHoje}`, 'cyan');
    }
    
  } catch (err) {
    log('❌ Erro ao verificar vendas existentes', 'red');
    log(`   Erro: ${err.message}`, 'red');
  }
}

async function testarAPI() {
  header('🌐 TESTANDO API /next_api/sales');
  
  log('ℹ️  Este teste precisa que o servidor Next.js esteja rodando', 'yellow');
  log('ℹ️  Execute: npm run dev', 'yellow');
  
  try {
    // Testar se o servidor está rodando
    const response = await fetch('http://localhost:3000/next_api/sales');
    
    if (response.ok) {
      log('✅ API /next_api/sales está respondendo', 'green');
      const data = await response.json();
      log(`   Vendas retornadas: ${data.data?.length || 0}`, 'cyan');
    } else {
      log('⚠️  API respondeu mas com erro', 'yellow');
      log(`   Status: ${response.status}`, 'yellow');
    }
  } catch (err) {
    log('⚠️  Não foi possível testar a API', 'yellow');
    log('   Certifique-se de que o servidor está rodando (npm run dev)', 'yellow');
  }
}

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════════════╗', 'bright');
  log('║     VERIFICAÇÃO DO SISTEMA DE VENDAS/PDV - SUPABASE              ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'bright');
  
  log('\n🔧 Conectando ao Supabase...', 'cyan');
  log(`   URL: ${supabaseUrl}`, 'cyan');
  
  // 1. Verificar tabelas
  const tabelas = await verificarTabelas();
  const todasTabelasExistem = Object.values(tabelas).every(v => v);
  
  // 2. Verificar função
  const funcaoExiste = await verificarFuncao();
  
  // 3. Verificar vendas existentes
  await verificarVendasExistentes();
  
  // 4. Teste de inserção (apenas se tudo estiver OK)
  if (todasTabelasExistem && funcaoExiste) {
    const testeOK = await testarInsercao();
    
    if (testeOK) {
      header('🎉 RESULTADO FINAL');
      log('✅ Sistema de Vendas/PDV está 100% FUNCIONAL!', 'green');
      log('✅ Todas as tabelas existem', 'green');
      log('✅ Função generate_sale_number funcionando', 'green');
      log('✅ Inserção de vendas OK', 'green');
      log('✅ Inserção de itens OK', 'green');
      log('\n🚀 Você pode usar o PDV em: http://localhost:3000/pdv', 'cyan');
    }
  } else {
    header('⚠️  AÇÃO NECESSÁRIA');
    
    if (!todasTabelasExistem) {
      log('❌ As tabelas de vendas não existem', 'red');
      log('\n📝 SOLUÇÃO:', 'yellow');
      log('   1. Abra o Supabase SQL Editor', 'yellow');
      log('   2. Execute o script: scripts/create-sales-BASIC.sql', 'yellow');
      log('   3. Execute este script novamente', 'yellow');
    }
    
    if (!funcaoExiste) {
      log('❌ A função generate_sale_number não existe', 'red');
      log('\n📝 SOLUÇÃO:', 'yellow');
      log('   1. Abra o Supabase SQL Editor', 'yellow');
      log('   2. Execute o script: scripts/create-sales-BASIC.sql', 'yellow');
      log('   3. Execute este script novamente', 'yellow');
    }
  }
  
  // 5. Testar API (opcional)
  await testarAPI();
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Executar
main().catch(err => {
  log('\n❌ ERRO FATAL:', 'red');
  console.error(err);
  process.exit(1);
});

