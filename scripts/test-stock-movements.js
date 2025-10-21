const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testStockMovements() {
  try {
    console.log('🔧 TESTE DO ENDPOINT DE MOVIMENTAÇÕES DE ESTOQUE');
    console.log('================================================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    
    // 1. Verificar se a tabela stock_movements existe
    console.log('📋 VERIFICANDO TABELA STOCK_MOVEMENTS');
    console.log('=====================================');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('stock_movements')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Erro ao acessar tabela stock_movements:', tableError.message);
      console.log('💡 A tabela stock_movements pode não existir no banco de dados');
      return;
    } else {
      console.log('✅ Tabela stock_movements acessível');
      if (tableInfo && tableInfo.length > 0) {
        console.log('📊 Campos da tabela:', Object.keys(tableInfo[0]));
      }
    }
    
    // 2. Verificar se há movimentações no banco
    console.log('\n🔍 VERIFICANDO MOVIMENTAÇÕES EXISTENTES');
    console.log('========================================');
    
    const { data: allMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*');
    
    if (movementsError) {
      console.log('❌ Erro ao buscar movimentações:', movementsError.message);
    } else {
      console.log(`📊 Total de movimentações no banco: ${allMovements?.length || 0}`);
      if (allMovements && allMovements.length > 0) {
        console.log('📝 Primeira movimentação:', {
          id: allMovements[0].id,
          product_id: allMovements[0].product_id,
          movement_type: allMovements[0].movement_type,
          quantity: allMovements[0].quantity
        });
      }
    }
    
    // 3. Verificar produtos do tenant
    console.log('\n📦 VERIFICANDO PRODUTOS DO TENANT');
    console.log('==================================');
    
    const { data: tenantProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos do tenant:', productsError.message);
    } else {
      console.log(`📊 Produtos do tenant: ${tenantProducts?.length || 0}`);
      if (tenantProducts && tenantProducts.length > 0) {
        console.log('📝 Primeiro produto:', {
          id: tenantProducts[0].id,
          name: tenantProducts[0].name,
          tenant_id: tenantProducts[0].tenant_id
        });
      }
    }
    
    // 4. Testar endpoint diretamente
    console.log('\n🌐 TESTANDO ENDPOINT DIRETAMENTE');
    console.log('================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/stock-movements?tenant_id=${targetTenantId}`);
      console.log(`📡 Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint funcionando');
        console.log(`📊 Movimentações retornadas: ${data?.data?.length || 0}`);
        console.log(`📝 Estrutura da resposta:`, {
          success: data?.success,
          dataLength: data?.data?.length,
          hasData: !!data?.data
        });
      } else {
        const errorText = await response.text();
        console.log(`❌ Erro na resposta: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar endpoint: ${error.message}`);
    }
    
    // 5. Criar uma movimentação de teste se não existir nenhuma
    if (!allMovements || allMovements.length === 0) {
      console.log('\n📝 CRIANDO MOVIMENTAÇÃO DE TESTE');
      console.log('=================================');
      
      // Primeiro, criar um produto de teste
      const testProduct = {
        user_id: '00000000-0000-0000-0000-000000000000',
        tenant_id: targetTenantId,
        name: 'Produto Teste Movimentação',
        sku: 'TEST-MOV-001',
        description: 'Produto para teste de movimentação',
        price: 10.00,
        cost_price: 5.00,
        stock: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newProduct, error: createProductError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();
      
      if (createProductError) {
        console.log('❌ Erro ao criar produto de teste:', createProductError.message);
      } else {
        console.log('✅ Produto de teste criado:', newProduct.name);
        
        // Agora criar uma movimentação
        const testMovement = {
          product_id: newProduct.id,
          movement_type: 'entrada',
          quantity: 50,
          reason: 'Teste de movimentação',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: newMovement, error: createMovementError } = await supabase
          .from('stock_movements')
          .insert(testMovement)
          .select()
          .single();
        
        if (createMovementError) {
          console.log('❌ Erro ao criar movimentação de teste:', createMovementError.message);
        } else {
          console.log('✅ Movimentação de teste criada:', newMovement.movement_type);
        }
      }
    }
    
    // 6. Testar endpoint novamente após criar dados
    console.log('\n🔄 TESTANDO ENDPOINT APÓS CRIAÇÃO');
    console.log('==================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/stock-movements?tenant_id=${targetTenantId}`);
      console.log(`📡 Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Movimentações retornadas: ${data?.data?.length || 0}`);
        if (data?.data && data.data.length > 0) {
          console.log('📝 Primeira movimentação:', {
            id: data.data[0].id,
            movement_type: data.data[0].movement_type,
            quantity: data.data[0].quantity,
            product_name: data.data[0].product_name
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Erro na resposta: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar endpoint: ${error.message}`);
    }
    
    console.log('\n🎯 RESUMO DO TESTE');
    console.log('==================');
    console.log(`✅ Tabela stock_movements: ${tableError ? 'NÃO EXISTE' : 'EXISTE'}`);
    console.log(`📊 Movimentações no banco: ${allMovements?.length || 0}`);
    console.log(`📦 Produtos do tenant: ${tenantProducts?.length || 0}`);
    console.log(`🌐 Endpoint funcionando: ${response?.ok ? 'SIM' : 'NÃO'}`);
    
    if (tableError) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
      console.log('💡 A tabela "stock_movements" não existe no banco de dados');
      console.log('💡 É necessário criar a tabela ou verificar o nome correto');
    } else {
      console.log('\n✅ ENDPOINT DE MOVIMENTAÇÕES FUNCIONANDO!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testStockMovements().catch(console.error);
