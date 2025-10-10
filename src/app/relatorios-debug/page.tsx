'use client';

import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export default function RelatoriosDebugPage() {
  const { tenant } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG - Carregando dados...');
      console.log('🏢 Tenant ID:', tenant?.id);
      
      if (!tenant?.id) {
        console.log('❌ Tenant não encontrado');
        return;
      }

      const tenantId = tenant?.id || '11111111-1111-1111-1111-111111111111';
      console.log('🏢 Usando tenant ID:', tenantId);

      const urls = [
        `/next_api/sales?tenant_id=${encodeURIComponent(tenantId)}`,
        `/next_api/products?tenant_id=${encodeURIComponent(tenantId)}`,
        `/next_api/financial-transactions?tenant_id=${encodeURIComponent(tenantId)}`,
        `/next_api/deliveries?tenant_id=${encodeURIComponent(tenantId)}`,
      ];

      console.log('🔗 URLs:', urls);

      const [salesRes, productsRes, transactionsRes, deliveriesRes] = await Promise.allSettled([
        fetch(urls[0]),
        fetch(urls[1]),
        fetch(urls[2]),
        fetch(urls[3]),
      ]);

      console.log('📡 Resultados:', {
        sales: salesRes.status,
        products: productsRes.status,
        transactions: transactionsRes.status,
        deliveries: deliveriesRes.status,
      });

      const salesData = salesRes.status === 'fulfilled' ? await salesRes.value.json() : { data: [] };
      const productsData = productsRes.status === 'fulfilled' ? await productsRes.value.json() : { data: [] };
      const transactionsData = transactionsRes.status === 'fulfilled' ? await transactionsRes.value.json() : { data: [] };
      const deliveriesData = deliveriesRes.status === 'fulfilled' ? await deliveriesRes.value.json() : { data: [] };

      console.log('📊 Dados brutos recebidos:', {
        sales: salesData,
        products: productsData,
        transactions: transactionsData,
        deliveries: deliveriesData,
      });

      const finalSales = Array.isArray(salesData?.data) ? salesData.data : (salesData?.rows || []);
      const finalProducts = Array.isArray(productsData?.data) ? productsData.data : (productsData?.rows || []);
      const finalTransactions = Array.isArray(transactionsData?.data) ? transactionsData.data : (transactionsData?.rows || []);
      const finalDeliveries = Array.isArray(deliveriesData?.data) ? deliveriesData.data : (deliveriesData?.rows || []);

      console.log('✅ Dados finais:', {
        sales: finalSales.length,
        products: finalProducts.length,
        transactions: finalTransactions.length,
        deliveries: finalDeliveries.length,
      });

      setSales(finalSales);
      setProducts(finalProducts);
      setTransactions(finalTransactions);
      setDeliveries(finalDeliveries);
    } catch (error) {
      console.error('❌ Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }
    loadData();
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Relatórios</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Relatórios</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold">Transações Financeiras</h3>
          <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
          <details className="mt-2">
            <summary>Ver dados</summary>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(transactions, null, 2)}
            </pre>
          </details>
        </div>

        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-bold">Vendas</h3>
          <p className="text-2xl font-bold text-green-600">{sales.length}</p>
          <details className="mt-2">
            <summary>Ver dados</summary>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(sales, null, 2)}
            </pre>
          </details>
        </div>

        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-bold">Produtos</h3>
          <p className="text-2xl font-bold text-yellow-600">{products.length}</p>
          <details className="mt-2">
            <summary>Ver dados</summary>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(products, null, 2)}
            </pre>
          </details>
        </div>

        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-bold">Entregas</h3>
          <p className="text-2xl font-bold text-purple-600">{deliveries.length}</p>
          <details className="mt-2">
            <summary>Ver dados</summary>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(deliveries, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Informações do Tenant</h3>
        <pre className="text-sm bg-white p-2 rounded">
          {JSON.stringify({ tenantId: tenant?.id }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

