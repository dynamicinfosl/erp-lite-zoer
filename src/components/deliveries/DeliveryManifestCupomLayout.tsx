'use client';

import React, { useMemo } from 'react';
import { useCouponSettings } from '@/hooks/useCouponSettings';

type Manifest = {
  id: string;
  manifest_number?: string | null;
  status: string;
  created_at: string;
};

type Driver = {
  name?: string;
  phone?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
};

type Delivery = {
  id: number;
  sale_id?: number | string | null;
  customer_name: string;
  delivery_address: string;
  neighborhood?: string | null;
  phone?: string | null;
  status: string;
};

type Sale = {
  id: number;
  sale_number?: string;
  created_at?: string;
  total_amount?: number | string | null;
  final_amount?: number | string | null;
  total?: number | string | null;
};

type SaleItem = {
  sale_id: number;
  product_name?: string | null;
  quantity: number;
  unit_price?: number | null;
  subtotal?: number | null;
  total_price?: number | null;
};

export function DeliveryManifestCupomLayout({
  manifest,
  driver,
  deliveries,
  sales,
  saleItems,
  companyName = 'JUGA',
}: {
  manifest: Manifest;
  driver: Driver | null;
  deliveries: Delivery[];
  sales: Sale[];
  saleItems: SaleItem[];
  companyName?: string;
}) {
  // Hook para configurações do cupom/romaneio
  const { settings: couponSettings } = useCouponSettings();
  
  // Usar fontSize do romaneio ou padrão maior se não configurado
  const manifestFontSize = couponSettings.manifestFontSize || 13;
  const baseFontSize = manifestFontSize;
  
  const salesById = useMemo(() => {
    const map = new Map<number, Sale>();
    (sales || []).forEach((s) => map.set(Number(s.id), s));
    return map;
  }, [sales]);

  const itemsBySaleId = useMemo(() => {
    const map = new Map<number, SaleItem[]>();
    (saleItems || []).forEach((it) => {
      const sid = Number(it.sale_id);
      const list = map.get(sid) || [];
      list.push(it);
      map.set(sid, list);
    });
    return map;
  }, [saleItems]);

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; customer_name: string; delivery_address: string; deliveries: Delivery[] }>();
    (deliveries || []).forEach((d) => {
      const key = `${d.customer_name}||${d.delivery_address}`;
      const existing = map.get(key) || { key, customer_name: d.customer_name, delivery_address: d.delivery_address, deliveries: [] };
      existing.deliveries.push(d);
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [deliveries]);

  const formatDateTime = (s: string) =>
    new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatQty = (q: number) => (Number(q) || 0).toFixed(2);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatUnits = (q: number) => {
    const n = Number(q) || 0;
    const pretty = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
    return `${pretty} un`;
  };

  const consolidatedProducts = useMemo(() => {
    const all = new Map<string, number>();
    (deliveries || []).forEach((d) => {
      const sid = Number(d.sale_id);
      const its = itemsBySaleId.get(sid) || [];
      its.forEach((it) => {
        const name = it.product_name || 'Item sem nome';
        all.set(name, (all.get(name) || 0) + Number(it.quantity || 0));
      });
    });
    return Array.from(all.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deliveries, itemsBySaleId]);

  const groupedWithTotals = useMemo(() => {
    return grouped.map((g) => {
      let total = 0;
      let hasTotal = false;
      for (const d of g.deliveries) {
        const sid = Number(d.sale_id);
        if (!Number.isFinite(sid)) continue;
        const sale: any = salesById.get(sid);
        if (!sale) continue;
        const raw = sale.total_amount ?? sale.final_amount ?? sale.total;
        const num = raw === null || raw === undefined ? NaN : Number(raw);
        if (Number.isFinite(num)) {
          hasTotal = true;
          total += num;
        }
      }
      return { ...g, total, hasTotal };
    });
  }, [grouped, salesById]);

  return (
    <div className="receipt-container">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: ${baseFontSize}px;
            line-height: 1.2;
            background: white;
          }
          
          .receipt-container {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            font-family: 'Courier New', monospace !important;
            font-size: ${baseFontSize}px !important;
            line-height: 1.2 !important;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Aumenta contraste/espessura da fonte no conteúdo interno */
          .receipt-container td,
          .receipt-container .info-item,
          .receipt-container .footer-note,
          .receipt-container .signature-line {
            font-weight: 600;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Lista de produtos em formato de tabela (mesmo padrão do cupom balcão) */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${baseFontSize - 2}px;
          }
          .items-table th,
          .items-table td {
            padding: 4px 5px;
            text-align: left;
            border: none;
            border-bottom: 1px dashed #666;
          }
          .items-table th {
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding: 5px 5px;
          }
          .items-table .col-name {
            width: auto;
            word-break: break-word;
          }
          .items-table .col-qty {
            width: 14mm;
            text-align: right;
            white-space: nowrap;
          }
          
          .company-header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #333;
          }
          
          .company-header div {
            font-weight: 600 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            font-size: ${baseFontSize - 2}px;
          }
          
          .signature-line {
            margin-top: 15px;
            padding-top: 2px;
            border-top: 1px dashed #333;
            text-align: center;
          }
          
          .footer-note {
            text-align: center;
            font-size: ${baseFontSize - 3}px;
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
            font-size: ${baseFontSize}px;
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

          .items-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .items-table th,
          .items-table td {
            padding: 1px 2px;
            text-align: left;
            border: none;
            border-bottom: 1px dashed #999;
            vertical-align: top;
          }
          .items-table th {
            font-weight: 700;
            border-bottom: 1px solid #333;
          }
          .items-table .col-name {
            width: auto;
            word-break: break-word;
          }
          .items-table .col-qty {
            width: 14mm;
            text-align: right;
            white-space: nowrap;
          }
        }
        .receipt-container {
          color: #000 !important;
        }
        .receipt-container * {
          color: #000 !important;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
          color: #000 !important;
        }
        .company-name {
          font-weight: bold;
          font-size: ${baseFontSize + 3}px;
          margin-bottom: 4px;
          color: #000 !important;
        }
        .title {
          font-weight: bold;
          font-size: ${baseFontSize + 1}px;
          margin: 6px 0;
          color: #000 !important;
        }
        .meta {
          font-size: ${baseFontSize + 1}px;
          margin: 4px 0;
          font-weight: bold;
          color: #000 !important;
        }
        .meta strong {
          color: #000 !important;
          opacity: 1 !important;
          font-weight: bold;
        }
        .section {
          margin-top: 8px;
          border-top: 1px dashed #000;
          padding-top: 6px;
        }
        .section-title {
          font-weight: bold;
          font-size: ${baseFontSize + 1}px;
          margin-bottom: 4px;
          text-align: center;
          color: #000 !important;
        }
        .stop {
          margin-top: 6px;
          padding: 4px 0;
          border-bottom: 1px dashed #000;
          color: #000 !important;
        }
        .stop-customer {
          font-weight: bold;
          font-size: ${baseFontSize + 1}px;
          color: #000 !important;
        }
        .stop-address {
          font-size: ${baseFontSize + 1}px;
          color: #000 !important;
          margin-top: 2px;
          font-weight: bold;
        }
        .stop-sale {
          font-size: ${baseFontSize + 1}px;
          color: #000 !important;
          margin-top: 2px;
          font-weight: bold;
        }
        .stop-sale strong {
          color: #000 !important;
          opacity: 1 !important;
          font-weight: bold;
        }
        .items {
          margin-top: 4px;
          font-size: ${baseFontSize + 1}px;
          color: #000 !important;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-weight: bold;
          color: #000 !important;
        }
        .item span {
          color: #000 !important;
        }
        .footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #000;
          text-align: center;
          font-size: ${baseFontSize + 1}px;
          font-weight: bold;
          color: #000 !important;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
      `}</style>

      <div className="header">
        <div className="company-name">{companyName}</div>
        <div className="title">ROMANEIO DE ENTREGA</div>
        <div className="meta">
          {manifest.manifest_number ? `#${manifest.manifest_number}` : `#${manifest.id.slice(0, 8)}`}
        </div>
        <div className="meta">{formatDateTime(manifest.created_at)}</div>
        <div className="meta">
          <strong>Entregador:</strong> {driver?.name ? driver.name : '—'}
        </div>
        <div className="meta">
          <strong>Veículo:</strong>{' '}
          {(driver?.vehicle_type || driver?.vehicle_plate)
            ? [driver?.vehicle_type, driver?.vehicle_plate].filter(Boolean).join(' - ')
            : '—'}
        </div>
      </div>

      <div className="section">
        <div className="section-title">CARREGAR NO VEÍCULO</div>
        {consolidatedProducts.length === 0 ? (
          <div className="meta" style={{ textAlign: 'center' }}>
            Sem produtos
          </div>
        ) : (
          <div className="items">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-name">PRODUTO</th>
                  <th className="col-qty">QTD</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedProducts.map((it, i) => (
                  <tr key={`${it.name}-${i}`}>
                    <td className="col-name">{it.name}</td>
                    <td className="col-qty">{formatUnits(it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">CLIENTES</div>
        {groupedWithTotals.length === 0 ? (
          <div className="meta" style={{ textAlign: 'center' }}>
            Nenhum cliente
          </div>
        ) : (
          <>
            {groupedWithTotals.map((g, idx) => (
              <div key={g.key} className="stop">
                <div className="stop-customer">
                  {idx + 1}. {g.customer_name}
                </div>
                <div className="stop-sale">
                  <strong>Valor:</strong> {g.hasTotal ? formatCurrency(g.total) : '—'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="footer">
        <div className="divider"></div>
        Total de clientes: {grouped.length}
        <br />
        Gerado pelo JUGA
      </div>
    </div>
  );
}
