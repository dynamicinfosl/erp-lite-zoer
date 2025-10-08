// Script para testar a API de orders
const testOrdersAPI = async () => {
  console.log('🧪 Testando API de orders...');
  
  try {
    // Teste 1: GET - Listar ordens
    console.log('\n1️⃣ Testando GET /next_api/orders');
    const getResponse = await fetch('/next_api/orders');
    console.log('Status:', getResponse.status);
    console.log('OK:', getResponse.ok);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('Dados recebidos:', getData);
    } else {
      const errorText = await getResponse.text();
      console.log('Erro:', errorText);
    }
    
    // Teste 2: POST - Criar ordem
    console.log('\n2️⃣ Testando POST /next_api/orders');
    const postData = {
      tenant_id: 'test-tenant-id',
      cliente: 'João Silva Teste',
      tipo: 'Reparo Teste',
      descricao: 'Descrição do teste',
      prioridade: 'media',
      valor_estimado: 100.50,
      data_prazo: '2024-12-31',
      tecnico: 'Técnico Teste'
    };
    
    console.log('Dados enviados:', postData);
    
    const postResponse = await fetch('/next_api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    
    console.log('Status:', postResponse.status);
    console.log('OK:', postResponse.ok);
    
    if (postResponse.ok) {
      const postResult = await postResponse.json();
      console.log('Ordem criada:', postResult);
    } else {
      const errorText = await postResponse.text();
      console.log('Erro:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testOrdersAPI();

