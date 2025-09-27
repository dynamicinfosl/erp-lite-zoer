'use client';

import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface CompanyInfo {
  name: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  seller?: string;
}

export interface DocumentInfo {
  title: string; // Ex.: PEDIDO, ORDEM DE SERVIÇO, VENDA
  number: string | number;
  issueDate: string; // ISO ou legível
  deliveryDate?: string; // ISO ou legível
}

export interface CustomerInfo {
  name?: string;
  document?: string; // CPF/CNPJ
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  phone?: string;
  email?: string;
}

export interface ItemRow {
  description: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface PaymentRow {
  dueDate?: string;
  amount: number;
  method: string; // PIX, Cartão, Dinheiro
  note?: string;
}

export interface OrderLikeTemplateProps {
  company: CompanyInfo;
  document: DocumentInfo;
  customer: CustomerInfo;
  items: ItemRow[];
  payments?: PaymentRow[];
  currency?: string; // default BRL
  onClose?: () => void;
}

function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value || 0);
}

function safeDate(date?: string) {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString('pt-BR');
}

export default function OrderLikeTemplate({ company, document, customer, items, payments = [], currency = 'BRL', onClose }: OrderLikeTemplateProps) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const totals = items.reduce(
    (acc, it) => {
      const subtotal = it.quantity * it.unitPrice - (it.discount || 0);
      acc.products += subtotal;
      return acc;
    },
    { products: 0 }
  );

  const handleGenerate = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: pdfRef.current.scrollWidth,
      height: pdfRef.current.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth - 20; // 10mm margens
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdfHeight = pdf.internal.pageSize.getHeight();

    if (imgHeight > pdfHeight - 20) {
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
      while (heightLeft > 0) {
        pdf.addPage();
        position = 10 - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
    } else {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    }
    pdf.save(`${document.title}-${document.number}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold">{document.title} Nº {document.number}</h2>
          <div className="flex gap-2">
            <button onClick={handleGenerate} className="px-3 py-1.5 bg-blue-600 text-white rounded">Gerar PDF</button>
            <button onClick={onClose} className="px-3 py-1.5 bg-gray-600 text-white rounded">Fechar</button>
          </div>
        </div>

        <div className="p-3 sm:p-4 overflow-auto max-h-[calc(90vh-60px)]">
          <div ref={pdfRef} className="bg-white text-black p-4" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Cabeçalho empresa */}
            <div className="flex items-start justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                {company.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt="logo" className="h-8" />
                )}
                <div className="text-sm leading-tight">
                  <div className="font-semibold">{company.name}</div>
                  {company.phone && <div>{company.phone}</div>}
                  {company.email && <div>{company.email}</div>}
                  {company.seller && <div>Vendedor: {company.seller}</div>}
                </div>
              </div>
              <div className="text-right text-sm leading-tight">
                <div className="font-semibold">{document.title} Nº {document.number}</div>
                <div>{safeDate(document.issueDate)}</div>
              </div>
            </div>

            {/* Prazo de entrega */}
            <div className="text-xs border-b py-1">PRAZO DE ENTREGA: {document.deliveryDate ? safeDate(document.deliveryDate) : '-'}</div>

            {/* Dados do cliente */}
            <div className="mt-2 text-xs border-b">
              <div className="grid grid-cols-2 gap-2 py-1">
                <div>
                  <div><span className="font-semibold">Cliente:</span> {customer.name || '-'}</div>
                  <div><span className="font-semibold">Endereço:</span> {customer.address || '-'}</div>
                  <div><span className="font-semibold">Cidade:</span> {customer.city || '-'}</div>
                  <div><span className="font-semibold">Telefone:</span> {customer.phone || '-'}</div>
                </div>
                <div>
                  <div><span className="font-semibold">CNPJ/CPF:</span> {customer.document || '-'}</div>
                  <div><span className="font-semibold">CEP:</span> {customer.zipcode || '-'}</div>
                  <div><span className="font-semibold">Estado:</span> {customer.state || '-'}</div>
                  <div><span className="font-semibold">E-mail:</span> {customer.email || '-'}</div>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="mt-2">
              <div className="text-xs font-semibold border-b py-1">PRODUTOS</div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 w-10">ITEM</th>
                    <th className="text-left py-1">DESCRIÇÃO</th>
                    <th className="text-left py-1 w-12">UND.</th>
                    <th className="text-right py-1 w-16">QTD.</th>
                    <th className="text-right py-1 w-24">VR. UNIT.</th>
                    <th className="text-right py-1 w-20">DESC.</th>
                    <th className="text-right py-1 w-24">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const subtotal = it.quantity * it.unitPrice - (it.discount || 0);
                    return (
                      <tr key={idx} className="border-b">
                        <td className="py-1 align-top">{idx + 1}</td>
                        <td className="py-1 align-top">{it.description}</td>
                        <td className="py-1 align-top">{it.unit || 'UN'}</td>
                        <td className="py-1 text-right align-top">{it.quantity.toFixed(2)}</td>
                        <td className="py-1 text-right align-top">{formatCurrency(it.unitPrice, currency)}</td>
                        <td className="py-1 text-right align-top">{it.discount ? formatCurrency(it.discount, currency) : '-'}</td>
                        <td className="py-1 text-right align-top">{formatCurrency(subtotal, currency)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="py-1 font-semibold" colSpan={6}>PRODUTOS:</td>
                    <td className="py-1 text-right font-semibold">{formatCurrency(totals.products, currency)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold" colSpan={6}>TOTAL:</td>
                    <td className="py-1 text-right font-semibold">{formatCurrency(totals.products, currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dados de Pagamento */}
            <div className="mt-3">
              <div className="text-xs font-semibold border-b py-1">DADOS DO PAGAMENTO</div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 w-32">VENCIMENTO</th>
                    <th className="text-right py-1 w-32">VALOR</th>
                    <th className="text-left py-1 w-40">FORMA DE PAGAMENTO</th>
                    <th className="text-left py-1">OBSERVAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td className="py-1">-</td>
                      <td className="py-1 text-right">-</td>
                      <td className="py-1">-</td>
                      <td className="py-1">-</td>
                    </tr>
                  ) : payments.map((p, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1">{safeDate(p.dueDate)}</td>
                      <td className="py-1 text-right">{formatCurrency(p.amount, currency)}</td>
                      <td className="py-1">{p.method}</td>
                      <td className="py-1">{p.note || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assinatura */}
            <div className="mt-6">
              <div className="border-t pt-8 text-center text-xs">
                ____________________________________
                <div>Assinatura do cliente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


