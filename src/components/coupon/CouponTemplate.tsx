import React from 'react';
import { CouponSettings } from '@/hooks/useCouponSettings';

interface CouponTemplateProps {
  saleData: {
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
  };
  settings: CouponSettings;
  cashierName?: string;
}

export const CouponTemplate: React.FC<CouponTemplateProps> = ({
  saleData,
  settings,
  cashierName = 'Sistema'
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const couponStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: 'monospace',
    lineHeight: '1.2',
    maxWidth: '300px',
    margin: '0 auto',
    padding: '10px',
    border: '1px solid #000',
    backgroundColor: '#fff',
    color: '#000',
  };

  return (
    <div style={couponStyle} className="coupon-template">
      {/* Cabeçalho da Empresa */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ 
          fontSize: `${settings.fontSize + 2}px`, 
          fontWeight: 'bold',
          margin: '0 0 5px 0'
        }}>
          {settings.companyName}
        </h2>
        
        {settings.showAddress && (
          <div style={{ fontSize: `${settings.fontSize - 1}px` }}>
            {settings.companyAddress}
            <br />
            {settings.companyCity}
          </div>
        )}
        
        {settings.showPhone && (
          <div style={{ fontSize: `${settings.fontSize - 1}px` }}>
            {settings.companyPhone}
          </div>
        )}
        
        {settings.showEmail && (
          <div style={{ fontSize: `${settings.fontSize - 1}px` }}>
            {settings.companyEmail}
          </div>
        )}
      </div>

      {/* Linha separadora */}
      <div style={{ 
        borderTop: '1px dashed #000', 
        margin: '10px 0',
        textAlign: 'center'
      }}>
        CUPOM FISCAL
      </div>

      {/* Informações da Venda */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Nº: {saleData.sale_number}</span>
          {settings.showDate && (
            <span>{formatDate(saleData.created_at)}</span>
          )}
        </div>
        
        {settings.showTime && (
          <div style={{ textAlign: 'right', fontSize: `${settings.fontSize - 1}px` }}>
            {formatTime(saleData.created_at)}
          </div>
        )}
        
        {settings.showCashier && (
          <div>Caixa: {cashierName}</div>
        )}
        
        {settings.showCustomer && saleData.customer_name && (
          <div>Cliente: {saleData.customer_name}</div>
        )}
      </div>

      {/* Linha separadora */}
      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />

      {/* Itens da Venda */}
      <div style={{ marginBottom: '10px' }}>
        {saleData.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ flex: 1 }}>
                {item.product_name}
              </span>
              <span style={{ marginLeft: '10px' }}>
                {formatCurrency(item.unit_price)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${settings.fontSize - 1}px` }}>
              <span>{item.quantity}x</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Linha separadora */}
      <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />

      {/* Total */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        fontWeight: 'bold',
        fontSize: `${settings.fontSize + 1}px`,
        marginBottom: '10px'
      }}>
        <span>TOTAL:</span>
        <span>{formatCurrency(saleData.total_amount)}</span>
      </div>

      {/* Forma de Pagamento */}
      <div style={{ marginBottom: '10px' }}>
        <div>Forma de Pagamento: {saleData.payment_method}</div>
      </div>

      {/* Rodapé */}
      {settings.footerText && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '10px',
          fontSize: `${settings.fontSize - 1}px`,
          borderTop: '1px dashed #000',
          paddingTop: '5px'
        }}>
          {settings.footerText}
        </div>
      )}
    </div>
  );
};
