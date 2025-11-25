import { NFE_CONFIG, NFEProviderConfig } from '@/constants/nfe';
import { NFEPayload, NFEEmitResponse, NFEStatusResponse } from '@/types/nfe';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  body?: unknown;
}

export class NFEClient {
  private readonly config: NFEProviderConfig;

  constructor(config: NFEProviderConfig = NFE_CONFIG) {
    this.config = config;
  }

  get isEnabled() {
    return Boolean(this.config.enabled && this.config.baseUrl && this.config.apiKey);
  }

  private assertReady() {
    if (!this.isEnabled) {
      throw new Error('API de Nota Fiscal não está habilitada. Defina NFE_API_ENABLED=true e configure as chaves.');
    }
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    this.assertReady();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao comunicar com API de NFe (${response.status}): ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Timeout ao comunicar com o provedor de NFe');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  emitInvoice(payload: NFEPayload): Promise<NFEEmitResponse> {
    return this.request<NFEEmitResponse>('/invoices', { body: payload });
  }

  getInvoiceStatus(protocol: string): Promise<NFEStatusResponse> {
    return this.request<NFEStatusResponse>(`/invoices/${protocol}`, { method: 'GET' });
  }

  cancelInvoice(protocol: string, reason: string) {
    return this.request<NFEStatusResponse>(`/invoices/${protocol}/cancel`, {
      method: 'POST',
      body: { reason },
    });
  }
}

export const nfeClient = new NFEClient();

