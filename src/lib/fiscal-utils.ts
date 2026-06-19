import { Sale, SaleItem, Customer, Product } from '@/types';

export type FocusNFEDocType = 'nfe' | 'nfce' | 'nfse' | 'nfse_nacional';

/**
 * Mapeia uma venda para o payload de NF-e (Produto) da Focus NFe
 */
export function mapSaleToNFePayload(
  sale: Sale,
  items: (SaleItem & { product?: Product })[],
  customer?: Customer,
  tenantState?: string
) {
  const customerFields = mapCustomerToFocusV2(customer);

  return {
    natureza_operacao: 'Venda de mercadoria',
    data_emissao: new Date().toISOString(),
    tipo_documento: 1, // 1 - Saída
    finalidade_emissao: 1, // 1 - Normal
    consumidor_final: (() => {
      if (!customer) return 1;
      const docClean = (customer.document || '').replace(/\D/g, '');
      const isCPF = docClean.length === 11;
      const ieClean = customer.state_registration ? customer.state_registration.replace(/\D/g, '') : '';
      const isIsento = customer.state_registration?.trim().toUpperCase() === 'ISENTO';
      
      // Se for CPF, não contribuinte (sem IE) ou Isento, obrigatoriamente é consumidor final (1).
      if (isCPF || (!ieClean && !isIsento)) {
        return 1;
      }
      return 0; // Contribuinte do ICMS com IE ativa (revenda/outros)
    })(),
    presenca_comprador: 1, // 1 - Operação presencial
    modalidade_frete: '9', // 9 - Sem frete
    informacoes_adicionais_contribuinte: (sale.notes || (sale as any).observacoes || '').trim().substring(0, 5000) || undefined,
    ...customerFields,
    items: items.map((item, index) => mapItemToFocus(item, index + 1, tenantState, customer?.state)),
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
export function mapSaleToNFCePayload(
  sale: Sale,
  items: (SaleItem & { product?: Product })[],
  customer?: Customer,
  tenantState?: string
) {
  const customerFields = customer ? mapCustomerToFocusV2(customer) : {};

  return {
    natureza_operacao: 'Venda ao consumidor',
    data_emissao: new Date().toISOString(),
    presenca_comprador: 1,
    modalidade_frete: '9', // 9 - Sem frete
    informacoes_adicionais_contribuinte: (sale.notes || (sale as any).observacoes || '').trim().substring(0, 5000) || undefined,
    ...customerFields,
    items: items.map((item, index) => mapItemToFocus(item, index + 1, tenantState, customer?.state)),
    formas_pagamento: [
      {
        forma_pagamento: mapPaymentMethod((sale as any).forma_pagamento || (sale as any).payment_method),
        valor_pagamento: (sale as any).total ?? (sale as any).final_amount ?? 0,
      }
    ],
  };
}

/**
 * Mapeia uma ordem de serviço para o payload de NFSe Nacional da Focus NFe
 */
export function mapOSToNFSeNacionalPayload(os: any, customer?: Customer) {
  // Nota: OS simplificada conforme src/app/ordem-servicos/page.tsx
  const customerFields = customer ? mapCustomerToFocusV2(customer) : {};
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
 * Auxiliar para mapear cliente legado (para NFSe)
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
    logradouro: customer.address || '',
    numero: customer.address_number || 'SN',
    complemento: customer.address_complement,
    bairro: customer.neighborhood,
    municipio: customer.city,
    uf: customer.state,
    cep: customer.zipcode?.replace(/\D/g, ''),
  };
}

/**
 * Auxiliar para mapear cliente Focus NFe v2 (NF-e / NFC-e)
 */
function mapCustomerToFocusV2(customer?: Customer) {
  if (!customer) return {};

  const isCPF = (customer.document || '').replace(/\D/g, '').length === 11;
  const docClean = (customer.document || '').replace(/\D/g, '');

  const data: any = {
    nome_destinatario: customer.name || '',
    logradouro_destinatario: customer.address || '',
    numero_destinatario: customer.address_number || 'SN',
    complemento_destinatario: customer.address_complement || '',
    bairro_destinatario: customer.neighborhood || '',
    municipio_destinatario: customer.city || '',
    uf_destinatario: customer.state || '',
    cep_destinatario: (customer.zipcode || '').replace(/\D/g, ''),
  };

  if (docClean) {
    if (isCPF) {
      data.cpf_destinatario = docClean;
      data.indicador_inscricao_estadual_destinatario = '9'; // CPF é sempre Não Contribuinte
    } else {
      data.cnpj_destinatario = docClean;
      
      const ieClean = customer.state_registration ? customer.state_registration.replace(/\D/g, '') : '';
      const isIsento = customer.state_registration?.trim().toUpperCase() === 'ISENTO';

      if (ieClean) {
        data.inscricao_estadual_destinatario = ieClean;
        data.indicador_inscricao_estadual_destinatario = '1'; // Contribuinte ICMS
      } else if (isIsento) {
        data.inscricao_estadual_destinatario = 'ISENTO';
        data.indicador_inscricao_estadual_destinatario = '2'; // Isento de IE
      } else {
        data.indicador_inscricao_estadual_destinatario = '9'; // Não contribuinte
      }
    }
  } else {
    data.indicador_inscricao_estadual_destinatario = '9';
  }

  if (customer.email) {
    data.email_destinatario = customer.email;
  }
  if (customer.phone) {
    data.telefone_destinatario = customer.phone.replace(/\D/g, '');
  }

  return data;
}

/**
 * Auxiliar para mapear item
 */
function mapItemToFocus(
  item: SaleItem & { product?: Product },
  index: number,
  tenantState?: string,
  customerState?: string
) {
  // Usar novos campos fiscais do produto se disponíveis
  const ncm = item.product?.ncm || '00000000';
  let cfop = item.product?.cfop_default || '5102';

  // Se for venda interestadual (estados diferentes), converter CFOP 5xxx para 6xxx
  if (tenantState && customerState) {
    const tState = tenantState.trim().toUpperCase();
    const cState = customerState.trim().toUpperCase();
    if (tState !== cState && cfop.startsWith('5')) {
      cfop = '6' + cfop.substring(1);
    }
  }

  const unit = String(item.product?.unit || 'UN').trim();
  const unitClean = unit.length > 0 ? unit.substring(0, 6) : 'UN';
  const unitPrice = Number((item as any).unit_price ?? (item as any).preco_unitario ?? 0);
  const qty = Number((item as any).quantity ?? (item as any).quantidade ?? 1);
  const bruto = Number((unitPrice * qty).toFixed(2));
  const subtotal = Number((item as any).subtotal ?? (item as any).total_price ?? bruto);
  const discount = Math.max(0, bruto - subtotal);

  const mapped: any = {
    numero_item: String(index),
    codigo_produto: String(item.product_id || `item_${index}`),
    descricao: item.product?.name || (item as any).product_name || (item as any).produto || 'Produto sem nome',
    codigo_ncm: ncm.replace(/\D/g, ''),
    cfop: cfop.replace(/\D/g, ''),
    unidade_comercial: unitClean,
    quantidade_comercial: qty,
    valor_unitario_comercial: unitPrice,
    unidade_tributavel: unitClean,
    quantidade_tributavel: qty,
    valor_unitario_tributavel: unitPrice,
    valor_bruto: bruto,
    icms_situacao_tributaria: '102', // Simples Nacional - Sem permissão de crédito
    icms_origem: '0',
    pis_situacao_tributaria: '07',
    cofins_situacao_tributaria: '07',
  };

  if (discount > 0.009) {
    mapped.valor_desconto = Number(discount.toFixed(2));
  }

  return mapped;
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
