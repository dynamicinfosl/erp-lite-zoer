import { nfeClient } from './client';
import { NFE_CONFIG } from '@/constants/nfe';
import { NFEPayload, NFEEmitResponse, SaleInvoiceHook } from '@/types/nfe';

export interface SaleItemForInvoice {
  id: string | number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  discount?: number;
  ncm?: string;
  cfop?: string;
}

export interface SaleForInvoice {
  id: string | number;
  tenantId: string;
  customer: SaleInvoiceHook['payload']['customer'];
  items: SaleItemForInvoice[];
  totals: {
    amount: number;
    discount?: number;
    freight?: number;
    insurance?: number;
    other?: number;
  };
  payments: NFEPayload['payments'];
  metadata?: Record<string, unknown>;
}

export interface EmitInvoiceResult {
  status: 'disabled' | 'queued' | 'sent';
  protocol?: string;
  payload: NFEPayload;
  providerResponse?: NFEEmitResponse;
  message?: string;
}

const inMemoryQueue: SaleInvoiceHook[] = [];

export function mapSaleToPayload(sale: SaleForInvoice): NFEPayload {
  return {
    environment: NFE_CONFIG.environment,
    operationNature: 'Venda de mercadorias',
    customer: sale.customer,
    items: sale.items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity - (item.discount ?? 0),
      ncm: item.ncm,
      cfop: item.cfop,
      discount: item.discount,
    })),
    payments: sale.payments,
    totals: sale.totals,
    metadata: {
      saleId: sale.id,
      tenantId: sale.tenantId,
      ...(sale.metadata || {}),
    },
  };
}

export function queueInvoiceEmission(hook: SaleInvoiceHook) {
  inMemoryQueue.push(hook);
}

export function getQueuedInvoices() {
  return inMemoryQueue;
}

export async function emitInvoiceForSale(sale: SaleForInvoice): Promise<EmitInvoiceResult> {
  const payload = mapSaleToPayload(sale);

  if (!nfeClient.isEnabled) {
    queueInvoiceEmission({
      saleId: sale.id,
      tenantId: sale.tenantId,
      payload,
    });
    return {
      status: 'disabled',
      payload,
      message: 'API de NFe desabilitada. Emissão será reprocessada quando o provedor estiver configurado.',
    };
  }

  const response = await nfeClient.emitInvoice(payload);

  return {
    status: response.status === 'processing' ? 'queued' : 'sent',
    protocol: response.protocol,
    payload,
    providerResponse: response,
  };
}

