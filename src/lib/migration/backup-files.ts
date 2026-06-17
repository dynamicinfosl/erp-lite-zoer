// Identifica os arquivos do backup do Gestão Click pelo nome (independente da subpasta).

export type BackupFileKey =
  | 'clientes'
  | 'clientes_enderecos'
  | 'produtos'
  | 'vendas'
  | 'vendas_produtos'
  | 'vendas_pagamentos'
  | 'vendas_historicos'
  | 'contas_receber'
  | 'notas_fiscais'
  | 'notas_fiscais_produtos'
  | 'notas_fiscais_pagamentos';

// A ordem importa: padrões mais específicos primeiro para não casar errado
// (ex.: "clientes_enderecos" antes de "clientes").
const PATTERNS: Array<{ key: BackupFileKey; test: (name: string) => boolean }> = [
  { key: 'clientes_enderecos', test: (n) => n.includes('clientes_enderecos') || n.includes('clientes_endereco') },
  { key: 'vendas_produtos', test: (n) => n.includes('vendas_produtos') },
  { key: 'vendas_pagamentos', test: (n) => n.includes('vendas_pagamentos') },
  { key: 'vendas_historicos', test: (n) => n.includes('vendas_historicos') || n.includes('vendas_historico') },
  { key: 'notas_fiscais_produtos', test: (n) => n.includes('notas_fiscais_produtos') },
  { key: 'notas_fiscais_pagamentos', test: (n) => n.includes('notas_fiscais_pagamentos') },
  { key: 'contas_receber', test: (n) => n.includes('contas_receber') },
  { key: 'notas_fiscais', test: (n) => n.includes('notas_fiscais') },
  { key: 'produtos', test: (n) => n.includes('produtos') },
  { key: 'clientes', test: (n) => n.includes('clientes') },
  { key: 'vendas', test: (n) => n.includes('vendas') },
];

export const BACKUP_FILE_LABELS: Record<BackupFileKey, string> = {
  clientes: 'Clientes',
  clientes_enderecos: 'Endereços dos clientes',
  produtos: 'Produtos',
  vendas: 'Vendas (pedidos)',
  vendas_produtos: 'Itens das vendas',
  vendas_pagamentos: 'Pagamentos das vendas',
  vendas_historicos: 'Históricos das vendas',
  contas_receber: 'Contas a receber',
  notas_fiscais: 'Notas fiscais',
  notas_fiscais_produtos: 'Produtos das notas fiscais',
  notas_fiscais_pagamentos: 'Pagamentos das notas fiscais',
};

/** Retorna a chave do backup correspondente ao nome do arquivo, ou null. */
export function identifyBackupFile(fileName: string): BackupFileKey | null {
  const base = fileName.toLowerCase().trim();
  if (!base.endsWith('.xlsx') && !base.endsWith('.xls') && !base.endsWith('.csv')) {
    return null;
  }
  const normalized = base
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  for (const p of PATTERNS) {
    if (p.test(normalized)) return p.key;
  }
  return null;
}
