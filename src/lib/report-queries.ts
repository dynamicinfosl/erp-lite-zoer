// Helpers de leitura para os relatórios.
//
// O PostgREST devolve no máximo 1000 linhas por requisição e não avisa quando
// corta. Com volume real (a migração do Gestão Click traz mais de 150 mil vendas)
// os relatórios passavam a somar apenas as primeiras 1000 vendas do período —
// agosto/2023 aparecia com R$ 820 mil em vez dos R$ 3,4 milhões reais.
//
// Além disso, um `.in('sale_id', [...])` com mil ids gera uma URL enorme que o
// PostgREST rejeita; o erro era descartado e custo/lucro/desconto zeravam.

const PAGE_SIZE = 1000;
/** Quantos ids por `.in(...)` — mantém a URL curta o suficiente. */
const IN_CHUNK = 200;

/**
 * Percorre todas as páginas de uma consulta.
 *
 * A consulta precisa ter uma ordenação determinística (inclua `.order('id')`),
 * caso contrário as páginas podem repetir ou pular linhas.
 */
export async function fetchAllPaged<T = any>(query: any, pageSize = PAGE_SIZE): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

/**
 * Executa uma consulta com `.in(coluna, ids)` quebrando os ids em lotes,
 * paginando cada lote e concatenando o resultado.
 */
export async function fetchAllByIds<T = any>(
  makeQuery: (ids: any[]) => any,
  ids: any[],
  chunkSize = IN_CHUNK
): Promise<T[]> {
  const unique = [...new Set(ids.filter((v) => v !== null && v !== undefined))];
  const out: T[] = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const rows = await fetchAllPaged<T>(makeQuery(unique.slice(i, i + chunkSize)));
    out.push(...rows);
  }
  return out;
}
