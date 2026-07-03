import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface NFSePayload {
  data_emissao: string;
  prestador: {
    cnpj: string;
    inscricao_municipal: string;
    codigo_municipio: string;
  };
  tomador: {
    cnpj?: string;
    cpf?: string;
    razao_social: string;
    email?: string;
    telefone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      codigo_municipio?: string;
      uf: string;
      cep: string;
    };
  };
  servico: {
    aliquota: number;
    codigo_servico: string;
    discriminacao: string;
    valor_servicos: number;
  };
}

/**
 * Emite nota fiscal de serviço (NFS-e) para o cliente após pagamento da assinatura
 */
export async function issueJugaSubscriptionInvoice(params: {
  tenantId: string;
  amount: number;
  paymentRecordId: string;
  planName: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`🧾 [NFS-E GLOBAL] Preparando NFS-e para tenant: ${params.tenantId}, valor: R$ ${params.amount}`);

    // 1. Buscar credenciais da FocusNFe do tenant global (JUGA)
    const globalTenantId = '00000000-0000-0000-0000-000000000000';
    const { data: globalIntegration, error: globalIntError } = await supabaseAdmin
      .from('fiscal_integrations')
      .select('*')
      .eq('tenant_id', globalTenantId)
      .eq('provider', 'focusnfe')
      .maybeSingle();

    if (globalIntError || !globalIntegration || !globalIntegration.enabled) {
      console.warn('⚠️ Integração FocusNFe global do JUGA não está configurada ou ativa.');
      return { success: false, error: 'FocusNFe global desabilitada' };
    }

    const apiToken = globalIntegration.api_token || globalIntegration.focus_token_homologacao;
    const environment = globalIntegration.environment || 'homologacao';
    
    if (!apiToken) {
      console.error('❌ Token da FocusNFe global ausente');
      return { success: false, error: 'Token global da API ausente' };
    }

    // 2. Buscar dados fiscais do prestador (JUGA) no tenant global
    const { data: prestadorTenant, error: prestadorError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', globalTenantId)
      .maybeSingle();

    if (prestadorError || !prestadorTenant) {
      console.error('❌ Dados do prestador global (JUGA) não encontrados:', prestadorError);
      return { success: false, error: 'Dados do prestador global não encontrados' };
    }

    const prestadorCNPJ = (prestadorTenant.document || '').replace(/\D/g, '');
    const prestadorIM = (prestadorTenant.inscricao_municipal || '').replace(/\D/g, '');
    const prestadorIBGE = prestadorTenant.settings?.nfse_codigo_municipio || ''; // IBGE

    if (!prestadorCNPJ || !prestadorIM) {
      console.error('❌ CNPJ ou Inscrição Municipal do prestador (JUGA) ausente');
      return { success: false, error: 'CNPJ ou IM do prestador ausentes' };
    }

    // 3. Buscar dados fiscais do tomador (o cliente contratante)
    const { data: tomadorTenant, error: tomadorError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', params.tenantId)
      .maybeSingle();

    if (tomadorError || !tomadorTenant) {
      console.error('❌ Dados do tomador (cliente) não encontrados:', tomadorError);
      return { success: false, error: 'Tomador não encontrado' };
    }

    const docClean = (tomadorTenant.document || '').replace(/\D/g, '');
    const isCNPJ = docClean.length > 11;

    // Verificar se o tomador tem dados de endereço básicos
    const cepClean = (tomadorTenant.zip_code || '').replace(/\D/g, '');
    const uf = tomadorTenant.state || '';
    const logradouro = tomadorTenant.address || '';
    const numero = tomadorTenant.numero || 'S/N';
    const bairro = tomadorTenant.bairro || '';

    if (!docClean || !cepClean || !uf || !logradouro) {
      console.error('❌ Dados fiscais/endereço do tomador incompletos:', { docClean, cepClean, uf, logradouro });
      return { success: false, error: 'Dados cadastrais/endereço do tomador incompletos para faturamento' };
    }

    // 4. Montar o payload da NFS-e municipal da FocusNFe
    const aliquota = prestadorTenant.settings?.nfse_aliquota || 0.02; // Ex: 2%
    const codigoServico = prestadorTenant.settings?.nfse_codigo_servico || '1.03'; // SaaS

    const payload: NFSePayload = {
      data_emissao: new Date().toISOString().replace(/\.\d+Z$/, ''), // Formato esperado yyyy-MM-ddTHH:mm:ss
      prestador: {
        cnpj: prestadorCNPJ,
        inscricao_municipal: prestadorIM,
        codigo_municipio: prestadorIBGE,
      },
      tomador: {
        ...(isCNPJ ? { cnpj: docClean } : { cpf: docClean }),
        razao_social: tomadorTenant.razao_social || tomadorTenant.name,
        email: tomadorTenant.email || undefined,
        telefone: tomadorTenant.phone || undefined,
        endereco: {
          logradouro,
          numero,
          bairro,
          uf,
          cep: cepClean,
        },
      },
      servico: {
        aliquota,
        codigo_servico: codigoServico,
        discriminacao: `Licenciamento e cessão de direito de uso de programa de computador (SaaS) - Assinatura do Plano ${params.planName} do JUGA Sistemas. Fatura Ref: ${params.paymentRecordId}`,
        valor_servicos: params.amount,
      },
    };

    // 5. Enviar para a API FocusNFe
    const baseUrl = environment === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';
    const reference = `ref_${params.paymentRecordId}`;
    const url = `${baseUrl}/v2/nfse?reference=${reference}`;
    
    console.log(`🚀 [NFS-E GLOBAL] Emitindo na FocusNFe. Ref: ${reference}, Url: ${url}`);
    
    const authHeader = `Basic ${Buffer.from(`${apiToken}:`).toString('base64')}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro no retorno da FocusNFe:', result);
      return { success: false, error: result.mensagem || 'Erro na FocusNFe API' };
    }

    console.log('✅ Nota Fiscal gerada com sucesso na FocusNFe:', result);

    // Salvar registro de documento fiscal emitido para fins de auditoria
    try {
      await supabaseAdmin
        .from('fiscal_documents')
        .insert({
          tenant_id: params.tenantId,
          provider: 'focusnfe',
          doc_type: 'nfse',
          ref: reference,
          status: result.status || 'autorizado',
          payload: result,
          numero: result.numero,
          chave: result.codigo_verificacao,
          caminho_pdf: result.caminho_pdf_nota_fiscal,
          caminho_xml: result.caminho_xml_nota_fiscal,
        });

      // Atualizar faturamento correspondente com a nota emitida
      await supabaseAdmin
        .from('payment_records')
        .update({
          invoice_number: result.numero,
          receipt_url: result.caminho_pdf_nota_fiscal,
        })
        .eq('id', params.paymentRecordId);

    } catch (dbErr) {
      console.error('⚠️ Falha ao salvar logs fiscais no banco:', dbErr);
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('❌ Erro interno ao emitir NFS-e:', error);
    return { success: false, error: error.message || 'Erro inesperado' };
  }
}
