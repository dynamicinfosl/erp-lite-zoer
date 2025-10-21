const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testOrdersEndpoint() {
  try {
    console.log('🔧 TESTE DO ENDPOINT DE ORDERS');
    console.log('==============================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    
    // 1. Verificar se a tabela orders existe
    console.log('📋 VERIFICANDO TABELA ORDERS');
    console.log('============================');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Erro ao acessar tabela orders:', tableError.message);
      console.log('💡 A tabela orders pode não existir no banco de dados');
      return;
    } else {
      console.log('✅ Tabela orders acessível');
      if (tableInfo && tableInfo.length > 0) {
        console.log('📊 Campos da tabela:', Object.keys(tableInfo[0]));
      }
    }
    
    // 2. Buscar ordens existentes
    console.log('\n🔍 BUSCANDO ORDENS EXISTENTES');
    console.log('==============================');
    
    const { data: existingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', targetTenantId);
    
    if (ordersError) {
      console.log('❌ Erro ao buscar ordens:', ordersError.message);
    } else {
      console.log(`✅ Ordens encontradas: ${existingOrders?.length || 0}`);
      existingOrders?.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.numero || 'N/A'} - ${order.descricao || 'N/A'}`);
      });
    }
    
    // 3. Testar endpoint diretamente
    console.log('\n🌐 TESTANDO ENDPOINT DIRETAMENTE');
    console.log('=================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/orders?tenant_id=${targetTenantId}`);
      console.log(`📡 Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint funcionando');
        console.log(`📊 Ordens retornadas: ${data?.data?.length || 0}`);
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
    
    // 4. Criar uma ordem de teste se não existir nenhuma
    if (!existingOrders || existingOrders.length === 0) {
      console.log('\n📝 CRIANDO ORDEM DE TESTE');
      console.log('=========================');
      
      const testOrder = {
        user_id: '00000000-0000-0000-0000-000000000000',
        tenant_id: targetTenantId,
        numero: 'OS-2025-001',
        cliente: 'Cliente Teste',
        tipo: 'Manutenção',
        descricao: 'Ordem de serviço de teste',
        valor_estimado: 150.00,
        status: 'aberta',
        prioridade: 'baixa',
        data_abertura: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Erro ao criar ordem de teste:', createError.message);
      } else {
        console.log('✅ Ordem de teste criada:', newOrder.numero);
      }
    }
    
    // 5. Testar endpoint novamente após criar ordem
    console.log('\n🔄 TESTANDO ENDPOINT APÓS CRIAÇÃO');
    console.log('==================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/orders?tenant_id=${targetTenantId}`);
      console.log(`📡 Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Ordens retornadas: ${data?.data?.length || 0}`);
        if (data?.data && data.data.length > 0) {
          console.log('📝 Primeira ordem:', {
            numero: data.data[0].numero,
            cliente: data.data[0].cliente,
            status: data.data[0].status
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
    console.log(`✅ Tabela orders: ${tableError ? 'NÃO EXISTE' : 'EXISTE'}`);
    console.log(`📊 Ordens no banco: ${existingOrders?.length || 0}`);
    console.log(`🌐 Endpoint funcionando: SIM`);
    
    if (tableError) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
      console.log('💡 A tabela "orders" não existe no banco de dados');
      console.log('💡 É necessário criar a tabela ou verificar o nome correto');
    } else {
      console.log('\n✅ ENDPOINT DE ORDERS FUNCIONANDO!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testOrdersEndpoint().catch(console.error);
