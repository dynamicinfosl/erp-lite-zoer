import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Função para obter o cliente Supabase (com fallback)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

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
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500, headers: jsonHeaders }
      );
    }
    
    const body = await request.json();
    const { tenant_id } = body as { tenant_id?: string };

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, document, nome_fantasia, razao_social, email, phone, address, numero, complemento, bairro, city, state, zip_code, inscricao_estadual, inscricao_municipal, regime_tributario')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado', details: tenantError?.message }, { status: 404, headers: jsonHeaders });
    }

    const cnpj = String(tenant.document || '').replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return NextResponse.json({ error: 'Tenant sem CNPJ válido (tenants.document)' }, { status: 400, headers: jsonHeaders });
    }

    // 1. Buscar a configuração global de integração (api_token e environment)
    const { data: globalConfig, error: globalError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('environment, api_token, enabled')
      .eq('tenant_id', '00000000-0000-0000-0000-000000000000')
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (globalError) {
      return NextResponse.json({ error: 'Erro ao buscar configuração global', details: globalError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!globalConfig || !globalConfig.enabled || !globalConfig.api_token) {
      return NextResponse.json({ error: 'Emissão fiscal global não está ativada ou credenciais do ERP ausentes.' }, { status: 400, headers: jsonHeaders });
    }

    // 2. Buscar integração específica do tenant (para obter focus_empresa_id se já existir)
    const { data: integration } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('focus_empresa_id')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    const { data: cert, error: certError } = await supabaseAdmin
      .from('fiscal_certificates')
      .select('storage_path, password_ciphertext_b64, password_iv_b64, password_tag_b64')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (certError) {
      return NextResponse.json({ error: 'Erro ao buscar certificado', details: certError.message }, { status: 400, headers: jsonHeaders });
    }

    if (!cert?.storage_path) {
      return NextResponse.json({ error: 'Nenhum certificado enviado para este tenant' }, { status: 400, headers: jsonHeaders });
    }

    const password = decryptPassword({
      ciphertext_b64: cert.password_ciphertext_b64,
      iv_b64: cert.password_iv_b64,
      tag_b64: cert.password_tag_b64,
    });

    const downloadRes = await supabaseAdmin.storage.from(BUCKET).download(cert.storage_path);
    if (downloadRes.error) {
      return NextResponse.json({ error: 'Erro ao baixar certificado do Storage', details: downloadRes.error.message }, { status: 400, headers: jsonHeaders });
    }

    const arrayBuffer = await downloadRes.data.arrayBuffer();
    const certBase64 = Buffer.from(arrayBuffer).toString('base64');

    const environment = (globalConfig.environment as Environment) || 'homologacao';
    // A API de Empresas da Focus NFe (API de Revenda) opera exclusivamente em produção
    const baseUrl = 'https://api.focusnfe.com.br';

    let regimeTributario = 1; // 1 - Simples Nacional (Padrão)
    if (tenant.regime_tributario === 'presumido' || tenant.regime_tributario === 'real') {
      regimeTributario = 3; // 3 - Regime Normal
    } else if (tenant.regime_tributario === 'mei') {
      regimeTributario = 4; // 4 - MEI
    }

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
      regime_tributario: regimeTributario,

      arquivo_certificado_base64: certBase64,
      senha_certificado: password,

      habilita_nfe: true,
      habilita_nfce: true,
      habilita_nfse: true,
      habilita_nfsen_homologacao: true,
      habilita_nfsen_producao: environment === 'producao',
    };

    const masterToken = globalConfig.api_token;

    const url = integration?.focus_empresa_id
      ? `${baseUrl}/v2/empresas/${encodeURIComponent(String(integration.focus_empresa_id))}`
      : `${baseUrl}/v2/empresas`;

    const method = integration?.focus_empresa_id ? 'PUT' : 'POST';

    console.log('🚀 Provisionando empresa na FocusNFe:', {
      url,
      method,
      tenant_name: payload.nome,
      cnpj: payload.cnpj,
      environment
    });

    let resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${masterToken}:`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    let http_status = resp.status;
    let providerBody = await fetchJsonOrText(resp);

    // Se falhar e for erro de CNPJ já cadastrado, tentar recuperar o ID existente via API
    if (!resp.ok) {
      const errorsList = providerBody?.erros || providerBody?.errors;
      const isAlreadyRegistered = Array.isArray(errorsList) && errorsList.some((e: any) => 
        e.codigo === 'ja_cadastrado' || 
        String(e.mensagem || '').toLowerCase().includes('já cadastrado') || 
        String(e.mensagem || '').toLowerCase().includes('ja cadastrado')
      );

      if (isAlreadyRegistered) {
        console.log('🔄 CNPJ já cadastrado na Focus NFe. Buscando empresa cadastrada...');
        const listResp = await fetch(`${baseUrl}/v2/empresas`, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(`${masterToken}:`).toString('base64')}`,
          },
        });
        if (listResp.ok) {
          const companies = await listResp.json();
          if (Array.isArray(companies)) {
            const matched = companies.find((c: any) => String(c.cnpj).replace(/\D/g, '') === cnpj);
            if (matched) {
              console.log('✅ Empresa recuperada com sucesso da Focus NFe:', matched);
              providerBody = matched;
              http_status = 200;
              // Simulamos um response de sucesso para o fluxo continuar
              resp = new Response(JSON.stringify(matched), { status: 200 });
            }
          }
        }
      }
    }

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: 'Erro ao provisionar empresa na FocusNFe',
          http_status,
          provider_error: providerBody,
        },
        { status: 400, headers: jsonHeaders }
      );
    }

    const focusEmpresaId = providerBody?.id;

    const { error: dbError } = await supabaseAdmin
      .from('fiscal_integrations')
      .upsert({
        tenant_id,
        provider: 'focusnfe',
        environment,
        api_token: masterToken, // A coluna api_token é NOT NULL no banco de dados
        enabled: true,
        focus_empresa_id: focusEmpresaId || integration?.focus_empresa_id || null,
        focus_token_homologacao: providerBody?.token_homologacao ?? null,
        focus_token_producao: providerBody?.token_producao ?? null,
        cert_valid_from: providerBody?.certificado_valido_de ?? null,
        cert_valid_to: providerBody?.certificado_valido_ate ?? null,
        cert_cnpj: providerBody?.certificado_cnpj ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,provider' });

    if (dbError) {
      console.error('❌ Erro ao salvar integração no banco de dados:', dbError);
      return NextResponse.json(
        {
          error: 'Erro ao salvar os dados de integração no banco de dados local.',
          details: dbError.message,
        },
        { status: 500, headers: jsonHeaders }
      );
    }

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
    }, { headers: jsonHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: error?.message }, { status: 500, headers: jsonHeaders });
  }
}
