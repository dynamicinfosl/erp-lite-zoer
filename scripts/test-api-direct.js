// Script para testar a API diretamente
const testAPI = async () => {
  try {
    console.log('🧪 Testando API de vendas...');
    
    // Simular tenant_id (substitua pelo seu tenant real)
    const tenantId = 'SEU_TENANT_ID_AQUI';
    
    const response = await fetch(`http://localhost:3000/next_api/sales?tenant_id=${tenantId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Resposta da API:', {
      success: data.success,
      totalVendas: data.data?.length || data.sales?.length || 0,
      estrutura: Object.keys(data),
      primeiraVenda: data.data?.[0] || data.sales?.[0]
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
    return null;
  }
};

// Executar teste
testAPI();

