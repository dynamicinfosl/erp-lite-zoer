export type TaxRegime = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

export type InvoiceEnvironment = 'production' | 'homologation';

export interface InvoiceCustomer {
  name: string;
  document: string; // CPF ou CNPJ
  email?: string;
  phone?: string;
  stateRegistration?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface InvoiceItem {
  sku?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  ncm?: string;
  cfop?: string;
  cest?: string;
  discount?: number;
  tax?: {
    icms?: string;
    pis?: string;
    cofins?: string;
    ipi?: string;
  };
}

export interface InvoicePayment {
  method: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'other';
  amount: number;
  dueDate?: string;
}

export interface NFEPayload {
  environment: InvoiceEnvironment;
  operationNature: string;
  series?: string;
  number?: string;
  issueDate?: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  totals: {
    amount: number;
    discount?: number;
    freight?: number;
    insurance?: number;
    other?: number;
  };
  emitter?: {
    companyName: string;
    tradeName?: string;
    document: string;
    stateRegistration?: string;
    taxRegime: TaxRegime;
  };
  metadata?: Record<string, unknown>;
}

export interface NFEEmitResponse {
  protocol: string;
  invoiceNumber?: string;
  status: 'processing' | 'authorized' | 'rejected';
  receiptUrl?: string;
  xmlUrl?: string;
  rawResponse?: unknown;
}

export interface NFEStatusResponse {
  status: 'authorized' | 'rejected' | 'processing' | 'cancelled';
  motive?: string;
  authorizedAt?: string;
  receiptUrl?: string;
}

export interface SaleInvoiceHook {
  saleId: string | number;
  tenantId: string;
  payload: NFEPayload;
}

