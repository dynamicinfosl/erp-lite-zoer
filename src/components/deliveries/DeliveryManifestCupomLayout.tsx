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
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .receipt-container {
            width: 80mm;
            margin: 0 auto;
            padding: 8mm;
            background: white;
            font-family: 'Courier New', monospace;
            font-size: ${baseFontSize}px;
            line-height: 1.4;
            font-weight: 500;
          }
        }
        @media screen {
          .receipt-container {
            width: 80mm;
            margin: 20px auto;
            padding: 8mm;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            font-family: 'Courier New', monospace;
            font-size: ${baseFontSize}px;
            line-height: 1.4;
            font-weight: 500;
          }
        }
        .receipt-container {
          color: #000;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .company-name {
          font-weight: bold;
          font-size: ${baseFontSize + 3}px;
          margin-bottom: 4px;
        }
        .title {
          font-weight: bold;
          font-size: ${baseFontSize + 1}px;
          margin: 6px 0;
        }
        .meta {
          font-size: ${baseFontSize - 2}px;
          margin: 4px 0;
          font-weight: 500;
        }
        .section {
          margin-top: 8px;
          border-top: 1px dashed #000;
          padding-top: 6px;
        }
        .section-title {
          font-weight: bold;
          font-size: ${baseFontSize}px;
          margin-bottom: 4px;
          text-align: center;
        }
        .stop {
          margin-top: 6px;
          padding: 4px 0;
          border-bottom: 1px dashed #000;
        }
        .stop-customer {
          font-weight: bold;
          font-size: ${baseFontSize}px;
        }
        .stop-address {
          font-size: ${baseFontSize - 2}px;
          color: #000;
          margin-top: 2px;
          font-weight: 500;
        }
        .stop-sale {
          font-size: ${baseFontSize - 3}px;
          color: #000;
          margin-top: 2px;
          font-weight: 500;
        }
        .items {
          margin-top: 4px;
          font-size: ${baseFontSize - 2}px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-weight: 500;
        }
        .footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #000;
          text-align: center;
          font-size: ${baseFontSize - 3}px;
          font-weight: 500;
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
            {consolidatedProducts.map((it, i) => (
              <div key={`${it.name}-${i}`} className="item">
                <span>{it.name}</span>
                <span>{formatUnits(it.qty)}</span>
              </div>
            ))}
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
