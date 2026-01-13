'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SaleA4Layout } from '@/components/vendas-produtos/SaleA4Layout';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SaleData {
  id: string;
  sale_number: string;
  customer_name: string;
  customer_document?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zipcode?: string;
  seller_name?: string;
  total_amount: number;
  final_amount: number;
  payment_method: string;
  payment_condition?: string;
  created_at: string;
  delivery_date?: string;
  carrier_name?: string;
  delivery_address?: any;
  notes?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

interface CompanyData {
  name: string;
  document?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export default function VendasProdutosA4Page() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.saleId as string;
  
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        console.log('🔍 Buscando venda de produtos com ID:', saleId);
        
        // Buscar dados da venda
        const saleResponse = await fetch(`/next_api/sales/${saleId}`);
        
        if (!saleResponse.ok) {
          const errorText = await saleResponse.text();
          console.error('❌ Erro na API:', errorText);
          throw new Error(`Erro ${saleResponse.status}: ${errorText}`);
        }
        
        const saleResult = await saleResponse.json();
        const sale = saleResult.data;
        
        // Os itens já vêm na resposta da API
        let items: any[] = [];
        if (sale.items) {
          items = Array.isArray(sale.items) ? sale.items : [];
        }

        // Buscar dados do cliente se houver customer_id
        let customerData: any = {};
        if (sale.customer_id) {
          try {
            const customerResponse = await fetch(`/next_api/customers/${sale.customer_id}`);
            if (customerResponse.ok) {
              const customerResult = await customerResponse.json();
              customerData = customerResult.data || customerResult;
            }
          } catch (e) {
            console.warn('Não foi possível carregar dados do cliente');
          }
        }

        const deliveryAddress = sale.delivery_address || {};
        
        setSaleData({
          id: sale.id,
          sale_number: sale.sale_number,
          customer_name: sale.customer_name || customerData.name || 'Consumidor',
          customer_document: customerData.document || '',
          customer_email: customerData.email || '',
          customer_phone: customerData.phone || '',
          customer_address: customerData.address || deliveryAddress.address || '',
          customer_city: customerData.city || deliveryAddress.city || '',
          customer_state: customerData.state || deliveryAddress.state || '',
          customer_zipcode: customerData.zipcode || deliveryAddress.cep || '',
          seller_name: sale.seller_name || '',
          total_amount: sale.total_amount || sale.final_amount || 0,
          final_amount: sale.final_amount || sale.total_amount || 0,
          payment_method: sale.payment_method || 'dinheiro',
          payment_condition: sale.payment_condition || '',
          created_at: sale.created_at,
          delivery_date: sale.delivery_date,
          carrier_name: sale.carrier_name || '',
          delivery_address: deliveryAddress,
          notes: sale.notes || '',
          items: items.map((it: any) => ({
            product_name: it.product_name || it.product?.name || 'Produto',
            quantity: Number(it.quantity || 1),
            unit_price: Number(it.unit_price || it.price || 0),
            subtotal: Number(it.total_price || it.subtotal || (Number(it.quantity || 1) * Number(it.unit_price || it.price || 0))),
          })),
        });

        // Buscar dados da empresa (tenant)
        if (sale.tenant_id) {
          const tenantResponse = await fetch(`/next_api/tenants/${sale.tenant_id}`);
          
          if (tenantResponse.ok) {
            const tenantResult = await tenantResponse.json();
            const tenantData = tenantResult.data || tenantResult;
            
            setCompanyData({
              name: tenantData.name || 'Sua Empresa',
              document: tenantData.document || '',
              address: tenantData.address || '',
              phone: tenantData.phone || tenantData.corporate_phone || '',
              email: tenantData.email || '',
              city: tenantData.city || '',
              state: tenantData.state || '',
              zipcode: tenantData.zip_code || '',
            });
          } else {
            setCompanyData({
              name: 'Sua Empresa',
              document: '',
              address: '',
              phone: '',
              email: '',
              city: '',
              state: '',
              zipcode: '',
            });
          }
        } else {
          setCompanyData({
            name: 'Sua Empresa',
            document: '',
            address: '',
            phone: '',
            email: '',
            city: '',
            state: '',
            zipcode: '',
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      fetchSaleData();
    }
  }, [saleId]);

  useEffect(() => {
    // Abrir janela de impressão automaticamente quando a página carregar
    if (!loading && saleData && companyData) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, saleData, companyData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da venda...</p>
        </div>
      </div>
    );
  }

  if (!saleData || !companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados da venda</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Botões de ação - não aparecem na impressão */}
      <div className="no-print p-6 text-center bg-gray-100 sticky top-0 z-10 border-b">
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir A4
          </Button>
        </div>
      </div>

      {/* Layout A4 */}
      <SaleA4Layout sale={saleData as any} company={companyData} />
    </div>
  );
}
