'use client';

import React from 'react';

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
};

type SaleItem = {
  sale_id: number;
  product_name?: string | null;
  quantity: number;
  unit_price?: number | null;
  subtotal?: number | null;
  total_price?: number | null;
};

export function DeliveryManifestA4Layout(props: {
  manifest: Manifest;
  driver: Driver | null;
  deliveries: Delivery[];
  sales: Sale[];
  saleItems: SaleItem[];
  companyName?: string;
}) {
  const { manifest, driver, deliveries, sales, saleItems, companyName = 'JUGA' } = props;

  const formatDateTime = (s: string) => {
    return new Date(s).toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatQty = (q: number) => {
    return (Number(q) || 0).toFixed(2);
  };

  const salesById = new Map();
  (sales || []).forEach((s) => salesById.set(Number(s.id), s));

  const itemsBySaleId = new Map<number, SaleItem[]>();
  (saleItems || []).forEach((it) => {
    const sid = Number(it.sale_id);
    const list = itemsBySaleId.get(sid) || [];
    list.push(it);
    itemsBySaleId.set(sid, list);
  });

  const groupMap = new Map();
  (deliveries || []).forEach((d) => {
    const key = `${d.customer_name}||${d.delivery_address}`;
    const existing = groupMap.get(key) || { 
      key, 
      customer_name: d.customer_name, 
      delivery_address: d.delivery_address, 
      deliveries: [] 
    };
    existing.deliveries.push(d);
    groupMap.set(key, existing);
  });
  const grouped = Array.from(groupMap.values());

  React.useEffect(() => {
    const styleId = 'delivery-manifest-a4-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = '@media print { @page { size: A4; margin: 10mm 12mm; } body { margin: 0; padding: 0; background: white; } .no-print { display: none !important; } .a4-container { width: 100%; box-sizing: border-box; } } .a4-container { font-family: Arial, sans-serif; font-size: 9.5pt; color: #000; line-height: 1.25; } .header { border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 10px; } .title { text-align: center; font-size: 16pt; font-weight: 800; margin: 0; } .subtitle { text-align: center; font-size: 9pt; margin: 2px 0 0 0; color: #333; } .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 9pt; } .meta strong { color: #111; } .section { margin-top: 10px; } .section-title { background: #f2f2f2; border-left: 4px solid #111; padding: 4px 6px; font-weight: 700; font-size: 9pt; page-break-inside: avoid; } .stop { border: 1px solid #ddd; border-radius: 8px; padding: 8px; margin-top: 8px; page-break-inside: avoid; } .stop-header { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; } .stop-customer { font-weight: 800; font-size: 10pt; } .stop-address { font-size: 9pt; color: #333; margin-top: 2px; } table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9pt; } th, td { border: 1px solid #ccc; padding: 4px 4px; } th { background: #f7f7f7; text-align: left; font-weight: 700; } .col-check { width: 14px; text-align: center; } .checkbox { width: 10px; height: 10px; border: 1px solid #111; display: inline-block; } .footer { margin-top: 12px; padding-top: 8px; border-top: 1px dashed #777; text-align: center; font-size: 8pt; color: #555; }';
    document.head.appendChild(style);
  }, []);

  return React.createElement(
    'div',
    { className: 'a4-container' },
    React.createElement(
      'div',
      { className: 'header' },
      React.createElement('p', { className: 'subtitle' }, formatDateTime(new Date().toISOString())),
      React.createElement('h1', { className: 'title' }, `${companyName} - Romaneio de Entrega`),
      React.createElement('p', { className: 'subtitle' }, manifest.manifest_number ? `Entrega ${manifest.manifest_number}` : `Entrega ${manifest.id}`),
      React.createElement(
        'div',
        { className: 'meta' },
        React.createElement(
          'div',
          null,
          React.createElement('strong', null, 'Status:'),
          ' ',
          manifest.status,
          React.createElement('br'),
          React.createElement('strong', null, 'Criado em:'),
          ' ',
          formatDateTime(manifest.created_at)
        ),
        React.createElement(
          'div',
          { style: { textAlign: 'right' } },
          driver
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement('strong', null, 'Entregador:'),
                ' ',
                driver.name || 'Não informado',
                React.createElement('br'),
                driver.vehicle_type || driver.vehicle_plate
                  ? React.createElement(React.Fragment, null, React.createElement('strong', null, 'Veículo:'), ' ', [driver.vehicle_type, driver.vehicle_plate].filter(Boolean).join(' • ') || 'Não informado')
                  : React.createElement(React.Fragment, null, React.createElement('strong', null, 'Veículo:'), ' Não informado')
              )
            : React.createElement(
                React.Fragment,
                null,
                React.createElement('strong', null, 'Entregador:'),
                ' Não encontrado',
                React.createElement('br'),
                React.createElement('strong', null, 'Veículo:'),
                ' Não encontrado'
              )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'section' },
      React.createElement('div', { className: 'section-title' }, 'PARADAS (POR CLIENTE/ENDEREÇO)'),
      grouped.map((g, idx) => {
        const rows: Array<{ label: string; qty: number }> = [];
        g.deliveries.forEach((d: any) => {
          const sid = Number(d.sale_id);
          const its: SaleItem[] = itemsBySaleId.get(sid) || [];
          its.forEach((it: SaleItem) => {
            rows.push({ label: it.product_name || 'Item', qty: Number(it.quantity || 0) });
          });
        });

        const consolidated = new Map<string, number>();
        rows.forEach((r) => consolidated.set(r.label, (consolidated.get(r.label) || 0) + r.qty));
        const itemsList = Array.from(consolidated.entries()).map(([label, qty]) => ({ label, qty }));

        return React.createElement(
          'div',
          { key: g.key, className: 'stop' },
          React.createElement(
            'div',
            { className: 'stop-header' },
            React.createElement(
              'div',
              null,
              React.createElement('div', { className: 'stop-customer' }, `${idx + 1}. ${g.customer_name}`),
              React.createElement('div', { className: 'stop-address' }, g.delivery_address)
            ),
            React.createElement(
              'div',
              { style: { textAlign: 'right', fontSize: '9pt', color: '#333', fontWeight: 'bold' } },
              g.deliveries
                .map((d: Delivery) => {
                  const sid = Number(d.sale_id);
                  const sale = salesById.get(sid);
                  return sale?.sale_number ? `Venda #${sale.sale_number}` : d.sale_id ? `Venda #${d.sale_id}` : '';
                })
                .filter(Boolean)
                .join(' • ')
            )
          ),
          React.createElement(
            'table',
            null,
            React.createElement(
              'thead',
              null,
              React.createElement(
                'tr',
                null,
                React.createElement('th', { className: 'col-check' }, 'OK'),
                React.createElement('th', null, 'Item'),
                React.createElement('th', { style: { width: '70px' } }, 'Qtd')
              )
            ),
            React.createElement(
              'tbody',
              null,
              itemsList.length === 0
                ? React.createElement(
                    'tr',
                    null,
                    React.createElement('td', { className: 'col-check' }, React.createElement('span', { className: 'checkbox' })),
                    React.createElement('td', { colSpan: 2 }, 'Sem itens (verifique a venda)')
                  )
                : itemsList.map((it, i) =>
                    React.createElement(
                      'tr',
                      { key: `${it.label}-${i}` },
                      React.createElement('td', { className: 'col-check' }, React.createElement('span', { className: 'checkbox' })),
                      React.createElement('td', null, it.label),
                      React.createElement('td', { style: { textAlign: 'right' } }, formatQty(it.qty))
                    )
                  )
            )
          )
        );
      })
    ),
    React.createElement('div', { className: 'footer' }, 'Gerado pelo JUGA • Use as caixinhas "OK" para conferência manual no carregamento.')
  );
}
