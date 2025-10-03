// Script para testar a API de cadastro
const testData = {
  responsible: {
    name: "João Silva",
    email: "joao@teste.com",
    password: "123456",
    phone: "(21) 99999-9999",
    cpf: "123.456.789-00"
  },
  company: {
    name: "Empresa Teste",
    fantasy_name: "Teste LTDA",
    document: "12.345.678/0001-90",
    document_type: "CNPJ",
    corporate_email: "contato@teste.com",
    corporate_phone: "(21) 3333-4444"
  },
  address: {
    zip_code: "20000-000",
    address: "Rua Teste",
    number: "123",
    complement: "Sala 1",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ"
  },
  plan_id: "basic"
};

async function testAPI() {
  try {
    console.log('🧪 Testando API de cadastro...');
    console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/next_api/register-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('📄 Resposta:', result);
    
    if (response.ok) {
      console.log('✅ API funcionando!');
    } else {
      console.log('❌ API com erro:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testAPI();
