import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "./create-response";
import { AUTH_CODE, ENABLE_AUTH } from "@/constants/auth";
import { verifyToken } from "./auth";
import { decodeJwt } from "jose";
import { User } from "@/types/auth";

export interface JWTPayload extends User {
  iat: number;
  exp: number;
}

export interface ApiParams {
  token: string;
  payload: JWTPayload | null;
}

function decodeBase64ToString(input: string): string {
  // Suporte a runtime Node e Edge
  try {
    const edgeAtob = (globalThis as any)?.atob as undefined | ((s: string) => string);
    if (typeof edgeAtob === "function") return edgeAtob(input);
  } catch {}
  // Node
  return Buffer.from(input, "base64").toString("utf-8");
}

function tryParseSupabaseSessionCookie(raw: string): any | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(value);
  } catch {
    // ignore
  }

  // Supabase pode armazenar como "base64-<...>"
  if (value.startsWith("base64-")) {
    const b64 = value.slice("base64-".length);
    try {
      const decoded = decodeBase64ToString(b64);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  // JSON direto
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getSupabaseCookieValue(request: NextRequest, needle: string): string | null {
  // Suporte a cookies chunked: sb-...-auth-token.0, .1, ...
  const all = request.cookies.getAll();
  const matching = all
    .filter((c) => c.name.includes("sb-") && c.name.includes(needle))
    .sort((a, b) => {
      const aM = a.name.match(/\.(\d+)$/);
      const bM = b.name.match(/\.(\d+)$/);
      const ai = aM ? parseInt(aM[1], 10) : 0;
      const bi = bM ? parseInt(bM[1], 10) : 0;
      return ai - bi;
    });

  if (matching.length === 0) return null;
  if (matching.length === 1) return matching[0].value;
  return matching.map((c) => c.value).join("");
}

function getAllSupabaseCookieGroups(request: NextRequest): Array<{ name: string; value: string }> {
  const all = request.cookies.getAll().filter((c) => c.name.startsWith("sb-"));
  // agrupar por nome base (remove .0/.1/.2...)
  const groups = new Map<string, Array<{ name: string; value: string }>>();
  for (const c of all) {
    const base = c.name.replace(/\.\d+$/, "");
    const list = groups.get(base) || [];
    list.push({ name: c.name, value: c.value });
    groups.set(base, list);
  }
  const result: Array<{ name: string; value: string }> = [];
  for (const [base, list] of groups.entries()) {
    const merged = list
      .sort((a, b) => {
        const aM = a.name.match(/\.(\d+)$/);
        const bM = b.name.match(/\.(\d+)$/);
        const ai = aM ? parseInt(aM[1], 10) : 0;
        const bi = bM ? parseInt(bM[1], 10) : 0;
        return ai - bi;
      })
      .map((p) => p.value)
      .join("");
    result.push({ name: base, value: merged });
  }
  return result;
}

function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function getAuthTokenFromRequest(request: NextRequest): { token: string | null; payload: JWTPayload | null } {
  // 1) Token do sistema (JWT próprio)
  const all = request.cookies.getAll();
  const legacy = all.find((c) => c.name === "auth-token")?.value || null;
  if (legacy) {
    // payload será preenchido por verifyToken no fluxo padrão
    return { token: legacy, payload: null };
  }

  // 2) Supabase: pode armazenar sessão JSON em cookies sb-*, às vezes chunkado
  // Primeiro tenta pelos nomes comuns, depois faz varredura em todos sb-*
  const candidates: Array<{ name: string; value: string }> = [];

  const named =
    getSupabaseCookieValue(request, "auth-token") ||
    getSupabaseCookieValue(request, "access-token") ||
    null;
  if (named) {
    candidates.push({ name: "sb-<named>", value: named });
  }
  candidates.push(...getAllSupabaseCookieGroups(request));

  let accessToken: string | null = null;
  for (const c of candidates) {
    // Alguns cookies Supabase já podem ser JWT direto
    if (typeof c.value === "string" && looksLikeJwt(c.value)) {
      accessToken = c.value;
      break;
    }

    const parsed = tryParseSupabaseSessionCookie(c.value);
    const tokenFromSession =
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null;
    if (tokenFromSession && typeof tokenFromSession === "string") {
      accessToken = tokenFromSession;
      break;
    }
  }

  if (!accessToken) return { token: null, payload: null };

  // Decodificar sem validar assinatura (o PostgREST/Supabase valida no backend)
  try {
    const decoded: any = decodeJwt(accessToken);
    const payload: JWTPayload = {
      // manter campos mínimos usados no backend
      sub: decoded?.sub || "",
      email: decoded?.email || "",
      role: decoded?.role || "user",
      isAdmin: false,
      iat: decoded?.iat || 0,
      exp: decoded?.exp || 0,
    };
    return { token: accessToken, payload };
  } catch {
    return { token: accessToken, payload: null };
  }
}

/**
 * Extracts specific cookies from a request by their names
 */
export function getCookies(request: NextRequest, names: string[]): string[] {
  const cookies = request.cookies.getAll();
  return cookies
    .filter((cookie) => names.includes(cookie.name))
    .map((cookie) => cookie.value) || []
}

/**
 * Validates that required PostgREST environment variables are set
 */
export function validateEnv(): void {
  const requiredVars = [
    "POSTGREST_URL",
    "POSTGREST_SCHEMA",
    "POSTGREST_API_KEY",
  ];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

/**
 * Parses common query parameters from a request URL
 */
export function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return {
    // Limite padrão maior para listagens
    limit: parseInt(searchParams.get("limit") || "50"),
    offset: parseInt(searchParams.get("offset") || "0"),
    id: searchParams.get("id"),
    search: searchParams.get("search"),
    tenant_id: searchParams.get("tenant_id"),
    user_id: searchParams.get("user_id"),
  };
}

/**
 * Validates and parses JSON request body with error handling
 */
export async function validateRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      throw new Error("Invalid request body");
    }

    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON in request body");
    }
    throw error;
  }
}

/**
 * Higher-order function Verify token
 */
export function requestMiddleware(
  handler: (request: NextRequest, params: ApiParams) => Promise<Response>, checkToken: boolean = true
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const params: any = {};
      if(checkToken && ENABLE_AUTH) {
        const { token, payload: preDecodedPayload } = getAuthTokenFromRequest(request);

        // Se for token legado, valida com JWT_SECRET (fluxo antigo)
        if (token && !preDecodedPayload) {
          const { code, payload } = await verifyToken(token);
          if(code === AUTH_CODE.TOKEN_EXPIRED) {
            return createErrorResponse({
              errorCode: AUTH_CODE.TOKEN_EXPIRED,
              errorMessage: "Token expired",
              status: 401,
            });
          } else if (code === AUTH_CODE.TOKEN_MISSING) {
            return createErrorResponse({
              errorCode: AUTH_CODE.TOKEN_MISSING,
              errorMessage: "Token missing",
              status: 401,
            });
          }
          params.token = token;
          params.payload = payload;
        } else if (token) {
          // Token Supabase (access_token) - payload pode ser null (não obrigamos)
          params.token = token;
          params.payload = preDecodedPayload;
        } else {
          return createErrorResponse({
            errorCode: AUTH_CODE.TOKEN_MISSING,
            errorMessage: "Token missing",
            status: 401,
          });
        }
      }
  
      return await handler(request, params);
    }
    catch (error) {
      console.error('Request middleware error:', error);
      return createErrorResponse({
        errorMessage: error instanceof Error ? error.message : "Request middleware error",
        status: 500,
      });
    }
  };
}

// response redirect
export function responseRedirect(url: string, callbackUrl?: string) {
  const redirectUrl = new URL(url);
  if(callbackUrl){
    redirectUrl.searchParams.set("redirect", callbackUrl);
  }
  return NextResponse.redirect(redirectUrl);
}

/**
 * Extracts the client IP address from various request headers
 */
export function getRequestIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") || // Cloudflare
    request.headers.get("x-client-ip") ||
    "unknown"
  );
}

/**
 * Sends a verification email with a styled HTML template containing the verification code
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  const appName = process.env.NEXT_PUBLIC_APP_Name;
  const htmlTemplate = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Email Verification</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;margin:0;padding:0;background-color:#f8fafc;color:#334155;}.container{max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);overflow:hidden;}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;}.header h1{color:#ffffff;margin:0;font-size:28px;font-weight:600;}.content{padding:40px 30px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;}.verification-code{background-color:#f1f5f9;border:2px dashed #cbd5e1;border-radius:8px;padding:20px;font-size:32px;font-weight:700;letter-spacing:4px;color:#1e293b;font-family:'Courier New',monospace;}.message{font-size:16px;line-height:1.6;}.security-note{background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:0 8px 8px 0;color:#92400e;}@media (max-width:600px){.container{margin:0 10px;border-radius:8px;}.content{gap:20px;}}</style></head><body><div class="container"><div class="header"><h1>🔐 Email Verification</h1></div><div class="content"><div class="message">Continue signing up for ${appName} by entering the code below:</div><div class="verification-code">${code}</div><div class="message">This code will expire in <strong>3 minutes</strong> for security purposes.</div><div class="security-note"><strong>Security Notice:</strong> If you didn't request this verification, please ignore this email. Never share this code with anyone.</div></div></div></body></html>`;
  
  if (process.env.RESEND_KEY) {
    const resend = new Resend(process.env.RESEND_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification Code",
      html: htmlTemplate,
    });
    return true;
  }

  const url = `${process.env.NEXT_PUBLIC_ZOER_HOST}/zapi/app/email/send`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Postgrest-API-Key": process.env.POSTGREST_API_KEY || "",
    },
    body: JSON.stringify({
      to: email,
      subject: "Email Verification Code",
      html: htmlTemplate,
    }),
  });

  return true;
}

export function setCookie(
  response: Response,
  name: string,
  value: string,
  options: {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
  } = {}
): void {
  const {
    path = "/",
    maxAge,
    httpOnly = true,
  } = options;

  const secureFlag = "Secure; ";
  const sameSite = "None";
  const httpOnlyFlag = httpOnly ? "HttpOnly; " : "";
  const maxAgeFlag = maxAge !== undefined ? `Max-Age=${maxAge}; ` : "";

  const cookieValue = `${name}=${value}; ${httpOnlyFlag}${secureFlag}SameSite=${sameSite}; ${maxAgeFlag}Path=${path}`;

  response.headers.append("Set-Cookie", cookieValue);
}

export function clearCookie(
  response: Response,
  name: string,
  path: string = "/"
): void {
  setCookie(response, name, "", { path, maxAge: 0 });
}
