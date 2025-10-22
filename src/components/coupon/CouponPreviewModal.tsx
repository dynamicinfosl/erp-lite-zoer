import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CouponTemplate } from './CouponTemplate';
import { CouponSettings } from '@/hooks/useCouponSettings';
import { Printer, Download } from 'lucide-react';

interface CouponPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const CouponPreviewModal: React.FC<CouponPreviewModalProps> = ({
  isOpen,
  onClose,
  saleData,
  settings,
  cashierName
}) => {
  const handlePrint = () => {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cupom Fiscal - ${saleData.sale_number}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: monospace;
                background: white;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div id="coupon-content"></div>
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">Imprimir</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">Fechar</button>
            </div>
          </body>
        </html>
      `);
      
      // Renderizar o cupom no iframe
      const couponElement = printWindow.document.getElementById('coupon-content');
      if (couponElement) {
        // Aqui você pode usar ReactDOM.render ou criar o HTML diretamente
        couponElement.innerHTML = `
          <div style="font-size: ${settings.fontSize}px; font-family: monospace; line-height: 1.2; max-width: 300px; margin: 0 auto; padding: 10px; border: 1px solid #000; background-color: #fff; color: #000;">
            <!-- Cabeçalho da Empresa -->
            <div style="text-align: center; margin-bottom: 10px;">
              <h2 style="font-size: ${settings.fontSize + 2}px; font-weight: bold; margin: 0 0 5px 0;">
                ${settings.companyName}
              </h2>
              ${settings.showAddress ? `
                <div style="font-size: ${settings.fontSize - 1}px;">
                  ${settings.companyAddress}<br />
                  ${settings.companyCity}
                </div>
              ` : ''}
              ${settings.showPhone ? `
                <div style="font-size: ${settings.fontSize - 1}px;">${settings.companyPhone}</div>
              ` : ''}
              ${settings.showEmail ? `
                <div style="font-size: ${settings.fontSize - 1}px;">${settings.companyEmail}</div>
              ` : ''}
            </div>
            
            <!-- Linha separadora -->
            <div style="border-top: 1px dashed #000; margin: 10px 0; text-align: center;">
              CUPOM FISCAL
            </div>
            
            <!-- Informações da Venda -->
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Nº: ${saleData.sale_number}</span>
                ${settings.showDate ? `<span>${new Date(saleData.created_at).toLocaleDateString('pt-BR')}</span>` : ''}
              </div>
              ${settings.showTime ? `
                <div style="text-align: right; font-size: ${settings.fontSize - 1}px;">
                  ${new Date(saleData.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ` : ''}
              ${settings.showCashier ? `<div>Caixa: ${cashierName}</div>` : ''}
              ${settings.showCustomer && saleData.customer_name ? `<div>Cliente: ${saleData.customer_name}</div>` : ''}
            </div>
            
            <!-- Linha separadora -->
            <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <!-- Itens da Venda -->
            <div style="margin-bottom: 10px;">
              ${saleData.items.map(item => `
                <div style="margin-bottom: 5px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="flex: 1;">${item.product_name}</span>
                    <span style="margin-left: 10px;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: ${settings.fontSize - 1}px;">
                    <span>${item.quantity}x</span>
                    <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <!-- Linha separadora -->
            <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
            
            <!-- Total -->
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: ${settings.fontSize + 1}px; margin-bottom: 10px;">
              <span>TOTAL:</span>
              <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saleData.total_amount)}</span>
            </div>
            
            <!-- Forma de Pagamento -->
            <div style="margin-bottom: 10px;">
              <div>Forma de Pagamento: ${saleData.payment_method}</div>
            </div>
            
            <!-- Rodapé -->
            ${settings.footerText ? `
              <div style="text-align: center; margin-top: 10px; font-size: ${settings.fontSize - 1}px; border-top: 1px dashed #000; padding-top: 5px;">
                ${settings.footerText}
              </div>
            ` : ''}
          </div>
        `;
      }
      
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    // Implementar download como PDF ou imagem
    console.log('Download do cupom');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cupom Fiscal - Venda #{saleData.sale_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview do Cupom */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <CouponTemplate 
              saleData={saleData}
              settings={settings}
              cashierName={cashierName}
            />
          </div>
          
          {/* Botões de Ação */}
          <div className="flex justify-center space-x-4">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar
            </Button>
            <Button onClick={onClose} variant="secondary">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
