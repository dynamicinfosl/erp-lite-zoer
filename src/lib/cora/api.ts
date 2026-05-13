import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CORA_API_URL = process.env.CORA_API_URL || 'https://matls-clients.api.stage.cora.com.br';
const CLIENT_ID = process.env.CORA_CLIENT_ID;
const CERT_PATH = process.env.CORA_CERT_PATH || 'certs/cora/certificate.pem';
const KEY_PATH = process.env.CORA_KEY_PATH || 'certs/cora/private-key.key';

let agent: https.Agent | null = null;

// Inicializa o https.Agent com os certificados (mTLS)
function getAgent() {
  if (agent) return agent;
  try {
    const certPath = path.resolve(process.cwd(), CERT_PATH);
    const keyPath = path.resolve(process.cwd(), KEY_PATH);
    
    // Verifica se os arquivos existem para não dar crash silencioso
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn('⚠️ Certificados da Cora não encontrados nos caminhos:', { certPath, keyPath });
      return null;
    }

    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    
    agent = new https.Agent({ cert, key });
    return agent;
  } catch (error) {
    console.error('❌ Erro ao carregar certificados da Cora:', error);
    return null;
  }
}

// Wrapper para requisições HTTPS nativas (para podermos passar o Agent mTLS)
function httpsRequest(urlStr: string, options: https.RequestOptions, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    
    const httpsAgent = getAgent();
    if (!httpsAgent) {
      return reject(new Error('Certificados mTLS da Cora não configurados corretamente.'));
    }

    const reqOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method,
      headers: options.headers,
      agent: httpsAgent,
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 400) {
            reject({ status: res.statusCode, data: json });
          } else {
            resolve(json);
          }
        } catch (e) {
          if (res.statusCode && res.statusCode >= 400) {
            reject({ status: res.statusCode, data });
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Variáveis para cache em memória do token
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getCoraToken(): Promise<string> {
  // Retorna token do cache se ainda for válido
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const url = `${CORA_API_URL}/token`;
  const body = `grant_type=client_credentials&client_id=${CLIENT_ID}`;

  console.log('🔄 Buscando novo token da Cora...');
  
  try {
    const response = await httpsRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    cachedToken = response.access_token;
    // Subtrai 5 minutos (300 segundos) da expiração real por segurança
    tokenExpiresAt = Date.now() + (response.expires_in - 300) * 1000;

    console.log('✅ Token da Cora obtido com sucesso!');
    return cachedToken as string;
  } catch (error) {
    console.error('❌ Falha ao obter token da Cora:', error);
    throw error;
  }
}

// Interfaces dos parâmetros
export interface CoraCustomer {
  name: string;
  email: string;
  document: {
    identity: string;
    type?: 'CPF' | 'CNPJ';
  };
  address?: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    complement?: string;
    zip_code: string;
  };
}

export interface CoraService {
  name: string;
  description: string;
  amount: number; // Em centavos (ex: 25000 = R$ 250,00)
}

export interface CreateInvoiceParams {
  code?: string; // Seu identificador interno
  customer: CoraCustomer;
  services: CoraService[];
  dueDate: string; // Formato YYYY-MM-DD
}

export async function createInvoice(params: CreateInvoiceParams) {
  const token = await getCoraToken();
  const url = `${CORA_API_URL}/v2/invoices`;
  const idempotencyKey = crypto.randomUUID();

  const payload = {
    code: params.code || `inv_${Date.now()}`,
    customer: params.customer,
    services: params.services,
    payment_terms: {
      due_date: params.dueDate,
    },
    payment_forms: ["BANK_SLIP", "PIX"] // Solicita ambos, boleto e PIX
  };

  const body = JSON.stringify(payload);

  console.log(`🧾 Criando cobrança na Cora (Idempotency: ${idempotencyKey})...`);

  try {
    const response = await httpsRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    console.log('✅ Cobrança criada com sucesso na Cora!');
    return response;
  } catch (error) {
    console.error('❌ Falha ao criar cobrança na Cora:', error);
    throw error;
  }
}
