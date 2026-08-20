import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Headers JSON padrão
const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET = 'fiscal-certificates';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function requireEncryptionKey(): Buffer {
  const key = process.env.FISCAL_CERT_ENCRYPTION_KEY || 'SkhGQThlM3I5MTh5ZGFza2pqMTJoM2JoMWpoMnBvMzR1MTJvaDI=';
  // Derivar 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

function encryptPassword(password: string) {
  const key = requireEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv_b64: iv.toString('base64'),
    tag_b64: tag.toString('base64'),
    ciphertext_b64: ciphertext.toString('base64'),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
          details: 'Variáveis de ambiente do Supabase não configuradas' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawTenantId = searchParams.get('tenant_id');
    const tenant_id = rawTenantId ? rawTenantId.trim() : '';

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ success: true, data: null }, { headers: jsonHeaders });
    }

    const { data, error } = await supabaseAdmin
      .from('fiscal_certificates')
      .select(
        'id, tenant_id, provider, storage_path, original_filename, content_type, size_bytes, status, cert_valid_from, cert_valid_to, cert_cnpj, created_at, updated_at'
      )
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar certificado:', error);
      return NextResponse.json({ success: true, data: null }, { headers: jsonHeaders });
    }

    return NextResponse.json({ success: true, data: data || null }, { headers: jsonHeaders });
  } catch (error: any) {
    console.error('Erro interno na rota GET certificate:', error);
    return NextResponse.json({ 
      success: true,
      data: null,
      error_logged: error?.message || 'Erro desconhecido' 
    }, { headers: jsonHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
          details: 'Variáveis de ambiente do Supabase não configuradas' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }
    
    const form = await request.formData();
    const tenant_id = String(form.get('tenant_id') || '');
    const password = String(form.get('password') || '');
    const file = form.get('file');

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'password é obrigatória' }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file é obrigatório' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pfx', 'p12'].includes(ext)) {
      return NextResponse.json({ error: 'Envie um certificado .pfx ou .p12' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const path = `${tenant_id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const uploadRes = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type || 'application/x-pkcs12', upsert: true });

    if (uploadRes.error) {
      return NextResponse.json({ error: 'Erro ao salvar arquivo no Storage', details: uploadRes.error.message }, { status: 400 });
    }

    const enc = encryptPassword(password);

    const { data, error } = await supabaseAdmin
      .from('fiscal_certificates')
      .insert({
        tenant_id,
        provider: 'focusnfe',
        storage_bucket: BUCKET,
        storage_path: path,
        original_filename: file.name,
        content_type: file.type || null,
        size_bytes: bytes.byteLength,
        password_ciphertext_b64: enc.ciphertext_b64,
        password_iv_b64: enc.iv_b64,
        password_tag_b64: enc.tag_b64,
        status: 'uploaded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        'id, tenant_id, provider, storage_path, original_filename, content_type, size_bytes, status, created_at, updated_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao registrar certificado', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Erro na rota POST certificate:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
          details: 'Variáveis de ambiente do Supabase não configuradas' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    let tenant_id = searchParams.get('tenant_id');
    let certificate_id = searchParams.get('id');

    // Tentar ler do body caso não venha na URL
    if (!tenant_id) {
      try {
        const body = await request.json();
        tenant_id = body?.tenant_id;
        certificate_id = body?.id || certificate_id;
      } catch {
        // Body vazio, prosseguir com searchParams
      }
    }

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    // 1. Buscar os certificados para deletar do Storage
    let query = supabaseAdmin
      .from('fiscal_certificates')
      .select('id, storage_path')
      .eq('tenant_id', tenant_id);

    if (certificate_id && isUuid(certificate_id)) {
      query = query.eq('id', certificate_id);
    }

    const { data: certs, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: 'Erro ao buscar certificados para exclusão', details: fetchError.message }, { status: 400, headers: jsonHeaders });
    }

    // 2. Deletar arquivos do Storage
    if (certs && certs.length > 0) {
      const pathsToDelete = certs.map((c) => c.storage_path).filter(Boolean);
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove(pathsToDelete);
        if (storageError) {
          console.warn('Aviso: falha ao remover arquivos do Storage:', storageError.message);
        }
      }
    }

    // 3. Deletar registros do banco de dados
    let deleteQuery = supabaseAdmin
      .from('fiscal_certificates')
      .delete()
      .eq('tenant_id', tenant_id);

    if (certificate_id && isUuid(certificate_id)) {
      deleteQuery = deleteQuery.eq('id', certificate_id);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao excluir certificado do banco', details: deleteError.message }, { status: 400, headers: jsonHeaders });
    }

    return NextResponse.json({
      success: true,
      message: 'Certificado(s) excluído(s) com sucesso',
      deleted_count: certs?.length || 0,
    }, { headers: jsonHeaders });
  } catch (error: any) {
    console.error('❌ Erro na rota DELETE certificate:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500, headers: jsonHeaders });
  }
}

