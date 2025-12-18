import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET = 'fiscal-certificates';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function requireEncryptionKey(): Buffer {
  const key = process.env.FISCAL_CERT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('FISCAL_CERT_ENCRYPTION_KEY não configurada');
  }
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
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseClient();
    } catch (envError: any) {
      console.error('Erro ao configurar Supabase:', envError);
      return NextResponse.json({ 
        error: 'Configuração do servidor incompleta', 
        details: envError?.message || 'Variáveis de ambiente do Supabase não configuradas' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400 });
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
      return NextResponse.json({ error: 'Erro ao buscar certificado', details: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (error: any) {
    console.error('Erro interno na rota GET certificate:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseClient();
    } catch (envError: any) {
      console.error('Erro ao configurar Supabase:', envError);
      return NextResponse.json({ 
        error: 'Configuração do servidor incompleta', 
        details: envError?.message || 'Variáveis de ambiente do Supabase não configuradas' 
      }, { status: 500 });
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
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500 });
  }
}
