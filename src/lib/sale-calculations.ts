/**
 * Helpers de cálculo de venda / item.
 * Padroniza desconto, subtotal e custo histórico.
 */

export type DiscountMode = 'percent' | 'amount' | 'auto';

export interface RawSaleProduct {
  id?: number | string | null;
  product_id?: number | string | null;
  name?: string;
  product_name?: string;
  price?: number | string;
  unit_price?: number | string;
  quantity?: number | string;
  discount?: number | string;
  discount_type?: 'percent' | 'amount' | string;
  /** Subtotal líquido já calculado no cliente — tem prioridade */
  subtotal?: number | string | null;
  cost_price?: number | string | null;
  unit_cost?: number | string | null;
  variant_id?: number | string | null;
  price_type_id?: number | string | null;
  code?: string;
  product_code?: string;
}

export interface ResolvedSaleItem {
  productId: number | null;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Desconto em R$ no item */
  discountAmount: number;
  /** Desconto em % no item */
  discountPercentage: number;
  /** Valor líquido do item */
  subtotal: number;
  /** Custo unitário histórico */
  costPrice: number;
  variantId: number | null;
  priceTypeId: number | null;
  productCode: string | null;
}

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Resolve linha de item.
 * Prioridade do subtotal:
 * 1) subtotal enviado pelo cliente (fonte da verdade da UI)
 * 2) discount_type / discountMode explícito
 * 3) sale_source === 'pdv' → % ; demais → R$ absoluto
 */
export function resolveSaleItem(
  product: RawSaleProduct,
  opts?: { discountMode?: DiscountMode; saleSource?: string | null; fallbackCost?: number }
): ResolvedSaleItem {
  const unitPrice = toNum(product.price ?? product.unit_price);
  const quantity = toNum(product.quantity);
  const gross = unitPrice * quantity;
  const discountRaw = toNum(product.discount);
  const clientSubtotal =
    product.subtotal !== undefined && product.subtotal !== null && product.subtotal !== ''
      ? toNum(product.subtotal)
      : null;

  let mode: DiscountMode = opts?.discountMode || 'auto';
  if (mode === 'auto') {
    if (product.discount_type === 'percent') mode = 'percent';
    else if (product.discount_type === 'amount') mode = 'amount';
    else if ((opts?.saleSource || '').toLowerCase() === 'pdv') mode = 'percent';
    else mode = 'amount';
  }

  let subtotal: number;
  let discountAmount: number;
  let discountPercentage: number;

  if (clientSubtotal !== null && Number.isFinite(clientSubtotal)) {
    subtotal = Math.max(0, clientSubtotal);
    discountAmount = Math.max(0, Number((gross - subtotal).toFixed(4)));
    discountPercentage = gross > 0 ? Number(((discountAmount / gross) * 100).toFixed(4)) : 0;
  } else if (mode === 'percent') {
    discountPercentage = Math.min(100, Math.max(0, discountRaw));
    discountAmount = Number(((gross * discountPercentage) / 100).toFixed(4));
    subtotal = Math.max(0, Number((gross - discountAmount).toFixed(4)));
  } else {
    discountAmount = Math.max(0, discountRaw);
    discountPercentage = gross > 0 ? Number(((discountAmount / gross) * 100).toFixed(4)) : 0;
    subtotal = Math.max(0, Number((gross - discountAmount).toFixed(4)));
  }

  const costPrice = toNum(
    product.cost_price ?? product.unit_cost ?? opts?.fallbackCost,
    0
  );

  const rawId = product.id ?? product.product_id;
  const productId =
    rawId !== null && rawId !== undefined && String(rawId).trim() !== ''
      ? Number(rawId)
      : null;

  return {
    productId: productId !== null && Number.isFinite(productId) && productId > 0 ? productId : null,
    name: String(product.name || product.product_name || 'Produto').trim() || 'Produto',
    unitPrice,
    quantity,
    discountAmount,
    discountPercentage,
    subtotal,
    costPrice,
    variantId:
      product.variant_id !== null && product.variant_id !== undefined
        ? Number(product.variant_id)
        : null,
    priceTypeId:
      product.price_type_id !== null && product.price_type_id !== undefined
        ? Number(product.price_type_id)
        : null,
    productCode: product.code || product.product_code || null,
  };
}

/** Monta payload para insert em sale_items */
export function toSaleItemInsert(
  resolved: ResolvedSaleItem,
  meta: { saleId: number | string; tenantId: string; userId: string; createdAt?: string }
) {
  const row: Record<string, unknown> = {
    sale_id: meta.saleId,
    tenant_id: meta.tenantId,
    user_id: meta.userId,
    product_name: resolved.name,
    unit_price: resolved.unitPrice,
    quantity: resolved.quantity,
    discount_percentage: resolved.discountPercentage,
    subtotal: resolved.subtotal,
    total_price: resolved.subtotal,
    cost_price: resolved.costPrice,
  };

  if (meta.createdAt) row.created_at = meta.createdAt;
  if (resolved.productId) row.product_id = resolved.productId;
  if (resolved.variantId) row.variant_id = resolved.variantId;
  if (resolved.priceTypeId) row.price_type_id = resolved.priceTypeId;
  if (resolved.productCode) row.product_code = resolved.productCode;

  return row;
}

/**
 * Custo unitário efetivo do item: histórico (sale_items.cost_price) com fallback no produto.
 */
export function effectiveUnitCost(
  itemCostPrice: number | null | undefined,
  productCostPrice: number | null | undefined
): number {
  const historical = toNum(itemCostPrice, NaN);
  if (Number.isFinite(historical) && historical >= 0) {
    // 0 pode ser custo real; só cai no produto se historical for NaN
    // Mas backfill antigo usa 0 quando não tinha custo — preferir produto se historical === 0 e produto > 0
    if (historical > 0) return historical;
    const fallback = toNum(productCostPrice, 0);
    return fallback > 0 ? fallback : 0;
  }
  return toNum(productCostPrice, 0);
}
