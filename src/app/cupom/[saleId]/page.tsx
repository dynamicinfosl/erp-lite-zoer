'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCouponSettings } from '@/hooks/useCouponSettings';

interface SaleData {
  id: string;
  sale_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  delivery_date?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    subtotal: number;
  }>;
}

interface CompanyData {
  name: string;
  document: string;
  address: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  zipcode: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  seller_name?: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const saleId = params.saleId as string;
  
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hook para configurações do cupom
  const { settings: couponSettings } = useCouponSettings();

  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        console.log('🔍 Buscando venda com ID:', saleId);
        
        // Buscar dados da venda
        const saleResponse = await fetch(`/next_api/sales/${saleId}`);
        console.log('📡 Resposta da API:', saleResponse.status);
        
        if (!saleResponse.ok) {
          const errorText = await saleResponse.text();
          console.error('❌ Erro na API:', errorText);
          throw new Error(`Erro ${saleResponse.status}: ${errorText}`);
        }
        
        const saleResult = await saleResponse.json();
        console.log('✅ Dados da venda:', saleResult);
        const sale = saleResult.data;
        setSaleData(sale);

        // Buscar dados da empresa (tenant) da venda
        if (sale.tenant_id) {
          console.log('🏢 Buscando dados do tenant:', sale.tenant_id);
          const tenantResponse = await fetch(`/next_api/tenants/${sale.tenant_id}`);
          
          if (tenantResponse.ok) {
            const tenantResult = await tenantResponse.json();
            console.log('✅ Dados do tenant:', tenantResult);
            const tenantData = tenantResult.data || tenantResult;
            
            setCompanyData({
              name: tenantData.nome_fantasia || tenantData.name || 'Sua Empresa',
              document: tenantData.document || '',
              address: tenantData.address || '',
              phone: tenantData.phone || tenantData.corporate_phone || '',
              email: tenantData.email || '',
              city: tenantData.city || '',
              state: tenantData.state || '',
              zipcode: tenantData.zip_code || '',
              numero: tenantData.numero || '',
              complemento: tenantData.complemento || '',
              bairro: tenantData.bairro || '',
              seller_name: sale.seller_name || ''
            });
          } else {
            // Fallback: dados padrão
            console.warn('⚠️ Não foi possível carregar dados do tenant');
            setCompanyData({
              name: 'Sua Empresa',
              document: '',
              address: '',
              phone: '',
              email: '',
              city: '',
              state: '',
              zipcode: '',
              seller_name: ''
            });
          }
        } else {
          // Fallback: dados padrão
          setCompanyData({
            name: 'Sua Empresa',
            document: '',
            address: '',
            phone: '',
            email: '',
            city: '',
            state: '',
            zipcode: '',
            seller_name: ''
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

  const buildCompanyAddress = (data: CompanyData) => {
    const parts = [];
    if (data.address) parts.push(data.address);
    if (data.numero) parts.push(data.numero);
    if (data.complemento) parts.push(data.complemento);
    if (data.bairro) parts.push(data.bairro);
    return parts.join(', ');
  };

  const buildCompanyCityState = (data: CompanyData) => {
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.state) parts.push(data.state);
    return parts.join(' - ');
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

  if (!saleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados da venda</p>
          <button
            onClick={() => window.close()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }
  
  if (!companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando dados da empresa...</p>
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
            font-size: ${couponSettings.fontSize}px;
            line-height: 1.2;
          }
          
          .receipt-container {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            font-family: 'Courier New', monospace !important;
            font-size: ${couponSettings.fontSize}px !important;
            line-height: 1.2 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Aumenta contraste/espessura da fonte no conteúdo interno */
          .receipt-container td,
          .receipt-container .info-item,
          .receipt-container .footer-note,
          .receipt-container .signature-line {
            font-weight: 600; /* letras mais "acesas" no corpo */
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${couponSettings.fontSize - 2}px;
          }
          
          th, td {
            padding: 2px 3px;
            text-align: left;
            border: none;
            border-bottom: 1px dashed #666;
          }
          
          th {
            font-weight: bold;
            border-bottom: 1px solid #333;
          }
          
          .company-header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #333;
          }
          
          .section-title {
            font-weight: bold;
            margin-top: 8px;
            margin-bottom: 4px;
            padding: 2px 0;
            text-align: center;
            border-top: 1px dashed #333;
            border-bottom: 1px dashed #333;
          }
          
          .info-item {
            padding: 1px 0;
            font-size: ${couponSettings.fontSize - 2}px;
          }
          
          .signature-line {
            margin-top: 15px;
            padding-top: 2px;
            border-top: 1px dashed #333;
            text-align: center;
          }
          
          .footer-note {
            text-align: center;
            font-size: ${couponSettings.fontSize - 3}px;
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px dashed #333;
          }
          
          .dashed-line {
            border-top: 1px dashed #666;
            margin: 5px 0;
          }
        }
        
        @media screen {
          .receipt-container {
            width: 80mm;
            max-width: 80mm;
            margin: 20px auto;
            padding: 10px;
            border: 1px solid #ddd;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: 'Courier New', monospace;
            font-size: ${couponSettings.fontSize}px;
            line-height: 1.3;
            background: white;
          }
          
          /* Mantém o corpo mais forte também na visualização de tela */
          .receipt-container td,
          .receipt-container .info-item,
          .receipt-container .footer-note,
          .receipt-container .signature-line {
            font-weight: 600;
            color: #000;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0;
            font-size: ${couponSettings.fontSize - 1}px;
          }
          
          th, td {
            padding: 3px 4px;
            text-align: left;
            border: none;
            border-bottom: 1px dashed #999;
          }
          
          th {
            font-weight: bold;
            border-bottom: 1px solid #333;
          }
          
          .company-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #333;
          }
          
          .section-title {
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
            padding: 3px 0;
            text-align: center;
            border-top: 1px dashed #333;
            border-bottom: 1px dashed #333;
          }
          
          .info-item {
            padding: 2px 0;
            font-size: 9px;
          }
          
          .signature-line {
            margin-top: 20px;
            padding-top: 3px;
            border-top: 1px dashed #333;
            text-align: center;
          }
          
          .footer-note {
            text-align: center;
            font-size: 8px;
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px dashed #333;
          }
          
          .dashed-line {
            border-top: 1px dashed #999;
            margin: 5px 0;
          }
        }
      `}</style>

      {/* Botão de impressão para tela */}
      <div className="no-print p-6 text-center bg-gray-100">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-lg"
        >
          🖨️ Imprimir Cupom
        </button>
      </div>

      {/* Cupom */}
      <div className="receipt-container">
        {/* Cabeçalho da Empresa - Usando dados reais do perfil da empresa */}
        <div className="company-header">
          <div style={{ fontSize: `${couponSettings.fontSize + 2}px`, fontWeight: 'bold', marginBottom: '3px' }}>
            {companyData.name.toUpperCase()}
          </div>
          {couponSettings.showAddress && buildCompanyAddress(companyData) && (
            <div style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
              {buildCompanyAddress(companyData)}
            </div>
          )}
          {couponSettings.showAddress && buildCompanyCityState(companyData) && (
            <div style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
              {buildCompanyCityState(companyData)}
            </div>
          )}
          {couponSettings.showPhone && companyData.phone && (
            <div style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
              Tel: {companyData.phone}
            </div>
          )}
          {couponSettings.showEmail && companyData.email && (
            <div style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
              {companyData.email}
            </div>
          )}
        </div>

        {/* Número do Pedido */}
        <div style={{ textAlign: 'center', fontSize: `${couponSettings.fontSize}px`, fontWeight: 'bold', margin: '8px 0', padding: '4px', borderTop: '1px dashed #333', borderBottom: '1px dashed #333' }}>
          PEDIDO Nº {saleData.sale_number}
        </div>

        {/* Informações do Pedido */}
        <div style={{ fontSize: `${couponSettings.fontSize - 2}px`, marginBottom: '8px' }}>
          {couponSettings.showDate && (
            <div className="info-item">
              <strong>Data:</strong> {formatDate(saleData.created_at)}
            </div>
          )}
          {couponSettings.showTime && (
            <div className="info-item">
              <strong>Horário:</strong> {new Date(saleData.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          {couponSettings.showCustomer && saleData.customer_name && (
            <div className="info-item">
              <strong>Cliente:</strong> {saleData.customer_name}
            </div>
          )}
          {couponSettings.showCashier && companyData?.seller_name && (
            <div className="info-item">
              <strong>Caixa:</strong> {companyData.seller_name}
            </div>
          )}
        </div>

        {/* Detalhes da Venda */}
        <div className="section-title">DETALHES DA VENDA</div>
        
        <table style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
          <thead>
            <tr>
              <th style={{ width: '50%' }}>NOME</th>
              <th style={{ width: '15%', textAlign: 'center' }}>QTD</th>
              <th style={{ width: '15%', textAlign: 'right' }}>UNIT</th>
              <th style={{ width: '20%', textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {saleData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.product_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>
                  {item.unit_price.toFixed(2)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="dashed-line"></div>

        {/* Total do Pedido */}
        <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: `${couponSettings.fontSize}px`, padding: '5px 0' }}>
          Total do pedido: R$ {saleData.total_amount.toFixed(2)}
        </div>

        <div className="dashed-line"></div>

        {/* Pagamento */}
        <div className="section-title">PAGAMENTO</div>
        
        <table style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
          <tbody>
            <tr>
              <td style={{ width: '50%' }}>
                <strong>Forma:</strong> {saleData.payment_method.toUpperCase()}
              </td>
              <td style={{ width: '50%', textAlign: 'right' }}>
                <strong>R$ {saleData.total_amount.toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="dashed-line"></div>

        {/* Aviso Fiscal */}
        <div style={{ textAlign: 'center', fontSize: `${couponSettings.fontSize - 3}px`, fontWeight: 'bold', margin: '8px 0' }}>
          *** Este cupom não é documento fiscal ***
        </div>

        <div className="dashed-line"></div>

        {/* Assinatura */}
        <div className="signature-line" style={{ fontSize: `${couponSettings.fontSize - 2}px` }}>
          Assinatura do cliente
        </div>

        {/* Rodapé */}
        <div className="footer-note" style={{ fontSize: `${couponSettings.fontSize - 3}px` }}>
          <div>{couponSettings.footerText || 'Software ERP Lite ZOER'}</div>
        </div>
      </div>
    </div>
  );
}


