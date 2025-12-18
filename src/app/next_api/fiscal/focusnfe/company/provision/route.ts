import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET = 'fiscal-certificates';

type Environment = 'homologacao' | 'producao';

function getBaseUrl(environment: Environment): string {
  return environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function requireEncryptionKey(): Buffer {
  const key = process.env.FISCAL_CERT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('FISCAL_CERT_ENCRYPTION_KEY não configurada');
  }
  return crypto.createHash('sha256').update(key).digest();
}

function decryptPassword(enc: { ciphertext_b64: string; iv_b64: string; tag_b64: string }): string {
  const key = requireEncryptionKey();
  const iv = Buffer.from(enc.iv_b64, 'base64');
  const tag = Buffer.from(enc.tag_b64, 'base64');
  const ciphertext = Buffer.from(enc.ciphertext_b64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const clear = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return clear.toString('utf8');
}

async function fetchJsonOrText(resp: Response) {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id } = body as { tenant_id?: string };

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, document, nome_fantasia, razao_social, email, phone, address, numero, complemento, bairro, city, state, zip_code, inscricao_estadual, inscricao_municipal, regime_tributario')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado', details: tenantError?.message }, { status: 404 });
    }

    const cnpj = String(tenant.document || '').replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return NextResponse.json({ error: 'Tenant sem CNPJ válido (tenants.document)' }, { status: 400 });
    }

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('environment, api_token, enabled, focus_empresa_id')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (integrationError) {
      return NextResponse.json({ error: 'Erro ao buscar integração', details: integrationError.message }, { status: 400 });
    }

    if (!integration || !integration.enabled) {
      return NextResponse.json({ error: 'Integração FocusNFe não configurada ou desabilitada' }, { status: 400 });
    }

    const { data: cert, error: certError } = await supabaseAdmin
      .from('fiscal_certificates')
      .select('storage_path, password_ciphertext_b64, password_iv_b64, password_tag_b64')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (certError) {
      return NextResponse.json({ error: 'Erro ao buscar certificado', details: certError.message }, { status: 400 });
    }

    if (!cert?.storage_path) {
      return NextResponse.json({ error: 'Nenhum certificado enviado para este tenant' }, { status: 400 });
    }

    const password = decryptPassword({
      ciphertext_b64: cert.password_ciphertext_b64,
      iv_b64: cert.password_iv_b64,
      tag_b64: cert.password_tag_b64,
    });

    const downloadRes = await supabaseAdmin.storage.from(BUCKET).download(cert.storage_path);
    if (downloadRes.error) {
      return NextResponse.json({ error: 'Erro ao baixar certificado do Storage', details: downloadRes.error.message }, { status: 400 });
    }

    const arrayBuffer = await downloadRes.data.arrayBuffer();
    const certBase64 = Buffer.from(arrayBuffer).toString('base64');

    const environment = (integration.environment as Environment) || 'homologacao';
    const baseUrl = getBaseUrl(environment);

    const payload: any = {
      nome: tenant.razao_social || tenant.nome_fantasia || tenant.name || 'Empresa',
      nome_fantasia: tenant.nome_fantasia || tenant.name || 'Empresa',
      bairro: tenant.bairro || '',
      cep: tenant.zip_code ? String(tenant.zip_code).replace(/\D/g, '') : '',
      cnpj,
      complemento: tenant.complemento || '',
      email: tenant.email || '',
      logradouro: tenant.address || '',
      numero: tenant.numero || '',
      municipio: tenant.city || '',
      uf: tenant.state || '',
      telefone: tenant.phone ? String(tenant.phone).replace(/\D/g, '') : '',

      inscricao_estadual: tenant.inscricao_estadual || null,
      inscricao_municipal: tenant.inscricao_municipal || null,

      arquivo_certificado_base64: certBase64,
      senha_certificado: password,

      habilita_nfe: true,
      habilita_nfce: true,
      habilita_nfse: true,
      habilita_nfsen_homologacao: true,
      habilita_nfsen_producao: false,
    };

    const masterToken = integration.api_token;

    const url = integration.focus_empresa_id
      ? `${baseUrl}/v2/empresas/${encodeURIComponent(String(integration.focus_empresa_id))}`
      : `${baseUrl}/v2/empresas`;

    const method = integration.focus_empresa_id ? 'PUT' : 'POST';

    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${masterToken}:`).toString('base64')}`,
      },
      body: JSON.stringify({ empresa: payload }),
    });

    const http_status = resp.status;
    const providerBody = await fetchJsonOrText(resp);

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: 'Erro ao provisionar empresa na FocusNFe',
          http_status,
          provider_error: providerBody,
        },
        { status: 400 }
      );
    }

    const focusEmpresaId = providerBody?.id;

    await supabaseAdmin
      .from('fiscal_integrations')
      .update({
        focus_empresa_id: focusEmpresaId || integration.focus_empresa_id || null,
        focus_token_homologacao: providerBody?.token_homologacao ?? null,
        focus_token_producao: providerBody?.token_producao ?? null,
        cert_valid_from: providerBody?.certificado_valido_de ?? null,
        cert_valid_to: providerBody?.certificado_valido_ate ?? null,
        cert_cnpj: providerBody?.certificado_cnpj ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe');

    return NextResponse.json({
      success: true,
      http_status,
      data: {
        focus_empresa_id: focusEmpresaId,
        token_homologacao: providerBody?.token_homologacao,
        token_producao: providerBody?.token_producao,
        certificado_valido_ate: providerBody?.certificado_valido_ate,
        certificado_cnpj: providerBody?.certificado_cnpj,
      },
      provider_response: providerBody,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500 });
  }
}
