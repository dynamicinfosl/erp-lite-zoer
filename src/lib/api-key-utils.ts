// Utilitários para geração e validação de API Keys
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Gera uma nova API key aleatória
 * Formato: erp_live_<32 caracteres aleatórios base64url>
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  const randomPart = randomBytes.toString('base64url');
  return `erp_live_${randomPart}`;
}

/**
 * Gera hash SHA-256 de uma API key para armazenamento
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verifica se uma API key é válida (existe, ativa, não expirada)
 * Retorna o registro da key se válida, null caso contrário
 */
export async function verifyApiKey(key: string): Promise<{
  id: string;
  tenant_id: string;
  permissions: string[];
  name: string;
} | null> {
  if (!key || !key.startsWith('erp_live_')) {
    return null;
  }

  const keyHash = hashApiKey(key);

  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, tenant_id, permissions, name, is_active, expires_at, last_used_at')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      console.error('❌ Erro ao verificar API key:', error);
      return null;
    }

    // Verificar se expirou
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (expiresAt < now) {
        console.warn('⚠️ API key expirada:', data.id);
        return null;
      }
    }

    // Atualizar last_used_at (async, não bloqueia)
    Promise.resolve(
      supabaseAdmin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id)
    )
      .then(() => {
        // Sucesso silencioso
      })
      .catch((err) => {
        console.warn('⚠️ Erro ao atualizar last_used_at:', err);
      });

    return {
      id: data.id,
      tenant_id: data.tenant_id,
      permissions: (data.permissions as string[]) || [],
      name: data.name,
    };
  } catch (error) {
    console.error('❌ Erro ao verificar API key:', error);
    return null;
  }
}

/**
 * Verifica se uma API key tem uma permissão específica
 */
export async function checkApiKeyPermission(
  key: string,
  permission: string
): Promise<boolean> {
  const keyData = await verifyApiKey(key);
  if (!keyData) {
    return false;
  }

  // Se não tem permissões definidas (array vazio), permite tudo
  if (keyData.permissions.length === 0) {
    return true;
  }

  // Verificar permissão específica ou wildcard
  return (
    keyData.permissions.includes(permission) ||
    keyData.permissions.includes('*') ||
    keyData.permissions.includes(`${permission.split(':')[0]}:*`)
  );
}
