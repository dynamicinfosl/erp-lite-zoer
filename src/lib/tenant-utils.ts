export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function getTenantContext(_token?: string | null): Promise<TenantContext> {
  return {
    tenantId: DEFAULT_TENANT_ID,
  };
}

export function applyTenantFilter<T extends Record<string, unknown>>(filters: T, tenantId: string): T {
  return {
    ...filters,
    tenant_id: tenantId,
  } as T;
}

export function ensureTenantId<T extends Record<string, unknown>>(data: T, tenantId: string): T {
  return {
    ...data,
    tenant_id: tenantId,
  } as T;
}

