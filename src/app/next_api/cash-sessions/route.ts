import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSuccessResponse, createErrorResponse } from "@/lib/create-response";

// Usar service_role para bypassar RLS (igual às outras rotas /next_api)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfxietcasaooenffdodr.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  // Fallback (o repo já usa esse padrão em outras rotas /next_api)
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface CashSessionQuery {
  register_id?: string;
  status?: string;
  tenant_id?: string;
  user_id?: string;
}

function isMissingColumnError(message: string, column: string) {
  const m = (message || "").toLowerCase();
  return m.includes("does not exist") && m.includes(`"${column.toLowerCase()}"`);
}

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id") || undefined;
    const userId = searchParams.get("user_id") || undefined;
    const registerId = searchParams.get("register_id") || undefined;
    const status = searchParams.get("status") || undefined;

    const run = async (opts: { includeTenantId: boolean; includeUserId: boolean }) => {
      let query = supabaseAdmin.from("cash_sessions").select("*").order("opened_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (registerId) query = query.eq("register_id", registerId);
      if (opts.includeUserId && userId) query = query.eq("user_id", userId);
      if (opts.includeTenantId && tenantId) query = query.eq("tenant_id", tenantId);

      // limitar para evitar payload enorme
      const { data, error } = await query.limit(200);
      if (error) throw new Error(error.message);
      return Array.isArray(data) ? data : [];
    };

    try {
      const rows = await run({ includeTenantId: true, includeUserId: true });
      return createSuccessResponse({ data: rows });
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      // fallback: schemas antigos podem não ter tenant_id/user_id/register_id
      if (tenantId && isMissingColumnError(msg, "tenant_id")) {
        const rows = await run({ includeTenantId: false, includeUserId: true });
        return createSuccessResponse({ data: rows });
      }
      if (userId && isMissingColumnError(msg, "user_id")) {
        const rows = await run({ includeTenantId: Boolean(tenantId), includeUserId: false });
        return createSuccessResponse({ data: rows });
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Erro ao listar sessões de caixa:", error);
    return createErrorResponse({
      errorMessage: "Erro ao listar sessões de caixa",
      status: 500,
      details: error?.message || String(error),
    });
  }
};

interface CashSessionBody {
  register_id?: string;
  opened_at: string;
  initial_amount: number;
  status?: string;
  notes?: string;
  tenant_id?: string;
  user_id?: string;
}

export const POST = async (request: NextRequest) => {
  try {
    const body: CashSessionBody = await request.json();

    if (!body.opened_at) {
      return createErrorResponse({ errorMessage: "opened_at é obrigatório", status: 400 });
    }
    if (body.initial_amount === undefined || body.initial_amount === null || Number.isNaN(Number(body.initial_amount))) {
      return createErrorResponse({ errorMessage: "initial_amount é obrigatório e deve ser número", status: 400 });
    }

    const basePayload: Record<string, unknown> = {
      opened_at: body.opened_at,
      initial_amount: Number(body.initial_amount),
      status: body.status || "open",
    };

    if (body.notes) basePayload.notes = body.notes;
    if (body.register_id) basePayload.register_id = body.register_id;
    if (body.user_id) basePayload.user_id = body.user_id;
    if (body.tenant_id) basePayload.tenant_id = body.tenant_id;

    const tryInsert = async (payload: Record<string, unknown>) => {
      const { data, error } = await supabaseAdmin
        .from("cash_sessions")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    };

    try {
      const created = await tryInsert(basePayload);
      return createSuccessResponse({ data: created }, 201);
    } catch (e: any) {
      const msg = String(e?.message || e || "");

      // fallback: schemas antigos podem não ter tenant_id/user_id/register_id/notes
      const payload = { ...basePayload };
      if (isMissingColumnError(msg, "tenant_id")) delete payload.tenant_id;
      if (isMissingColumnError(msg, "user_id")) delete payload.user_id;
      if (isMissingColumnError(msg, "register_id")) delete payload.register_id;
      if (isMissingColumnError(msg, "notes")) delete payload.notes;

      // se não mudou nada, propagar erro original
      if (JSON.stringify(payload) === JSON.stringify(basePayload)) throw e;

      const created = await tryInsert(payload);
      return createSuccessResponse({ data: created }, 201);
    }
  } catch (error: any) {
    console.error("Erro ao criar sessão de caixa:", error);
    return createErrorResponse({
      errorMessage: "Erro ao criar sessão de caixa",
      status: 500,
      details: error?.message || String(error),
    });
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return createErrorResponse({ errorMessage: "ID da sessão é obrigatório", status: 400 });

    const body = (await request.json()) as Partial<CashSessionBody> & {
      closed_at?: string;
      closing_amount?: number;
      action?: string;
    };

    const payload: Record<string, unknown> = {};
    if (body.closed_at) payload.closed_at = body.closed_at;
    if (body.closing_amount !== undefined) payload.closing_amount = Number(body.closing_amount);
    if (body.status) payload.status = body.status;
    if (body.notes !== undefined) payload.notes = body.notes;

    const { data, error } = await supabaseAdmin
      .from("cash_sessions")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      // fallback: schemas antigos podem não ter notes/closing_amount/closed_at
      const msg = error.message || "";
      const retryPayload = { ...payload };
      if (isMissingColumnError(msg, "closing_amount")) delete retryPayload.closing_amount;
      if (isMissingColumnError(msg, "closed_at")) delete retryPayload.closed_at;
      if (isMissingColumnError(msg, "notes")) delete retryPayload.notes;

      if (JSON.stringify(retryPayload) !== JSON.stringify(payload)) {
        const retry = await supabaseAdmin
          .from("cash_sessions")
          .update(retryPayload)
          .eq("id", id)
          .select("*")
          .single();
        if (retry.error) throw new Error(retry.error.message);
        return createSuccessResponse({ data: retry.data });
      }

      throw new Error(error.message);
    }

    return createSuccessResponse({ data });
  } catch (error: any) {
    console.error("Erro ao atualizar sessão de caixa:", error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar sessão de caixa",
      status: 500,
      details: error?.message || String(error),
    });
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return createErrorResponse({ errorMessage: "ID da sessão é obrigatório", status: 400 });

    const { error } = await supabaseAdmin.from("cash_sessions").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return createSuccessResponse({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir sessão de caixa:", error);
    return createErrorResponse({
      errorMessage: "Erro ao excluir sessão de caixa",
      status: 500,
      details: error?.message || String(error),
    });
  }
};


