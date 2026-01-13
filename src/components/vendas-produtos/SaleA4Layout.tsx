'use client';

import React from 'react';
import { Sale, DeliveryAddress } from '@/types';

interface SaleA4LayoutProps {
  sale: Sale & {
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
    customer_name?: string;
    customer_document?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_city?: string;
    customer_state?: string;
    customer_zipcode?: string;
    seller_name?: string;
  };
  company: {
    name: string;
    document?: string;
    address?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
}

export function SaleA4Layout({ sale, company }: SaleA4LayoutProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro à Vista',
      pix: 'PIX',
      cartao_debito: 'Cartão de Débito',
      cartao_credito: 'Cartão de Crédito',
      boleto: 'Boleto',
      fiado: 'Fiado',
    };
    return labels[method] || method;
  };

  const deliveryAddress = sale.delivery_address as DeliveryAddress | undefined;
  const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = sale.total_amount || sale.final_amount || 0;

  return (
    <div className="a4-container">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .a4-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
            box-sizing: border-box;
          }
        }
        @media screen {
          .a4-container {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 15mm;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
          }
        }
        .a4-container {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          color: #000;
          line-height: 1.4;
        }
        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
          text-align: center;
        }
        .company-info {
          font-size: 9pt;
          text-align: center;
          color: #666;
        }
        .order-header {
          background-color: #f0f0f0;
          padding: 8px;
          margin: 15px 0;
          text-align: center;
          font-weight: bold;
          font-size: 12pt;
        }
        .order-info {
          margin: 10px 0;
          font-size: 10pt;
        }
        .section-title {
          background-color: #e0e0e0;
          padding: 5px 8px;
          margin: 15px 0 8px 0;
          font-weight: bold;
          font-size: 10pt;
          border-left: 4px solid #333;
        }
        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 10px 0;
        }
        .field-label {
          font-weight: bold;
          font-size: 9pt;
          color: #333;
          margin-bottom: 2px;
        }
        .field-value {
          font-size: 10pt;
          margin-bottom: 8px;
          min-height: 20px;
          border-bottom: 1px solid #ccc;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 9pt;
        }
        .products-table th {
          background-color: #f0f0f0;
          padding: 6px 4px;
          text-align: left;
          border: 1px solid #ccc;
          font-weight: bold;
        }
        .products-table td {
          padding: 5px 4px;
          border: 1px solid #ccc;
        }
        .products-table .text-center {
          text-align: center;
        }
        .products-table .text-right {
          text-align: right;
        }
        .totals {
          margin-top: 10px;
          text-align: right;
          font-size: 10pt;
        }
        .total-row {
          margin: 5px 0;
        }
        .total-final {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #333;
        }
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 9pt;
        }
        .payment-table th {
          background-color: #f0f0f0;
          padding: 6px 4px;
          text-align: left;
          border: 1px solid #ccc;
          font-weight: bold;
        }
        .payment-table td {
          padding: 5px 4px;
          border: 1px solid #ccc;
        }
        .signature {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #333;
          text-align: center;
          font-size: 10pt;
        }
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px dashed #999;
          text-align: center;
          font-size: 8pt;
          color: #666;
        }
      `}</style>

      {/* Cabeçalho da Empresa */}
      <div className="header">
        <div className="company-name">{company.name}</div>
        <div className="company-info">
          {company.address && <div>{company.address}</div>}
          {company.city && company.state && (
            <div>
              {company.city} - {company.state}
              {company.zipcode && ` - CEP: ${company.zipcode}`}
            </div>
          )}
          {company.phone && <div>Tel: {company.phone}</div>}
          {company.email && <div>{company.email}</div>}
        </div>
      </div>

      {/* Informações do Vendedor */}
      {sale.seller_name && (
        <div className="order-info" style={{ textAlign: 'right', fontSize: '10pt' }}>
          <strong>Vendedor:</strong> {sale.seller_name}
        </div>
      )}

      {/* Número do Pedido */}
      <div className="order-header">
        PEDIDO N° {sale.sale_number}
      </div>

      {/* Data do Pedido */}
      <div className="order-info" style={{ textAlign: 'right' }}>
        <strong>Data:</strong> {formatDateTime(sale.created_at)}
      </div>

      {/* Prazo de Entrega */}
      {sale.delivery_date && (
        <div className="order-info">
          <strong>PRAZO DE ENTREGA:</strong> {formatDate(sale.delivery_date)}
        </div>
      )}

      {/* Dados do Cliente */}
      <div className="section-title">DADOS DO CLIENTE</div>
      <div className="two-columns">
        <div>
          <div className="field-label">Cliente:</div>
          <div className="field-value">{sale.customer_name || 'Consumidor'}</div>
        </div>
        <div>
          <div className="field-label">CNPJ/CPF:</div>
          <div className="field-value">{sale.customer_document || ''}</div>
        </div>
        <div>
          <div className="field-label">Endereço:</div>
          <div className="field-value">
            {deliveryAddress?.address || sale.customer_address || ''}
            {deliveryAddress?.number && `, ${deliveryAddress.number}`}
            {deliveryAddress?.complement && ` - ${deliveryAddress.complement}`}
          </div>
        </div>
        <div>
          <div className="field-label">CEP:</div>
          <div className="field-value">{deliveryAddress?.cep || sale.customer_zipcode || ''}</div>
        </div>
        <div>
          <div className="field-label">Cidade:</div>
          <div className="field-value">{deliveryAddress?.city || sale.customer_city || ''}</div>
        </div>
        <div>
          <div className="field-label">Estado:</div>
          <div className="field-value">{deliveryAddress?.state || sale.customer_state || ''}</div>
        </div>
        <div>
          <div className="field-label">Telefone:</div>
          <div className="field-value">{sale.customer_phone || ''}</div>
        </div>
        <div>
          <div className="field-label">E-mail:</div>
          <div className="field-value">{sale.customer_email || ''}</div>
        </div>
      </div>

      {/* Produtos */}
      <div className="section-title">PRODUTOS</div>
      <table className="products-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>ITEM</th>
            <th style={{ width: '50%' }}>NOME</th>
            <th style={{ width: '10%' }} className="text-center">QTD.</th>
            <th style={{ width: '15%' }} className="text-right">VR. UNIT.</th>
            <th style={{ width: '20%' }} className="text-right">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.product_name}</td>
              <td className="text-center">{item.quantity.toFixed(2)}</td>
              <td className="text-right">{formatCurrency(item.unit_price)}</td>
              <td className="text-right">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
            <td colSpan={2}>TOTAL</td>
            <td className="text-center">{totalQuantity.toFixed(2)}</td>
            <td></td>
            <td className="text-right">{formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Resumo */}
      <div className="totals">
        <div className="total-row">
          <strong>PRODUTOS: {formatCurrency(totalAmount)}</strong>
        </div>
        <div className="total-final">
          TOTAL: {formatCurrency(totalAmount)}
        </div>
      </div>

      {/* Dados do Pagamento */}
      <div className="section-title">DADOS DO PAGAMENTO</div>
      <table className="payment-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>VENCIMENTO</th>
            <th style={{ width: '15%' }}>VALOR</th>
            <th style={{ width: '35%' }}>FORMA DE PAGAMENTO</th>
            <th style={{ width: '30%' }}>OBSERVAÇÃO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{sale.delivery_date ? formatDate(sale.delivery_date) : formatDate(sale.created_at)}</td>
            <td>{formatCurrency(totalAmount)}</td>
            <td>{getPaymentMethodLabel(sale.payment_method)}</td>
            <td>{sale.payment_condition || sale.notes || ''}</td>
          </tr>
        </tbody>
      </table>

      {/* Transportadora */}
      {sale.carrier_name && (
        <div className="order-info" style={{ marginTop: '10px' }}>
          <strong>Transportadora:</strong> {sale.carrier_name}
        </div>
      )}

      {/* Observações */}
      {sale.notes && (
        <div className="order-info" style={{ marginTop: '10px' }}>
          <strong>Observações:</strong> {sale.notes}
        </div>
      )}

      {/* Assinatura */}
      <div className="signature">
        Assinatura do cliente
      </div>

      {/* Rodapé */}
      <div className="footer">
        Pedido emitido no GestãoClick - www.gestaoclick.com.br
      </div>
    </div>
  );
}
