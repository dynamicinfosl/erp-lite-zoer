/**
 * Funções de segurança e auditoria para fechamento de caixa
 * Garante integridade dos dados e rastreabilidade completa
 */

import crypto from 'crypto';

export interface CashSessionData {
  id?: number;
  tenant_id: string;
  register_id: string;
  opened_at: string;
  closed_at?: string;
  opened_by: string;
  closed_by?: string;
  opening_amount: number;
  closing_amount_cash?: number;
  closing_amount_card_debit?: number;
  closing_amount_card_credit?: number;
  closing_amount_pix?: number;
  closing_amount_other?: number;
  expected_cash?: number;
  expected_card_debit?: number;
  expected_card_credit?: number;
  expected_pix?: number;
  expected_other?: number;
  difference_amount?: number;
  difference_cash?: number;
  difference_card_debit?: number;
  difference_card_credit?: number;
  difference_pix?: number;
  difference_other?: number;
  total_sales?: number;
  total_sales_amount?: number;
}

export interface CashSessionSnapshot {
  session_info: {
    id?: number;
    register_id: string;
    opened_at: string;
    closed_at: string;
    session_duration_minutes: number;
  };
  amounts: {
    opening: number;
    closing: {
      cash: number;
      card_debit: number;
      card_credit: number;
      pix: number;
      other: number;
      total: number;
    };
    expected: {
      cash: number;
      card_debit: number;
      card_credit: number;
      pix: number;
      other: number;
      total: number;
    };
    differences: {
      cash: number;
      card_debit: number;
      card_credit: number;
      pix: number;
      other: number;
      total: number;
    };
  };
  statistics: {
    total_sales: number;
    total_sales_amount: number;
    total_withdrawals?: number;
    total_withdrawals_amount?: number;
    total_supplies?: number;
    total_supplies_amount?: number;
  };
  timestamp: string;
  version: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

/**
 * Gera hash SHA-256 dos dados de fechamento para garantir integridade
 */
export function generateSecurityHash(data: CashSessionData): string {
  // Criar string com os dados críticos em ordem determinística
  const criticalData = {
    tenant_id: data.tenant_id,
    register_id: data.register_id,
    opened_at: data.opened_at,
    closed_at: data.closed_at,
    opening_amount: data.opening_amount,
    closing_amount_cash: data.closing_amount_cash || 0,
    closing_amount_card_debit: data.closing_amount_card_debit || 0,
    closing_amount_card_credit: data.closing_amount_card_credit || 0,
    closing_amount_pix: data.closing_amount_pix || 0,
    closing_amount_other: data.closing_amount_other || 0,
    difference_amount: data.difference_amount || 0,
    total_sales: data.total_sales || 0,
    total_sales_amount: data.total_sales_amount || 0,
  };

  // Converter para string JSON ordenada
  const dataString = JSON.stringify(criticalData, Object.keys(criticalData).sort());
  
  // Gerar hash SHA-256
  return crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
}

/**
 * Verifica se o hash de um registro é válido
 */
export function verifySecurityHash(data: CashSessionData, providedHash: string): boolean {
  const calculatedHash = generateSecurityHash(data);
  return calculatedHash === providedHash;
}

/**
 * Cria um snapshot completo do estado do caixa no momento do fechamento
 */
export function createCashSessionSnapshot(
  sessionData: CashSessionData,
  sales: any[],
  operations: any[]
): CashSessionSnapshot {
  const closedAt = sessionData.closed_at || new Date().toISOString();
  const openedAt = new Date(sessionData.opened_at);
  const closingTime = new Date(closedAt);
  const durationMinutes = Math.floor((closingTime.getTime() - openedAt.getTime()) / 60000);

  const closingTotal = 
    (sessionData.closing_amount_cash || 0) +
    (sessionData.closing_amount_card_debit || 0) +
    (sessionData.closing_amount_card_credit || 0) +
    (sessionData.closing_amount_pix || 0) +
    (sessionData.closing_amount_other || 0);

  const expectedTotal = 
    (sessionData.expected_cash || 0) +
    (sessionData.expected_card_debit || 0) +
    (sessionData.expected_card_credit || 0) +
    (sessionData.expected_pix || 0) +
    (sessionData.expected_other || 0);

  const snapshot: CashSessionSnapshot = {
    session_info: {
      id: sessionData.id,
      register_id: sessionData.register_id,
      opened_at: sessionData.opened_at,
      closed_at: closedAt,
      session_duration_minutes: durationMinutes,
    },
    amounts: {
      opening: sessionData.opening_amount,
      closing: {
        cash: sessionData.closing_amount_cash || 0,
        card_debit: sessionData.closing_amount_card_debit || 0,
        card_credit: sessionData.closing_amount_card_credit || 0,
        pix: sessionData.closing_amount_pix || 0,
        other: sessionData.closing_amount_other || 0,
        total: closingTotal,
      },
      expected: {
        cash: sessionData.expected_cash || 0,
        card_debit: sessionData.expected_card_debit || 0,
        card_credit: sessionData.expected_card_credit || 0,
        pix: sessionData.expected_pix || 0,
        other: sessionData.expected_other || 0,
        total: expectedTotal,
      },
      differences: {
        cash: sessionData.difference_cash || 0,
        card_debit: sessionData.difference_card_debit || 0,
        card_credit: sessionData.difference_card_credit || 0,
        pix: sessionData.difference_pix || 0,
        other: sessionData.difference_other || 0,
        total: sessionData.difference_amount || 0,
      },
    },
    statistics: {
      total_sales: sessionData.total_sales || 0,
      total_sales_amount: sessionData.total_sales_amount || 0,
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  return snapshot;
}

/**
 * Coleta informações do dispositivo para auditoria (client-side)
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'Server',
      platform: 'Server',
      language: 'pt-BR',
      screenResolution: 'N/A',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  return {
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    language: window.navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Formata o dispositivo info para string
 */
export function formatDeviceInfo(info: DeviceInfo): string {
  return JSON.stringify(info, null, 2);
}

/**
 * Gera ID único para auditoria
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cria entrada de audit trail
 */
export interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  user_id?: string;
  ip_address?: string;
  device_info?: string;
  description?: string;
  data?: any;
}

export function createAuditEntry(
  action: string,
  user: string,
  userId?: string,
  description?: string,
  data?: any
): AuditEntry {
  return {
    id: generateAuditId(),
    action,
    timestamp: new Date().toISOString(),
    user,
    user_id: userId,
    description,
    data,
  };
}

/**
 * Valida se os dados de fechamento estão completos
 */
export function validateCashClosingData(data: CashSessionData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.tenant_id) errors.push('tenant_id é obrigatório');
  if (!data.register_id) errors.push('register_id é obrigatório');
  if (!data.opened_at) errors.push('opened_at é obrigatório');
  if (!data.closed_at) errors.push('closed_at é obrigatório');
  if (data.opening_amount === undefined || data.opening_amount === null) {
    errors.push('opening_amount é obrigatório');
  }

  // Validar que pelo menos um valor de fechamento foi informado
  const hasClosingValue = 
    (data.closing_amount_cash && data.closing_amount_cash > 0) ||
    (data.closing_amount_card_debit && data.closing_amount_card_debit > 0) ||
    (data.closing_amount_card_credit && data.closing_amount_card_credit > 0) ||
    (data.closing_amount_pix && data.closing_amount_pix > 0) ||
    (data.closing_amount_other && data.closing_amount_other > 0);

  if (!hasClosingValue) {
    errors.push('Pelo menos um valor de fechamento deve ser informado');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formata relatório de fechamento para exibição
 */
export function formatClosingReport(snapshot: CashSessionSnapshot): string {
  const { session_info, amounts, statistics } = snapshot;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
═══════════════════════════════════════════════
          RELATÓRIO DE FECHAMENTO DE CAIXA
═══════════════════════════════════════════════

INFORMAÇÕES DA SESSÃO:
  Caixa: ${session_info.register_id}
  Abertura: ${formatDateTime(session_info.opened_at)}
  Fechamento: ${formatDateTime(session_info.closed_at)}
  Duração: ${session_info.session_duration_minutes} minutos

───────────────────────────────────────────────

VALORES FINANCEIROS:

  Valor Inicial: ${formatCurrency(amounts.opening)}

  DINHEIRO:
    Esperado: ${formatCurrency(amounts.expected.cash)}
    Contado:  ${formatCurrency(amounts.closing.cash)}
    Diferença: ${formatCurrency(amounts.differences.cash)}

  CARTÃO DÉBITO:
    Esperado: ${formatCurrency(amounts.expected.card_debit)}
    Contado:  ${formatCurrency(amounts.closing.card_debit)}
    Diferença: ${formatCurrency(amounts.differences.card_debit)}

  CARTÃO CRÉDITO:
    Esperado: ${formatCurrency(amounts.expected.card_credit)}
    Contado:  ${formatCurrency(amounts.closing.card_credit)}
    Diferença: ${formatCurrency(amounts.differences.card_credit)}

  PIX:
    Esperado: ${formatCurrency(amounts.expected.pix)}
    Contado:  ${formatCurrency(amounts.closing.pix)}
    Diferença: ${formatCurrency(amounts.differences.pix)}

  OUTROS:
    Esperado: ${formatCurrency(amounts.expected.other)}
    Contado:  ${formatCurrency(amounts.closing.other)}
    Diferença: ${formatCurrency(amounts.differences.other)}

───────────────────────────────────────────────

TOTAIS:
  Total Esperado: ${formatCurrency(amounts.expected.total)}
  Total Contado:  ${formatCurrency(amounts.closing.total)}
  Diferença Total: ${formatCurrency(amounts.differences.total)}

───────────────────────────────────────────────

ESTATÍSTICAS:
  Vendas Realizadas: ${statistics.total_sales}
  Faturamento Total: ${formatCurrency(statistics.total_sales_amount)}

═══════════════════════════════════════════════
  Relatório gerado em: ${formatDateTime(snapshot.timestamp)}
═══════════════════════════════════════════════
  `;
}


