'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminProtection } from '@/components/admin/AdminProtection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { toast } from 'sonner';
import { Shield, Key, Database, RefreshCw, Save, Loader2, Sparkles, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integration, setIntegration] = useState<any>(null);

  const [apiToken, setApiToken] = useState('');
  const [environment, setEnvironment] = useState<'homologacao' | 'producao'>('homologacao');
  const [enabled, setEnabled] = useState(true);

  const selectedTenantId = '00000000-0000-0000-0000-000000000000';

  const loadIntegration = useCallback(async () => {
    if (!selectedTenantId) {
      setIntegration(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/next_api/fiscal/focusnfe/integration?tenant_id=${selectedTenantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          setIntegration(json.data);
          setApiToken(''); // Deixar em branco por segurança, ou carregar mascarado
          setEnvironment(json.data.environment || 'homologacao');
          setEnabled(json.data.enabled !== false);
        } else {
          setIntegration(null);
          setApiToken('');
          setEnvironment('homologacao');
          setEnabled(true);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar integração Focus NFe:', error);
      toast.error('Erro ao buscar dados da integração Focus NFe');
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    try {
      if (e) e.preventDefault();
      console.log('🔮 [handleSave] Iniciando salvamento...', {
        tenantId: selectedTenantId,
        apiTokenEmpty: !apiToken,
        integrationTokenEmpty: !integration?.api_token,
        environment,
        enabled
      });

      if (!selectedTenantId) {
        console.warn('🔮 [handleSave] Cancelado: selectedTenantId está ausente');
        toast.error('Por favor, selecione uma empresa (inquilino) primeiro');
        return;
      }

      const tokenToSave = apiToken.trim() || integration?.api_token;
      console.log('🔮 [handleSave] Token determinado:', tokenToSave ? '•••• (preenchido)' : 'Vazio');

      if (!tokenToSave) {
        console.warn('🔮 [handleSave] Cancelado: Token está vazio');
        toast.error('Token da API Focus NFe é obrigatório');
        return;
      }

      setSaving(true);
      console.log('🔮 [handleSave] Enviando requisição POST...');

      const res = await fetch('/next_api/fiscal/focusnfe/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedTenantId,
          api_token: tokenToSave,
          environment,
          enabled,
        }),
      });

      console.log('🔮 [handleSave] Resposta recebida, status:', res.status);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar integração');
      }

      toast.success('Configurações Focus NFe salvas com sucesso!');
      setApiToken('');
      await loadIntegration();
    } catch (error: any) {
      console.error('🔮 [handleSave] Erro ao salvar integração:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
      console.log('🔮 [handleSave] Salvamento concluído.');
    }
  };

  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Configurações do Sistema
          </h1>
          <p className="text-sm sm:text-base text-body">
            Gerencie as credenciais e o ambiente operacional para emissão fiscal
          </p>
        </div>

        {/* Global Configuration Banner */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Modo de Configuração</span>
              <span className="font-bold text-gray-950 dark:text-gray-50">
                Configuração Global de Emissão Fiscal (Focus NFe)
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 font-semibold px-3 py-1">
            Todos os Inquilinos
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Form Card */}
          <Card className="md:col-span-2 juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Integração Focus NFe
              </CardTitle>
              <CardDescription>
                Atualize suas credenciais da API Focus NFe e gerencie os modos de homologação e produção.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando integração fiscal...</span>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">
                  {/* API Token Input */}
                  <div className="space-y-2">
                    <Label htmlFor="api_token" className="font-semibold">
                      Token da API Focus NFe
                    </Label>
                    <div className="relative">
                      <Input
                        id="api_token"
                        type="password"
                        placeholder={integration?.api_token ? "••••••••••••••••••••••••••••••••" : "Insira o token fornecido pela Focus NFe"}
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    {integration?.api_token && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                        <Sparkles className="h-3 w-3" /> Token ativo e configurado
                      </p>
                    )}
                  </div>

                  {/* Environment Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="environment" className="font-semibold">
                      Ambiente de Emissão
                    </Label>
                    <Select
                      value={environment}
                      onValueChange={(val: 'homologacao' | 'producao') => setEnvironment(val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação (Ambiente de Testes)</SelectItem>
                        <SelectItem value="producao">Produção (Ambiente Real / Validade Fiscal)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      No modo Homologação as notas não possuem validade fiscal real e servem apenas para testes.
                    </p>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="font-semibold">Integração Ativa</Label>
                      <p className="text-xs text-muted-foreground">
                        Habilita ou desabilita o faturamento fiscal automático no ERP
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => setEnabled(checked)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadIntegration}
                      disabled={saving}
                      className="flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Descartar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 px-5 h-11"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Integration Status Card */}
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Status Operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Ambiente Selecionado</span>
                {environment === 'producao' ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-fit text-xs px-3 py-1 flex items-center gap-1.5">
                    Produção (Real)
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold w-fit text-xs px-3 py-1 flex items-center gap-1.5">
                    Homologação (Testes)
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-muted-foreground">CNPJ do Certificado</span>
                <span className="text-sm font-mono font-semibold">
                  {integration?.cert_cnpj ? integration.cert_cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : 'Nenhum certificado provisionado'}
                </span>
              </div>

              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-muted-foreground">Validade do Certificado</span>
                <span className="text-xs font-semibold">
                  {integration?.cert_valid_to ? (
                    <>Até {new Date(integration.cert_valid_to).toLocaleDateString('pt-BR')}</>
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-muted-foreground">ID da Empresa na Focus</span>
                <span className="text-xs font-mono">
                  {integration?.focus_empresa_id || 'Não provisionada'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtection>
  );
}
