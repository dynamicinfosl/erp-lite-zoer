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
            font-size: 10px;
            line-height: 1.3;
          }
          
          .receipt-container {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 10mm !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            padding: 4px 6px;
            text-align: left;
            border: 1px solid #333;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .company-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          
          .section-title {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 8px;
            padding: 4px 8px;
            background-color: #f0f0f0;
            border: 1px solid #333;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .info-item {
            padding: 3px 0;
          }
          
          .signature-line {
            margin-top: 40px;
            padding-top: 2px;
            border-top: 1px solid #333;
            text-align: center;
          }
          
          .footer-note {
            text-align: center;
            font-size: 9px;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #333;
          }
        }
        
        @media screen {
          .receipt-container {
            width: 210mm;
            max-width: 210mm;
            margin: 20px auto;
            padding: 20mm;
            border: 1px solid #ddd;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            background: white;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          
          th, td {
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #333;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .company-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }
          
          .section-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            padding: 6px 10px;
            background-color: #f0f0f0;
            border: 1px solid #333;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .info-item {
            padding: 4px 0;
          }
          
          .signature-line {
            margin-top: 60px;
            padding-top: 3px;
            border-top: 1px solid #333;
            text-align: center;
          }
          
          .footer-note {
            text-align: center;
            font-size: 10px;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #333;
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
        {/* Cabeçalho da Empresa */}
        <div className="company-header">
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            {companyData.name.toUpperCase()}
          </div>
          <div style={{ fontSize: '10px' }}>
            CNPJ: {companyData.document}
          </div>
          <div style={{ fontSize: '10px' }}>
            {companyData.address}, {companyData.city} - {companyData.state}
          </div>
          <div style={{ fontSize: '10px' }}>
            CEP: {companyData.zipcode}
          </div>
          <div style={{ fontSize: '10px' }}>
            Tel: {companyData.phone}
          </div>
        </div>

        {/* Número do Pedido */}
        <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', margin: '15px 0', padding: '8px', border: '2px solid #333' }}>
          PEDIDO Nº {saleData.sale_number}
        </div>

        {/* Informações do Pedido */}
        <div className="info-grid">
          <div className="info-item">
            <strong>Data:</strong> {formatDate(saleData.created_at).split(',')[0]}
          </div>
          <div className="info-item">
            <strong>Entrega:</strong> {formatDate(saleData.created_at).split(',')[0]}
          </div>
          <div className="info-item" style={{ gridColumn: 'span 2' }}>
            <strong>Cliente:</strong> {saleData.customer_name}
          </div>
        </div>

        {/* Detalhes da Venda */}
        <div className="section-title">DETALHES DA VENDA</div>
        
        <table>
          <thead>
            <tr>
              <th style={{ width: '45%' }}>NOME</th>
              <th style={{ width: '10%', textAlign: 'center' }}>QTD</th>
              <th style={{ width: '15%', textAlign: 'right' }}>VL.UNT</th>
              <th style={{ width: '10%', textAlign: 'center' }}>DESC</th>
              <th style={{ width: '20%', textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {saleData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.product_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>
                  {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'center' }}>-</td>
                <td style={{ textAlign: 'right' }}>
                  {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total do Pedido */}
        <div style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '10px', fontSize: '11px', padding: '8px', backgroundColor: '#f0f0f0', border: '1px solid #333' }}>
          Total do pedido: {formatCurrency(saleData.total_amount)}
        </div>

        {/* Pagamento */}
        <div className="section-title">PAGAMENTO</div>
        
        <table>
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Vencimento</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Valor</th>
              <th style={{ width: '35%' }}>Forma de pag.</th>
              <th style={{ width: '25%' }}>Obs.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatDate(saleData.created_at).split(',')[0]}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                {saleData.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td>{saleData.payment_method.toUpperCase()}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>

        {/* Aviso Fiscal */}
        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', margin: '20px 0', padding: '10px', border: '1px solid #333', backgroundColor: '#fff3cd' }}>
          *** Este cupom não é documento fiscal ***
        </div>

        {/* Assinatura */}
        <div className="signature-line" style={{ width: '50%', margin: '40px auto 0' }}>
          Assinatura do cliente
        </div>

        {/* Rodapé */}
        <div className="footer-note">
          <div style={{ fontStyle: 'italic' }}>Software ERP Lite ZOER</div>
        </div>
      </div>
    </div>
  );
}


