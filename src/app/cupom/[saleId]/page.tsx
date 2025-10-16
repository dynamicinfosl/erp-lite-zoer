'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

interface SaleData {
  id: string;
  sale_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

interface CompanyData {
  name: string;
  document: string;
  address: string;
  phone: string;
  city: string;
  state: string;
  zipcode: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const saleId = params.saleId as string;
  const { tenant } = useSimpleAuth();
  
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        // Buscar dados da venda
        const saleResponse = await fetch(`/next_api/sales/${saleId}`);
        if (saleResponse.ok) {
          const saleResult = await saleResponse.json();
          setSaleData(saleResult.data);
        }

        // Buscar dados da empresa (tenant)
        if (tenant) {
          setCompanyData({
            name: tenant.name || 'Minha Empresa',
            document: tenant.document || '00.000.000/0001-00',
            address: tenant.address || 'Endereço não informado',
            phone: tenant.phone || '(00) 0000-0000',
            city: tenant.city || 'Cidade',
            state: tenant.state || 'UF',
            zipcode: tenant.zipcode || '00000-000'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      fetchSaleData();
    }
  }, [saleId, tenant]);

  useEffect(() => {
    // Abrir janela de impressão automaticamente quando a página carregar
    if (!loading && saleData) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, saleData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cupom...</p>
        </div>
      </div>
    );
  }

  if (!saleData || !companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados da venda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.2;
          }
          
          .receipt-container {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 5mm !important;
            font-family: 'Courier New', monospace !important;
            font-size: 11px !important;
            line-height: 1.1 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-break {
            page-break-after: always;
          }
        }
        
        @media screen {
          .receipt-container {
            width: 80mm;
            max-width: 80mm;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            background: white;
          }
        }
      `}</style>

      {/* Botão de impressão para tela */}
      <div className="no-print p-4 text-center bg-gray-100">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🖨️ Imprimir Cupom
        </button>
      </div>

      {/* Cupom */}
      <div className="receipt-container">
        {/* Cabeçalho */}
        <div className="text-center mb-4">
          <div className="text-xs text-gray-600 mb-1">
            {formatDate(saleData.created_at)}
          </div>
          <div className="text-lg font-bold mb-2">CUPOM</div>
        </div>

        {/* Dados da Empresa */}
        <div className="text-center mb-4">
          <div className="font-bold text-sm mb-1">{companyData.name}</div>
          <div className="text-xs">CNPJ: {companyData.document}</div>
          <div className="text-xs">{companyData.address}</div>
          <div className="text-xs">
            {companyData.city} - {companyData.state} {companyData.zipcode}
          </div>
          <div className="text-xs">Tel: {companyData.phone}</div>
        </div>

        {/* Linha separadora */}
        <div className="border-t border-dashed border-gray-400 my-3"></div>

        {/* Informações da Venda */}
        <div className="mb-3">
          <div className="text-xs">
            <strong>PEDIDO N° {saleData.sale_number}</strong>
          </div>
          <div className="text-xs">Data: {formatDate(saleData.created_at).split(' ')[0]}</div>
          <div className="text-xs">Cliente: {saleData.customer_name}</div>
        </div>

        {/* Linha separadora */}
        <div className="border-t border-dashed border-gray-400 my-3"></div>

        {/* Detalhes da Venda */}
        <div className="mb-3">
          <div className="text-xs font-bold mb-2">DETALHES DA VENDA</div>
          
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-12 text-xs font-bold mb-1">
            <div className="col-span-5">NOME</div>
            <div className="col-span-2 text-center">QTD</div>
            <div className="col-span-2 text-right">VL.UNT</div>
            <div className="col-span-1 text-center">DESC</div>
            <div className="col-span-2 text-right">TOTAL</div>
          </div>

          {/* Itens */}
          {saleData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 text-xs mb-1">
              <div className="col-span-5 truncate">{item.product_name}</div>
              <div className="col-span-2 text-center">{item.quantity.toFixed(2)}</div>
              <div className="col-span-2 text-right">{formatCurrency(item.unit_price)}</div>
              <div className="col-span-1 text-center">-</div>
              <div className="col-span-2 text-right font-bold">{formatCurrency(item.subtotal)}</div>
            </div>
          ))}

          {/* Total */}
          <div className="border-t border-gray-400 mt-2 pt-2">
            <div className="text-xs font-bold">
              Total do pedido: {formatCurrency(saleData.total_amount)}
            </div>
          </div>
        </div>

        {/* Linha separadora */}
        <div className="border-t border-dashed border-gray-400 my-3"></div>

        {/* Pagamento */}
        <div className="mb-3">
          <div className="text-xs font-bold mb-2">PAGAMENTO</div>
          
          {/* Cabeçalho da tabela de pagamento */}
          <div className="grid grid-cols-12 text-xs font-bold mb-1">
            <div className="col-span-3">Vencimento</div>
            <div className="col-span-3 text-right">Valor</div>
            <div className="col-span-4">Forma de pag.</div>
            <div className="col-span-2">Obs.</div>
          </div>

          {/* Pagamento */}
          <div className="grid grid-cols-12 text-xs">
            <div className="col-span-3">{formatDate(saleData.created_at).split(' ')[0]}</div>
            <div className="col-span-3 text-right font-bold">{formatCurrency(saleData.total_amount)}</div>
            <div className="col-span-4">{saleData.payment_method.toUpperCase()}</div>
            <div className="col-span-2">-</div>
          </div>
        </div>

        {/* Linha separadora */}
        <div className="border-t border-dashed border-gray-400 my-3"></div>

        {/* Aviso */}
        <div className="text-center text-xs mb-3">
          *** Este cupom não é documento fiscal ***
        </div>

        {/* Linha para assinatura */}
        <div className="border-b border-dashed border-gray-400 mb-2"></div>
        <div className="text-xs text-center">Assinatura do cliente</div>

        {/* Rodapé */}
        <div className="text-center text-xs mt-4">
          <div>Software ERP Lite - www.erplite.com.br</div>
          <div className="mt-1">
            {typeof window !== 'undefined' && window.location.href}
          </div>
        </div>
      </div>
    </div>
  );
}


