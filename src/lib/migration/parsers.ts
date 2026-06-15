// Helpers compartilhados para a migração de backup do sistema antigo (Gestão Click).
// Usados tanto na página /migrar (parse client-side) quanto no endpoint de gravação.

/** Converte um valor monetário no formato brasileiro (1.234,56) para número. */
export function parseBrazilianPrice(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const str = String(value).trim();
  if (!str) return 0;

  // Remove tudo exceto dígitos, vírgula, ponto e sinal
  const clean = str.replace(/[^\d.,-]/g, '');
  if (!clean) return 0;

  if (clean.includes(',')) {
    if (clean.includes('.')) {
      // ponto = milhar, vírgula = decimal
      const parts = clean.split(',');
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1] || '00';
      const n = parseFloat(`${integerPart}.${decimalPart}`);
      return Number.isFinite(n) ? n : 0;
    }
    const n = parseFloat(clean.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converte data do formato legado brasileiro para ISO 8601 preservando hora.
 * Aceita: "dd/mm/yyyy", "dd/mm/yyyy HH:mm:ss", "dd/mm/yyyy HH:mm".
 * Assume fuso de Brasília (-03:00) para preservar data/hora como no sistema antigo.
 * Retorna null se não conseguir parsear.
 */
export function parseBrazilianDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  // Datas já em ISO ou objetos Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  const str = String(value).trim();
  if (!str) return null;

  const m = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!m) {
    // tentar ISO direto
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = m;
  const pad = (s: string, len = 2) => s.padStart(len, '0');
  const iso = `${yyyy}-${pad(mm)}-${pad(dd)}T${pad(hh)}:${pad(min)}:${pad(ss)}-03:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Mantém apenas dígitos (para CPF/CNPJ/CEP/telefone). */
export function onlyDigits(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
}

/** Normaliza texto para comparação (sem acento, minúsculo, espaços colapsados). */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Interpreta "Sim"/"Não"/"1"/"0"/true como booleano (default true). */
export function parseBoolean(value: unknown, defaultValue = true): boolean {
  if (value === null || value === undefined || value === '') return defaultValue;
  const s = normalizeText(value);
  if (['sim', 's', 'true', '1', 'ativo', 'yes'].includes(s)) return true;
  if (['nao', 'n', 'false', '0', 'inativo', 'no'].includes(s)) return false;
  return defaultValue;
}

export function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/** Mapeia nome completo do estado para UF de 2 caracteres, ou slice. */
export function parseState(value: unknown): string | null {
  const s = normalizeText(value);
  if (!s) return null;

  const mapping: Record<string, string> = {
    'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM',
    'bahia': 'BA', 'ceara': 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES',
    'goias': 'GO', 'maranhao': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
    'minas gerais': 'MG', 'para': 'PA', 'paraiba': 'PB', 'parana': 'PR',
    'pernambuco': 'PE', 'piaui': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
    'rio grande do sul': 'RS', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
    'sao paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'
  };

  if (mapping[s]) return mapping[s];

  // Se já for UF de 2 letras
  const clean = String(value).trim().toUpperCase();
  if (clean.length === 2) return clean;

  return clean.slice(0, 2);
}


/**
 * Mapeia a forma de pagamento legada para os valores aceitos pela constraint
 * de sales.payment_method: dinheiro | pix | cartao_debito | cartao_credito | fiado.
 */
export function mapPaymentMethod(value: unknown): 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado' {
  const s = normalizeText(value);
  if (!s) return 'dinheiro';
  if (s.includes('pix')) return 'pix';
  if (s.includes('debito')) return 'cartao_debito';
  if (s.includes('credito')) return 'cartao_credito';
  if (s.includes('cartao') || s.includes('card')) return 'cartao_credito';
  if (
    s.includes('fiado') ||
    s.includes('prazo') ||
    s.includes('boleto') ||
    s.includes('crediario') ||
    s.includes('duplicata') ||
    s.includes('promissoria')
  ) {
    return 'fiado';
  }
  if (s.includes('dinheiro') || s.includes('especie') || s.includes('a vista') || s.includes('avista')) {
    return 'dinheiro';
  }
  return 'dinheiro';
}
