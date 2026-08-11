/**
 * Cliente para integração com a API Nota AaS (Nota como Serviço)
 * Documentação: https://docs.notaas.com.br/docs
 */

export interface NotaAsConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface NotaAsTomador {
  nome: string;
  cnpj?: string;
  cpf?: string;
  nif?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    pais?: string;
  };
}

export interface NotaAsServico {
  descricao: string;
  codigo?: string; // LC 116 (ex: "010302")
  codigoServico?: string; // Municipal (ex: "07498")
  localPrestacao?: string; // IBGE
  informacoesComplementares?: string;
}

export interface NotaAsValoresNFSe {
  total: number;
  aliquotaIss: number; // Ex: 2.0 para 2%
  issRetido?: boolean;
}

export interface NotaAsNFSePayload {
  tomador: NotaAsTomador;
  servico: NotaAsServico;
  valores: NotaAsValoresNFSe;
  competencia?: string; // YYYY-MM
  referencia?: string;
}

export interface NotaAsNFeItem {
  descricao: string;
  codigo?: string;
  ncm: string;
  cfop: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal: number;
  unidade?: string;
  cst?: string;
  csosn?: string;
  aliquotaIcms?: number;
}

export interface NotaAsPagamento {
  tipoPagamento: string; // 01=Dinheiro, 03=Cartão Crédito, 04=Cartão Débito, 17=PIX, 99=Outros
  valor: number;
  descricaoPagamento?: string;
}

export interface NotaAsNFePayload {
  modelo?: number; // 55 para NF-e, 65 para NFC-e (default 55)
  naturezaOperacao: string;
  dest: {
    nome: string;
    cnpj?: string;
    cpf?: string;
    ie?: string;
    indicadorIE?: number;
    email?: string;
    endereco: {
      logradouro: string;
      numero?: string;
      bairro: string;
      codigoMunicipio: number;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
  items: NotaAsNFeItem[];
  pagamentos: NotaAsPagamento[];
  infCpl?: string;
  referencia?: string;
}

export interface NotaAsIssueResponse {
  queued: boolean;
  invoiceId: string;
  status: string;
  pollUrl?: string;
  error?: string;
  message?: string;
}

export class NotaAsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: NotaAsConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://platform.notaas.com.br/api/v1';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }

  /**
   * Emite NFS-e via Nota AaS
   */
  async emitirNFSe(payload: NotaAsNFSePayload): Promise<NotaAsIssueResponse> {
    const response = await fetch(`${this.baseUrl}/emitir`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Erro ${response.status} ao emitir NFS-e na Nota AaS`
      );
    }

    return data as NotaAsIssueResponse;
  }

  /**
   * Consulta o status de uma NFS-e pelo ID
   */
  async consultarStatusNFSe(invoiceId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}/status`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Erro ${response.status} ao consultar status NFS-e na Nota AaS`
      );
    }

    return data;
  }

  /**
   * Emite NF-e ou NFC-e via Nota AaS
   */
  async emitirNFe(payload: NotaAsNFePayload): Promise<NotaAsIssueResponse> {
    const response = await fetch(`${this.baseUrl}/nfe/emitir`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Erro ${response.status} ao emitir NF-e na Nota AaS`
      );
    }

    return data as NotaAsIssueResponse;
  }

  /**
   * Consulta o status de uma NF-e pelo ID
   */
  async consultarStatusNFe(invoiceId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/nfe/${invoiceId}/status`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Erro ${response.status} ao consultar status NF-e na Nota AaS`
      );
    }

    return data;
  }

  /**
   * Cria um projeto/empresa na organização Nota AaS (Multi-tenant Onboarding)
   */
  async criarProjeto(projectData: {
    name: string;
    cnpj: string;
    razaoSocial: string;
    inscricaoMunicipal?: string;
    codigoMunicipio?: string;
    email?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/org/projects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(projectData),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Erro ${response.status} ao criar projeto na Nota AaS`
      );
    }

    return data;
  }
}

/**
 * Converte dados genéricos do ERP para o formato de NF-e da Nota AaS
 */
export function mapGenericPayloadToNotaAsNFe(payload: any): NotaAsNFePayload {
  const destName = payload.destinatario?.nome || payload.tomador?.nome || payload.nome_destinatario || 'Cliente Final';
  const destDoc = (payload.destinatario?.cnpj || payload.destinatario?.cpf || payload.tomador?.cnpj || payload.tomador?.cpf || payload.documento_destinatario || '').replace(/\D/g, '');
  const isCnpj = destDoc.length > 11;

  const rawItems = payload.items || payload.itens || [];
  const mappedItems: NotaAsNFeItem[] = rawItems.map((item: any) => ({
    descricao: item.descricao || item.xProd || 'Produto',
    codigo: item.codigo || item.cProd || 'PRD01',
    ncm: (item.ncm || item.NCM || '00000000').replace(/\D/g, ''),
    cfop: (item.cfop || item.CFOP || '5102').replace(/\D/g, ''),
    quantidade: item.quantidade || item.qCom || 1,
    valorUnitario: item.valor_unitario || item.vUnCom || item.valorTotal || item.vProd || 0,
    valorTotal: item.valor_total || item.vProd || item.valorTotal || 0,
    unidade: item.unidade || item.uCom || 'UN',
    cst: item.cst || item.icms_cst || undefined,
    csosn: item.csosn || item.icms_csosn || '102',
  }));

  const rawPayments = payload.formas_pagamento || payload.pagamentos || [];
  const mappedPayments: NotaAsPagamento[] = rawPayments.length > 0
    ? rawPayments.map((p: any) => ({
        tipoPagamento: String(p.forma_pagamento || p.tipoPagamento || '01').padStart(2, '0'),
        valor: p.valor_pagamento || p.valor || 0,
      }))
    : [{ tipoPagamento: '01', valor: payload.valor_total_nota || payload.total || 0 }];

  return {
    modelo: payload.modelo || (payload.doc_type === 'nfce' ? 65 : 55),
    naturezaOperacao: payload.natureza_operacao || 'Venda de mercadoria',
    dest: {
      nome: destName,
      cnpj: isCnpj ? destDoc : undefined,
      cpf: !isCnpj ? destDoc : undefined,
      email: payload.destinatario?.email || payload.tomador?.email,
      endereco: {
        logradouro: payload.destinatario?.logradouro || payload.destinatario?.endereco?.logradouro || 'Rua Principal',
        numero: payload.destinatario?.numero || payload.destinatario?.endereco?.numero || 'SN',
        bairro: payload.destinatario?.bairro || payload.destinatario?.endereco?.bairro || 'Centro',
        codigoMunicipio: parseInt(payload.destinatario?.codigo_municipio || payload.codigo_municipio || '3550308', 10),
        cidade: payload.destinatario?.cidade || payload.destinatario?.endereco?.cidade || 'Sao Paulo',
        uf: payload.destinatario?.uf || payload.destinatario?.endereco?.uf || 'SP',
        cep: (payload.destinatario?.cep || payload.destinatario?.endereco?.cep || '00000000').replace(/\D/g, ''),
      },
    },
    items: mappedItems,
    pagamentos: mappedPayments,
    infCpl: payload.informacoes_adicionais_contribuinte || payload.infCpl,
    referencia: payload.referencia || payload.ref,
  };
}

/**
 * Converte dados genéricos do ERP para o formato de NFS-e da Nota AaS
 */
export function mapGenericPayloadToNotaAsNFSe(payload: any): NotaAsNFSePayload {
  const tomadorName = payload.tomador?.nome || payload.nome_tomador || 'Cliente';
  const tomadorDoc = (payload.tomador?.cnpj || payload.tomador?.cpf || payload.documento_tomador || '').replace(/\D/g, '');
  const isCnpj = tomadorDoc.length > 11;

  return {
    tomador: {
      nome: tomadorName,
      cnpj: isCnpj ? tomadorDoc : undefined,
      cpf: !isCnpj ? tomadorDoc : undefined,
      email: payload.tomador?.email,
      telefone: payload.tomador?.telefone?.replace(/\D/g, ''),
      endereco: payload.tomador?.endereco ? {
        logradouro: payload.tomador.endereco.logradouro,
        numero: payload.tomador.endereco.numero,
        complemento: payload.tomador.endereco.complemento,
        bairro: payload.tomador.endereco.bairro,
        cidade: payload.tomador.endereco.cidade,
        uf: payload.tomador.endereco.uf,
        cep: payload.tomador.endereco.cep?.replace(/\D/g, ''),
      } : undefined,
    },
    servico: {
      descricao: payload.descricao_servico || payload.servico?.descricao || 'Prestacao de Servicos',
      codigo: (payload.codigo_servico || payload.codigo_tributacao_nacional_iss || '010302').replace(/\D/g, ''),
      localPrestacao: payload.municipio_prestacao || payload.codigo_municipio,
    },
    valores: {
      total: payload.valor_servico || payload.valor_total || payload.valores?.total || 0,
      aliquotaIss: payload.aliquota_iss || payload.valores?.aliquotaIss || 2.0,
      issRetido: payload.iss_retido || false,
    },
    referencia: payload.referencia || payload.ref,
  };
}
