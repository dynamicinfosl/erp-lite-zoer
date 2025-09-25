import { PostgrestClient } from "@supabase/postgrest-js";

const POSTGREST_URL = process.env.POSTGREST_URL || "";
const POSTGREST_SCHEMA = process.env.POSTGREST_SCHEMA || "public";
const POSTGREST_API_KEY = process.env.POSTGREST_API_KEY || ""; // anon key (public)
const POSTGREST_SERVICE_ROLE = process.env.POSTGREST_SERVICE_ROLE || ""; // service role key (bypasses RLS)

export function createPostgrestClient(userToken?: string) {
  const client = new PostgrestClient(POSTGREST_URL, {
    schema: POSTGREST_SCHEMA,
    fetch: (...args) => {
      let [url, options] = args;

      if (url instanceof URL || typeof url === "string") {
        const urlObj = url instanceof URL ? url : new URL(url);
        const columns = urlObj.searchParams.get("columns");

        if (columns && columns.includes('"')) {
          const fixedColumns = columns.replace(/"/g, "");
          urlObj.searchParams.set("columns", fixedColumns);
          url = urlObj.toString();
        }
      }

      return fetch(url, {
        ...options,
      } as RequestInit);
    },
  });

  // Headers obrigatórios para Supabase PostgREST
  client.headers.set("Content-Type", "application/json");

  // Sempre envie o header apikey (anon por padrão)
  if (POSTGREST_API_KEY) {
    client.headers.set("apikey", POSTGREST_API_KEY);
  }

  // Defina o Authorization com a melhor credencial disponível:
  // 1) userToken (JWT do usuário autenticado)
  // 2) SERVICE_ROLE (bypassa RLS para operações do servidor)
  // 3) ANON key como fallback (algumas tabelas públicas sem RLS)
  const authorizationToken = userToken || POSTGREST_SERVICE_ROLE || POSTGREST_API_KEY;
  if (authorizationToken) {
    client.headers.set("Authorization", `Bearer ${authorizationToken}`);
  }

  return client;
}
