import { Sale, SaleItem, Customer, Product } from '@/types';

export type FocusNFEDocType = 'nfe' | 'nfce' | 'nfse' | 'nfse_nacional';

/**
 * Mapeia uma venda para o payload de NF-e (Produto) da Focus NFe
 */
export function mapSaleToNFePayload(sale: Sale, items: (SaleItem & { product?: Product })[], customer?: Customer) {
  return {
    natureza_operacao: 'Venda de mercadoria',
    data_emissao: new Date().toISOString(),
    tipo_documento: 1, // 1 - Saída
    finalidade_emissao: 1, // 1 - Normal
    consumidor_final: customer ? (customer.document?.length === 11 ? 1 : 0) : 1,
    presenca_comprador: 1, // 1 - Operação presencial
    destinatario: mapCustomerToFocus(customer),
    itens: items.map((item, index) => mapItemToFocus(item, index + 1)),
    formas_pagamento: [
      {
        forma_pagamento: mapPaymentMethod((sale as any).forma_pagamento || (sale as any).payment_method),
        valor_pagamento: (sale as any).total ?? (sale as any).final_amount ?? 0,
      }
    ],
    valor_total_bruto: (sale as any).subtotal ?? (sale as any).total_amount ?? (sale as any).total ?? 0,
    valor_total_nota: (sale as any).total ?? (sale as any).final_amount ?? 0,
  };
}

/**
 * Mapeia uma venda para o payload de NFC-e (Consumidor) da Focus NFe
 */
export function mapSaleToNFCePayload(sale: Sale, items: (SaleItem & { product?: Product })[], customer?: Customer) {
  const payload: any = {
    natureza_operacao: 'Venda ao consumidor',
    data_emissao: new Date().toISOString(),
    presenca_comprador: 1,
    itens: items.map((item, index) => mapItemToFocus(item, index + 1)),
    formas_pagamento: [
      {
        forma_pagamento: mapPaymentMethod((sale as any).forma_pagamento || (sale as any).payment_method),
        valor_pagamento: (sale as any).total ?? (sale as any).final_amount ?? 0,
      }
    ],
  };

  if (customer && customer.document) {
    payload.destinatario = mapCustomerToFocus(customer);
  }

  return payload;
}

/**
 * Mapeia uma ordem de serviço para o payload de NFSe Nacional da Focus NFe
 */
export function mapOSToNFSeNacionalPayload(os: any, customer?: Customer) {
  // Nota: OS simplificada conforme src/app/ordem-servicos/page.tsx
  return {
    data_emissao: new Date().toISOString(),
    valor_servico: os.valor_final || os.valor_estimado,
    descricao_servico: os.descricao,
    codigo_tributacao_nacional_iss: '01.01', // Valor padrão, idealmente viria da OS ou Configuração
    municipio_prestacao: '4205407', // Exemplo: Florianópolis. Idealmente viria do Tenant
    tomador: customer ? mapCustomerToFocus(customer) : undefined,
  };
}

/**
 * Auxiliar para mapear cliente
 */
function mapCustomerToFocus(customer?: Customer) {
  if (!customer) return undefined;

  const isCPF = (customer.document || '').replace(/\D/g, '').length === 11;

  return {
    nome: customer.name,
    cpf: isCPF ? customer.document?.replace(/\D/g, '') : undefined,
    cnpj: !isCPF ? customer.document?.replace(/\D/g, '') : undefined,
    email: customer.email,
    telefone: customer.phone?.replace(/\D/g, ''),
    endereco_logradouro: customer.address || '',
    endereco_numero: customer.address_number || 'SN',
    endereco_complemento: customer.address_complement,
    endereco_bairro: customer.neighborhood,
    endereco_municipio: customer.city,
    endereco_uf: customer.state,
    endereco_cep: customer.zipcode?.replace(/\D/g, ''),
  };
}

/**
 * Auxiliar para mapear item
 */
function mapItemToFocus(item: SaleItem & { product?: Product }, index: number) {
  // Usar novos campos fiscais do produto se disponíveis
  const ncm = item.product?.ncm || '00000000';
  const cfop = item.product?.cfop_default || '5102';

  return {
    numero_item: String(index),
    codigo_produto: String(item.product_id),
    descricao: item.product?.name || 'Produto sem nome',
    ncm: ncm.replace(/\D/g, ''),
    cfop: cfop.replace(/\D/g, ''),
    unidade_comercial: item.product?.unit || 'UN',
    quantidade_comercial: item.quantity,
    valor_unitario_comercial: (item as any).unit_price ?? (item as any).preco_unitario ?? 0,
    valor_bruto: (item as any).total_price ?? (item as any).subtotal ?? 0,
    icms_situacao_tributaria: '102', // Simples Nacional - Sem permissão de crédito
    icms_origem: '0',
    pis_situacao_tributaria: '07',
    cofins_situacao_tributaria: '07',
  };
}

/**
 * Auxiliar para mapear forma de pagamento
 */
function mapPaymentMethod(method: string) {
  switch (method) {
    case 'dinheiro': return '01';
    case 'pix': return '17';
    case 'cartao_credito': return '03';
    case 'cartao_debito': return '04';
    case 'boleto': return '15';
    default: return '99'; // Outros
  }
}

/**
 * Chama a API de emissão
 */
export async function emitFiscalDocument(params: {
  tenant_id: string;
  doc_type: FocusNFEDocType;
  payload: any;
  ref?: string;
}) {
  const endpoint = params.doc_type === 'nfse_nacional' 
    ? '/next_api/fiscal/focusnfe/nfse-nacional/issue' 
    : '/next_api/fiscal/focusnfe/issue';

  const body = {
    tenant_id: params.tenant_id,
    doc_type: params.doc_type,
    payload: params.payload,
    ref: params.ref
  };

  console.log(`🚀 Enviando documento fiscal (${params.doc_type}):`, JSON.stringify(body, null, 2));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('❌ Erro na emissão fiscal:', result);
    
    // Tentar extrair erro detalhado da FocusNFe
    let detail = '';
    if (result.provider_error?.errors) {
      detail = result.provider_error.errors.map((e: any) => `${e.message || e.codigo}: ${e.parametro || ''}`).join('; ');
    } else if (result.provider_error?.mensagem) {
      detail = result.provider_error.mensagem;
    }

    const errorMsg = detail 
      ? `Erro FocusNFe: ${detail}`
      : (result.error || result.message || 'Erro ao emitir documento fiscal');
      
    throw new Error(errorMsg);
  }

  return result;
}
