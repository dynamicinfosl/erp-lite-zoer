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
    // Usar a rota padrão de cupom, que já busca customer/endereço e imprime corretamente
    window.open(`/cupom/${saleData.id}`, '_blank');
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
