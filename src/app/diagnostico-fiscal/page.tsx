'use client';

import { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function DiagnosticoFiscalPage() {
  const { user, tenant, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(false);
  const [diagnostico, setDiagnostico] = useState<any>(null);

  const executarDiagnostico = async () => {
    if (!tenant?.id) {
      return;
    }

    try {
      setLoading(true);
      
      // Buscar dados do tenant
      const tenantResponse = await fetch(`/next_api/tenants/${tenant.id}`);
      const tenantData = await tenantResponse.json();

      // Buscar integração fiscal
      const integrationResponse = await fetch(`/next_api/fiscal/focusnfe/integration?tenant_id=${tenant.id}`);
      const integrationData = await integrationResponse.json();

      // Buscar certificado
      const certResponse = await fetch(`/next_api/fiscal/focusnfe/certificate?tenant_id=${tenant.id}`);
      const certData = await certResponse.json();

      const result = {
        tenant: tenantData?.tenant || null,
        integration: integrationData?.data || null,
        certificate: certData?.data || null,
        user: {
          id: user?.id,
          email: user?.email,
        },
        tenant_context: {
          id: tenant?.id,
          name: tenant?.name,
        }
      };

      setDiagnostico(result);

      // Verificar inconsistências
      const issues = [];
      
      if (result.tenant && result.integration) {
        const tenantCNPJ = result.tenant.cnpj?.replace(/\D/g, '');
        const integrationCNPJ = result.integration.cnpj_emitente?.replace(/\D/g, '');
        const certCNPJ = result.integration.cert_cnpj?.replace(/\D/g, '');

        if (tenantCNPJ && integrationCNPJ && tenantCNPJ !== integrationCNPJ) {
          issues.push({
            type: 'error',
            message: `CNPJ do Perfil da Empresa (${tenantCNPJ}) diferente do CNPJ na Configuração Fiscal (${integrationCNPJ})`
          });
        }

        if (tenantCNPJ && certCNPJ && tenantCNPJ !== certCNPJ) {
          issues.push({
            type: 'error',
            message: `CNPJ do Perfil da Empresa (${tenantCNPJ}) diferente do CNPJ do Certificado (${certCNPJ})`
          });
        }

        if (!result.integration.focus_empresa_id) {
          issues.push({
            type: 'warning',
            message: 'Empresa não provisionada no FocusNFe'
          });
        }

        if (!result.integration.enabled) {
          issues.push({
            type: 'warning',
            message: 'Integração FocusNFe está desabilitada'
          });
        }
      }

      setDiagnostico({ ...result, issues });

    } catch (error) {
      console.error('Erro no diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      executarDiagnostico();
    }
  }, [tenant?.id]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TenantPageWrapper>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Diagnóstico Fiscal</h1>
              <p className="text-muted-foreground">
                Verificação de configuração e consistência de dados
              </p>
            </div>
            <Button onClick={executarDiagnostico} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </div>

        {diagnostico && (
          <div className="space-y-6">
            {/* Issues */}
            {diagnostico.issues && diagnostico.issues.length > 0 && (
              <Card className="border-red-500 bg-red-50/50 dark:bg-red-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Problemas Detectados ({diagnostico.issues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {diagnostico.issues.map((issue: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        issue.type === 'error'
                          ? 'bg-red-100 dark:bg-red-900/20'
                          : 'bg-yellow-100 dark:bg-yellow-900/20'
                      }`}
                    >
                      {issue.type === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {diagnostico.issues && diagnostico.issues.length === 0 && (
              <Card className="border-green-500 bg-green-50/50 dark:bg-green-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    Sem Problemas Detectados
                  </CardTitle>
                  <CardDescription>
                    Todos os dados estão consistentes e prontos para emissão de notas fiscais.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Contexto do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle>Contexto do Usuário Logado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Usuário</p>
                    <p className="font-medium">{diagnostico.user.email || diagnostico.user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant (Empresa Logada)</p>
                    <p className="font-medium">{diagnostico.tenant_context.name || diagnostico.tenant_context.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Tenant */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Perfil da Empresa</CardTitle>
                <CardDescription>Informações cadastradas em /perfil-empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {diagnostico.tenant ? (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nome/Razão Social</p>
                      <p className="font-medium">{diagnostico.tenant.razao_social || diagnostico.tenant.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nome Fantasia</p>
                      <p className="font-medium">{diagnostico.tenant.nome_fantasia || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ</p>
                      <p className="font-mono font-bold text-lg text-blue-600">
                        {diagnostico.tenant.cnpj || 'NÃO CADASTRADO'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inscrição Estadual</p>
                      <p className="font-medium">{diagnostico.tenant.inscricao_estadual || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Endereço</p>
                      <p className="font-medium">{diagnostico.tenant.address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cidade/UF</p>
                      <p className="font-medium">{diagnostico.tenant.city || '-'} / {diagnostico.tenant.state || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Dados do tenant não encontrados</p>
                )}
              </CardContent>
            </Card>

            {/* Dados da Integração Fiscal */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração Fiscal FocusNFe</CardTitle>
                <CardDescription>Informações cadastradas em /configuracao-fiscal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {diagnostico.integration ? (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge className={diagnostico.integration.enabled ? 'bg-green-600' : 'bg-red-600'}>
                        {diagnostico.integration.enabled ? 'Habilitada' : 'Desabilitada'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ambiente</p>
                      <Badge className={diagnostico.integration.environment === 'producao' ? 'bg-red-600' : 'bg-yellow-600'}>
                        {diagnostico.integration.environment === 'producao' ? 'Produção' : 'Homologação'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ID da Empresa FocusNFe</p>
                      <p className="font-medium">{diagnostico.integration.focus_empresa_id || 'NÃO PROVISIONADA'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Token Configurado</p>
                      <Badge className={diagnostico.integration.api_token ? 'bg-green-600' : 'bg-red-600'}>
                        {diagnostico.integration.api_token ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ Emitente (Config)</p>
                      <p className="font-mono font-bold text-lg text-blue-600">
                        {diagnostico.integration.cnpj_emitente || 'NÃO CADASTRADO'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CNPJ do Certificado</p>
                      <p className="font-mono font-bold text-lg text-purple-600">
                        {diagnostico.integration.cert_cnpj || 'NÃO DISPONÍVEL'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Integração fiscal não configurada</p>
                )}
              </CardContent>
            </Card>

            {/* Certificado */}
            <Card>
              <CardHeader>
                <CardTitle>Certificado Digital</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {diagnostico.certificate ? (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Arquivo</p>
                      <p className="font-medium">{diagnostico.certificate.original_filename || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge className="bg-green-600">Enviado</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Certificado não enviado</p>
                )}
              </CardContent>
            </Card>

            {/* Ações Recomendadas */}
            {diagnostico.issues && diagnostico.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações Recomendadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="font-medium text-sm mb-3">Para resolver os problemas detectados:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        <strong>Acesse /perfil-empresa</strong> e verifique se o CNPJ está correto
                      </li>
                      <li>
                        <strong>Acesse /configuracao-fiscal</strong> e verifique:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Se o CNPJ na aba Status corresponde ao da empresa</li>
                          <li>Se o certificado é da mesma empresa</li>
                          <li>Se a empresa foi provisionada</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Se os CNPJs forem diferentes:</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Use um certificado do mesmo CNPJ da empresa</li>
                          <li>OU atualize o CNPJ da empresa para corresponder ao certificado</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Após ajustes:</strong> Provisione novamente a empresa na aba Certificado
                      </li>
                    </ol>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.location.href = '/perfil-empresa'}
                      variant="outline"
                    >
                      Ir para Perfil da Empresa
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/configuracao-fiscal'}
                      variant="default"
                    >
                      Ir para Configuração Fiscal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </TenantPageWrapper>
  );
}

