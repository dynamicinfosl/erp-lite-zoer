// Identifica os arquivos do backup do Gestão Click pelo nome (independente da subpasta).
//
// IMPORTANTE: o backup vem particionado — `vendas_1.xlsx` … `vendas_78.xlsx`,
// `contas_receber_1.xlsx` … `contas_receber_84.xlsx`, etc. Todas as partes de uma
// mesma categoria precisam ser somadas, nunca sobrescritas.
//
// A identificação é por nome EXATO (após normalizar e remover o sufixo de partição),
// e não por `includes()`. Casar por substring fazia `clientes_contatos.xlsx` ser lido
// como a lista de clientes, `compras_produtos.xlsx` como o catálogo de produtos e
// `vendas_servicos.xlsx` como as vendas — cada um sobrescrevendo o arquivo real.

export type BackupFileKey =
  | 'clientes'
  | 'clientes_enderecos'
  | 'clientes_contatos'
  | 'produtos'
  | 'vendas'
  | 'vendas_produtos'
  | 'vendas_pagamentos'
  | 'vendas_historicos'
  | 'vendas_servicos'
  | 'contas_receber'
  | 'contas_pagar'
  | 'compras'
  | 'compras_produtos'
  | 'compras_pagamentos'
  | 'compras_historicos'
  | 'notas_fiscais'
  | 'notas_fiscais_produtos'
  | 'notas_fiscais_pagamentos';

/** Nome-base normalizado -> chave. Inclui variações de grafia do exportador. */
const NAME_TO_KEY: Record<string, BackupFileKey> = {
  clientes: 'clientes',
  cliente: 'clientes',
  clientes_enderecos: 'clientes_enderecos',
  clientes_endereco: 'clientes_enderecos',
  clientes_contatos: 'clientes_contatos',
  clientes_contato: 'clientes_contatos',

  produtos: 'produtos',
  produto: 'produtos',

  vendas: 'vendas',
  venda: 'vendas',
  vendas_produtos: 'vendas_produtos',
  vendas_produto: 'vendas_produtos',
  vendas_pagamentos: 'vendas_pagamentos',
  vendas_pagamento: 'vendas_pagamentos',
  vendas_historicos: 'vendas_historicos',
  vendas_historico: 'vendas_historicos',
  vendas_servicos: 'vendas_servicos',
  vendas_servico: 'vendas_servicos',

  contas_receber: 'contas_receber',
  conta_receber: 'contas_receber',
  contas_a_receber: 'contas_receber',
  contas_pagar: 'contas_pagar',
  conta_pagar: 'contas_pagar',
  contas_a_pagar: 'contas_pagar',

  compras: 'compras',
  compra: 'compras',
  compras_produtos: 'compras_produtos',
  compras_pagamentos: 'compras_pagamentos',
  compras_historicos: 'compras_historicos',

  notas_fiscais: 'notas_fiscais',
  nota_fiscal: 'notas_fiscais',
  notas_fiscais_produtos: 'notas_fiscais_produtos',
  notas_fiscais_pagamentos: 'notas_fiscais_pagamentos',
};

export const BACKUP_FILE_LABELS: Record<BackupFileKey, string> = {
  clientes: 'Clientes',
  clientes_enderecos: 'Endereços dos clientes',
  clientes_contatos: 'Contatos dos clientes',
  produtos: 'Produtos',
  vendas: 'Vendas (pedidos)',
  vendas_produtos: 'Itens das vendas',
  vendas_pagamentos: 'Pagamentos das vendas',
  vendas_historicos: 'Históricos das vendas',
  vendas_servicos: 'Serviços das vendas',
  contas_receber: 'Contas a receber',
  contas_pagar: 'Contas a pagar',
  compras: 'Compras',
  compras_produtos: 'Itens das compras',
  compras_pagamentos: 'Pagamentos das compras',
  compras_historicos: 'Históricos das compras',
  notas_fiscais: 'Notas fiscais',
  notas_fiscais_produtos: 'Produtos das notas fiscais',
  notas_fiscais_pagamentos: 'Pagamentos das notas fiscais',
};

/**
 * Chaves que o importador realmente grava no banco.
 * As demais são reconhecidas apenas para não serem confundidas com outra categoria
 * (não existem tabelas de compras/fornecedores neste ERP).
 */
export const IMPORTED_KEYS: BackupFileKey[] = [
  'clientes',
  'clientes_enderecos',
  'produtos',
  'vendas',
  'vendas_produtos',
  'vendas_pagamentos',
  'vendas_historicos',
  'contas_receber',
  'contas_pagar',
  'notas_fiscais',
  'notas_fiscais_produtos',
  'notas_fiscais_pagamentos',
];

/** Ordem de exibição na tela de migração. */
export const DISPLAY_KEYS: BackupFileKey[] = [
  'clientes',
  'clientes_enderecos',
  'produtos',
  'vendas',
  'vendas_produtos',
  'vendas_pagamentos',
  'vendas_historicos',
  'contas_receber',
  'contas_pagar',
  'notas_fiscais',
  'notas_fiscais_produtos',
  'notas_fiscais_pagamentos',
  'vendas_servicos',
  'clientes_contatos',
  'compras',
  'compras_produtos',
  'compras_pagamentos',
  'compras_historicos',
];

/**
 * Reduz o nome do arquivo ao nome-base da categoria:
 * "vendas/Vendas_Produtos_12.xlsx" -> "vendas_produtos"
 * "Contas a Receber - 3.xlsx"      -> "contas_receber"
 */
export function normalizeBackupFileName(fileName: string): string | null {
  const withoutPath = String(fileName).split(/[\\/]/).pop() || '';
  const lower = withoutPath.toLowerCase().trim();
  if (!/\.(xlsx|xls|csv)$/.test(lower)) return null;

  return lower
    .replace(/\.(xlsx|xls|csv)$/, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    // "arquivo (1)" / "arquivo - copia" gerados por download duplicado
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/[\s.-]*(copia|copy)\s*$/, '')
    // separadores variados viram "_"
    .replace(/[\s.-]+/g, '_')
    // sufixo(s) de partição: _1, _12, _2_3 ...
    .replace(/(?:_\d+)+$/, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Retorna a chave do backup correspondente ao nome do arquivo, ou null. */
export function identifyBackupFile(fileName: string): BackupFileKey | null {
  const base = normalizeBackupFileName(fileName);
  if (!base) return null;
  return NAME_TO_KEY[base] ?? null;
}
