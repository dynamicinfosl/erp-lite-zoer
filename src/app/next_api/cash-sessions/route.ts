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

interface CashSessionBody {
  register_id?: string;
  opened_at: string;
  initial_amount: number;
  opened_by?: string; // Nome/email de quem abriu (obrigatório no banco)
  status?: string;
  notes?: string;
  tenant_id?: string;
  user_id?: string;
}

function isMissingColumnError(message: string, column: string) {
  const m = (message || "").toLowerCase();
  const col = column.toLowerCase();
  return (
    (m.includes("does not exist") || m.includes("could not find") || m.includes("schema cache")) &&
    (m.includes(`"${col}"`) || m.includes(`'${col}'`))
  );
}

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id") || undefined;
    const userId = searchParams.get("user_id") || undefined;
    const registerId = searchParams.get("register_id") || undefined;
    const status = searchParams.get("status") || undefined;

    const run = async (opts: { includeTenantId: boolean; includeUserId: boolean }) => {
      let query = supabaseAdmin
        .from("cash_sessions")
        .select("*")
        .order("opened_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (registerId) query = query.eq("register_id", registerId);
      if (opts.includeUserId && userId) query = query.eq("user_id", userId);
      if (opts.includeTenantId && tenantId) query = query.eq("tenant_id", tenantId);

      const { data, error } = await query.limit(200);
      if (error) throw new Error(error.message);
      return Array.isArray(data) ? data : [];
    };

    const noCacheHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache" };
    try {
      const rows = await run({ includeTenantId: true, includeUserId: true });
      return new Response(JSON.stringify({ success: true, data: rows }), { status: 200, headers: noCacheHeaders });
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      // fallback: schemas antigos podem não ter tenant_id/user_id
      if (tenantId && isMissingColumnError(msg, "tenant_id")) {
        const rows = await run({ includeTenantId: false, includeUserId: true });
        return new Response(JSON.stringify({ success: true, data: rows }), { status: 200, headers: noCacheHeaders });
      }
      if (userId && isMissingColumnError(msg, "user_id")) {
        const rows = await run({ includeTenantId: Boolean(tenantId), includeUserId: false });
        return new Response(JSON.stringify({ success: true, data: rows }), { status: 200, headers: noCacheHeaders });
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

export const POST = async (request: NextRequest) => {
  try {
    const body: CashSessionBody = await request.json();

    if (!body.opened_at) {
      return createErrorResponse({ errorMessage: "opened_at é obrigatório", status: 400 });
    }
    if (body.initial_amount === undefined || body.initial_amount === null || Number.isNaN(Number(body.initial_amount))) {
      return createErrorResponse({ errorMessage: "initial_amount é obrigatório e deve ser número", status: 400 });
    }

    // Banco usa opening_amount (não initial_amount); aceitamos initial_amount no body
    const valorInicial = Number(body.initial_amount);
    const openedBy = body.opened_by?.trim() || "Operador";
    const basePayload: Record<string, unknown> = {
      opened_at: body.opened_at,
      opening_amount: valorInicial,
      opened_by: openedBy,
      status: body.status || "open",
    };

    if (body.notes) basePayload.notes = body.notes;
    if (body.register_id) basePayload.register_id = body.register_id;
    if (body.user_id) basePayload.user_id = body.user_id;
    if (body.tenant_id) basePayload.tenant_id = body.tenant_id;

    // Não permitir mais de um caixa aberto por usuário: verificar antes de inserir
    if (body.user_id) {
      const { data: existingOpen } = await supabaseAdmin
        .from("cash_sessions")
        .select("id")
        .eq("user_id", body.user_id)
        .eq("status", "open")
        .limit(1)
        .maybeSingle();
      if (existingOpen) {
        return createErrorResponse({
          errorMessage: "Já existe um caixa aberto para este usuário. Feche-o na página de Caixas antes de abrir outro.",
          status: 400,
        });
      }
    }

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
      return createSuccessResponse(created, 201);
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      const payload = { ...basePayload };

      // fallback: schemas antigos podem não ter tenant_id/user_id/register_id/notes
      if (isMissingColumnError(msg, "tenant_id")) delete payload.tenant_id;
      if (isMissingColumnError(msg, "user_id")) delete payload.user_id;
      if (isMissingColumnError(msg, "register_id")) delete payload.register_id;
      if (isMissingColumnError(msg, "notes")) delete payload.notes;
      // fallback: alguns schemas usam opening_amount em vez de initial_amount
      if (isMissingColumnError(msg, "initial_amount")) {
        // tentar gravar como opening_amount
        (payload as any).opening_amount = (payload as any).initial_amount;
        delete (payload as any).initial_amount;
      }

      if (JSON.stringify(payload) === JSON.stringify(basePayload)) throw e;

      const created = await tryInsert(payload);
      return createSuccessResponse(created, 201);
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

// Campos permitidos no PATCH (fechamento) – só repassar estes para o update
const PATCH_ALLOWED_KEYS = [
  "status", "closed_at", "closed_by", "notes",
  "closing_amount", "closing_amount_cash", "closing_amount_card_debit",
  "closing_amount_card_credit", "closing_amount_pix", "closing_amount_other",
  "expected_cash", "expected_card_debit", "expected_card_credit", "expected_pix", "expected_other",
  "difference_amount", "difference_cash", "difference_card_debit", "difference_card_credit",
  "difference_pix", "difference_other", "difference_reason",
  "total_sales", "total_sales_amount", "total_withdrawals", "total_withdrawals_amount",
  "total_supplies", "total_supplies_amount", "total_refunds", "total_refunds_amount",
  "device_info", "closed_by_user_id",
];

function buildPatchPayload(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const stringKeys = new Set(["status", "closed_at", "closed_by", "notes", "difference_reason", "device_info"]);
  for (const key of PATCH_ALLOWED_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === undefined) continue;
    if (stringKeys.has(key) && typeof v === "string") payload[key] = v;
    else if (key === "closed_by_user_id" && (typeof v === "string" || v === null)) payload[key] = v;
    else if (typeof v === "number" && !Number.isNaN(v)) payload[key] = v;
    else if (typeof v === "string" && !stringKeys.has(key) && key !== "closed_by_user_id") {
      const n = Number(v);
      if (!Number.isNaN(n)) payload[key] = n;
    }
  }
  return payload;
}

export const PATCH = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) return createErrorResponse({ errorMessage: "ID da sessão é obrigatório", status: 400 });
    const id = /^\d+$/.test(String(idParam).trim()) ? Number(idParam) : idParam.trim();

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return createErrorResponse({ errorMessage: "Body JSON inválido", status: 400 });
    }

    const payload = buildPatchPayload(body);
    if (!payload.status && !payload.closed_at && !payload.closed_by && Object.keys(payload).length === 0) {
      return createErrorResponse({ errorMessage: "Envie ao menos status e/ou closed_at para fechar o caixa", status: 400 });
    }
    // Garantir fechamento: se vier status 'closed', incluir closed_at se não vier
    if (payload.status === "closed" && !payload.closed_at) payload.closed_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("cash_sessions")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      const msg = error.message || "";
      const retryPayload = { ...payload };
      PATCH_ALLOWED_KEYS.forEach((key) => {
        if (isMissingColumnError(msg, key)) delete retryPayload[key];
      });
      if (Object.keys(retryPayload).length === 0) {
        return createErrorResponse({ errorMessage: "Nenhum campo de fechamento existe na tabela cash_sessions. Execute o script SQL da tabela.", status: 400, details: msg });
      }
      if (JSON.stringify(retryPayload) !== JSON.stringify(payload)) {
        const retry = await supabaseAdmin
          .from("cash_sessions")
          .update(retryPayload)
          .eq("id", id)
          .select("*")
          .single();
        if (retry.error) throw new Error(retry.error.message);
        if (!retry.data) return createErrorResponse({ errorMessage: "Sessão não encontrada", status: 404 });
        return createSuccessResponse(retry.data);
      }
      throw new Error(error.message);
    }

    if (!data) return createErrorResponse({ errorMessage: "Sessão não encontrada", status: 404 });
    return createSuccessResponse(data);
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

