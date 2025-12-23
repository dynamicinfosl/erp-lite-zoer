/**
 * Script para verificar o status da integração FocusNFe
 * Execute com: npx tsx scripts/check-focus-integration.ts
 */

import { createClient } from '@supabase/supabase-js';

// Usar as mesmas variáveis de ambiente do projeto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFocusNFeIntegration() {
  console.log('🔍 Verificando integração FocusNFe...\n');

  // 1. Buscar todas as integrações FocusNFe
  const { data: integrations, error: integrationError } = await supabase
    .from('fiscal_integrations')
    .select('*')
    .eq('provider', 'focusnfe');

  if (integrationError) {
    console.error('❌ Erro ao buscar integrações:', integrationError.message);
    return;
  }

  if (!integrations || integrations.length === 0) {
    console.log('❌ NENHUMA integração FocusNFe encontrada no sistema!');
    console.log('\n📋 Para configurar:');
    console.log('   1. Acesse /configuracao-fiscal no sistema');
    console.log('   2. Preencha o Token da API FocusNFe');
    console.log('   3. Configure o CNPJ emitente');
    console.log('   4. Envie o certificado digital A1');
    console.log('   5. Provisione a empresa na FocusNFe\n');
    return;
  }

  console.log(`✅ Encontradas ${integrations.length} integração(ões) FocusNFe\n`);

  for (const integration of integrations) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Tenant ID: ${integration.tenant_id}`);
    console.log(`🌍 Ambiente: ${integration.environment}`);
    console.log(`${integration.enabled ? '✅' : '❌'} Status: ${integration.enabled ? 'ATIVO' : 'INATIVO'}`);
    console.log(`${integration.api_token ? '✅' : '❌'} Token API: ${integration.api_token ? 'Configurado' : 'NÃO configurado'}`);
    console.log(`${integration.cnpj_emitente ? '✅' : '❌'} CNPJ Emitente: ${integration.cnpj_emitente || 'NÃO configurado'}`);
    console.log(`${integration.focus_empresa_id ? '✅' : '❌'} Empresa Provisionada: ${integration.focus_empresa_id ? `Sim (ID: ${integration.focus_empresa_id})` : 'NÃO'}`);
    
    // Buscar certificado
    const { data: cert } = await supabase
      .from('fiscal_certificates')
      .select('*')
      .eq('tenant_id', integration.tenant_id)
      .eq('provider', 'focusnfe')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cert) {
      console.log(`✅ Certificado Digital: Enviado`);
      console.log(`   📄 CNPJ do Cert: ${cert.cnpj}`);
      console.log(`   📅 Válido de: ${new Date(cert.valid_from).toLocaleDateString('pt-BR')}`);
      console.log(`   📅 Válido até: ${new Date(cert.valid_to).toLocaleDateString('pt-BR')}`);
      
      // Verificar se está vencido
      const now = new Date();
      const validTo = new Date(cert.valid_to);
      if (validTo < now) {
        console.log(`   ⚠️  ATENÇÃO: Certificado VENCIDO!`);
      } else {
        const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ⏱️  Expira em ${daysUntilExpiry} dias`);
      }
    } else {
      console.log(`❌ Certificado Digital: NÃO enviado`);
    }

    console.log(`📅 Criado em: ${new Date(integration.created_at).toLocaleString('pt-BR')}`);
    console.log(`📅 Atualizado em: ${new Date(integration.updated_at).toLocaleString('pt-BR')}`);
    console.log('');
  }

  // Resumo geral
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO:');
  const active = integrations.filter(i => i.enabled).length;
  const withToken = integrations.filter(i => i.api_token).length;
  const provisioned = integrations.filter(i => i.focus_empresa_id).length;
  
  console.log(`   Total: ${integrations.length}`);
  console.log(`   ${active === integrations.length ? '✅' : '⚠️ '} Ativas: ${active}`);
  console.log(`   ${withToken === integrations.length ? '✅' : '⚠️ '} Com Token: ${withToken}`);
  console.log(`   ${provisioned === integrations.length ? '✅' : '⚠️ '} Provisionadas: ${provisioned}`);
  
  if (active === integrations.length && withToken === integrations.length && provisioned === integrations.length) {
    console.log('\n🎉 Integração totalmente configurada e pronta para uso!');
  } else {
    console.log('\n⚠️  Ação necessária: Complete a configuração fiscal em /configuracao-fiscal');
  }
}

checkFocusNFeIntegration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });

