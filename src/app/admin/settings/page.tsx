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
import { toast } from 'sonner';
import { Shield, Key, Database, RefreshCw, Save, Loader2, Sparkles, Settings, ArrowRightLeft, CheckCircle2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOptionalPrestador, setShowOptionalPrestador] = useState(false);
  
  // Provedores Fiscais
  const [primaryProvider, setPrimaryProvider] = useState<'focusnfe' | 'notaas'>('notaas');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  // Focus NFe
  const [focusIntegration, setFocusIntegration] = useState<any>(null);
  const [focusApiToken, setFocusApiToken] = useState('');
  const [focusEnvironment, setFocusEnvironment] = useState<'homologacao' | 'producao'>('homologacao');
  const [focusEnabled, setFocusEnabled] = useState(true);

  // Nota AaS
  const [notaasIntegration, setNotaasIntegration] = useState<any>(null);
  const [notaasApiKey, setNotaasApiKey] = useState('');
  const [notaasEnabled, setNotaasEnabled] = useState(true);

  // Estados fiscais da plataforma (JUGA) - Opcionais
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [im, setIm] = useState('');
  const [codigoServico, setCodigoServico] = useState('1.03');
  const [aliquotaIss, setAliquotaIss] = useState('2');
  const [codigoMunicipio, setCodigoMunicipio] = useState('');

  const selectedTenantId = '00000000-0000-0000-0000-000000000000';

  const loadIntegration = useCallback(async () => {
    if (!selectedTenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Buscar integração Focus NFe
      const resFocus = await fetch(`/next_api/fiscal/focusnfe/integration?tenant_id=${selectedTenantId}`);
      if (resFocus.ok) {
        const json = await resFocus.json();
        if (json?.data) {
          setFocusIntegration(json.data);
          setFocusApiToken('');
          setFocusEnvironment(json.data.environment || 'homologacao');
          setFocusEnabled(json.data.enabled !== false);
          
          if (json.data.primary_provider) {
            setPrimaryProvider(json.data.primary_provider);
          }
          if (json.data.fallback_enabled !== undefined) {
            setFallbackEnabled(json.data.fallback_enabled);
          }
        }
      }

      // 2. Buscar integração Nota AaS
      const resNotaas = await fetch(`/next_api/fiscal/notaas/integration?tenant_id=${selectedTenantId}`);
      if (resNotaas.ok) {
        const jsonNotaas = await resNotaas.json();
        if (jsonNotaas?.data) {
          setNotaasIntegration(jsonNotaas.data);
          setNotaasApiKey('');
          setNotaasEnabled(jsonNotaas.data.enabled !== false);
          
          if (jsonNotaas.data.primary_provider) {
            setPrimaryProvider(jsonNotaas.data.primary_provider);
          }
          if (jsonNotaas.data.fallback_enabled !== undefined) {
            setFallbackEnabled(jsonNotaas.data.fallback_enabled);
          }
        }
      }

      // 3. Buscar dados fiscais do tenant global (JUGA)
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', selectedTenantId)
        .maybeSingle();

      if (tenantData) {
        setCnpj(tenantData.document || '');
        setRazaoSocial(tenantData.razao_social || tenantData.name || '');
        setIm(tenantData.inscricao_municipal || '');
        setCodigoServico(tenantData.settings?.nfse_codigo_servico || '1.03');
        setAliquotaIss(String((tenantData.settings?.nfse_aliquota || 0.02) * 100));
        setCodigoMunicipio(tenantData.settings?.nfse_codigo_municipio || '');
      }

    } catch (error) {
      console.error('Erro ao buscar integrações fiscais:', error);
      toast.error('Erro ao buscar dados das integrações fiscais');
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
      setSaving(true);

      const focusTokenToSave = focusApiToken.trim() || focusIntegration?.api_token;
      const notaasTokenToSave = notaasApiKey.trim() || notaasIntegration?.api_token;

      if (!focusTokenToSave && !notaasTokenToSave) {
        toast.error('Por favor, insira o Token da Nota AaS ou da Focus NFe para salvar');
        setSaving(false);
        return;
      }

      // 1. Salvar dados do prestador apenas se preenchidos
      if (cnpj || razaoSocial) {
        const aliquotaDecimal = parseFloat(aliquotaIss || '2') / 100;
        
        const { data: currentTenant } = await supabase
          .from('tenants')
          .select('settings')
          .eq('id', selectedTenantId)
          .maybeSingle();

        const newSettings = {
          ...(currentTenant?.settings || {}),
          nfse_codigo_servico: codigoServico,
          nfse_aliquota: aliquotaDecimal,
          nfse_codigo_municipio: codigoMunicipio,
        };

        await supabase
          .from('tenants')
          .update({
            document: cnpj ? cnpj.replace(/\D/g, '') : null,
            razao_social: razaoSocial || null,
            inscricao_municipal: im ? im.replace(/\D/g, '') : null,
            settings: newSettings
          })
          .eq('id', selectedTenantId);
      }

      // 2. Salvar credenciais Focus NFe se fornecidas
      if (focusTokenToSave) {
        const resFocus = await fetch('/next_api/fiscal/focusnfe/integration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: selectedTenantId,
            api_token: focusTokenToSave,
            environment: focusEnvironment,
            enabled: focusEnabled,
            primary_provider: primaryProvider,
            fallback_enabled: fallbackEnabled,
          }),
        });
        if (!resFocus.ok) {
          const errJson = await resFocus.json();
          throw new Error(errJson.error || 'Erro ao salvar integração Focus NFe');
        }
      }

      // 3. Salvar credenciais Nota AaS se fornecidas
      if (notaasTokenToSave) {
        const resNotaas = await fetch('/next_api/fiscal/notaas/integration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: selectedTenantId,
            api_token: notaasTokenToSave,
            enabled: notaasEnabled,
            primary_provider: primaryProvider,
            fallback_enabled: fallbackEnabled,
          }),
        });
        if (!resNotaas.ok) {
          const errJson = await resNotaas.json();
          throw new Error(errJson.error || 'Erro ao salvar integração Nota AaS');
        }
      }

      toast.success('Configurações fiscais salvas com sucesso!');
      setFocusApiToken('');
      setNotaasApiKey('');
      await loadIntegration();
    } catch (error: any) {
      console.error('Erro ao salvar configurações fiscais:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminProtection>
      <div className="space-y-6 p-4 sm:p-6 w-full min-w-0 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Configurações de Emissão Fiscal (SaaS)
          </h1>
          <p className="text-sm sm:text-base text-body">
            Insira suas chaves de API da Nota AaS ou Focus NFe para habilitar a emissão de notas fiscais para os seus clientes.
          </p>
        </div>

        {/* Global Configuration Banner */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Status do Sistema</span>
              <span className="font-bold text-gray-950 dark:text-gray-50">
                Provedor Ativo: {primaryProvider === 'notaas' ? 'Nota AaS' : 'Focus NFe'} | Fallback: {fallbackEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 font-semibold px-3 py-1">
            Global ERP
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Form Card */}
          <Card className="md:col-span-2 juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Chaves de API para os Seus Clientes Emitirem
              </CardTitle>
              <CardDescription>
                Basta colar a sua API Key do Nota AaS (ou Token da Focus NFe) abaixo e salvar. Seus clientes enviarão o certificado digital deles e emitirão direto pelo sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando integrações...</span>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">

                  {/* Provider & Fallback Selector */}
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" /> Provedor Principal
                      </Label>
                      <Select
                        value={primaryProvider}
                        onValueChange={(val: 'focusnfe' | 'notaas') => setPrimaryProvider(val)}
                      >
                        <SelectTrigger className="w-full rounded-xl bg-white dark:bg-zinc-900">
                          <SelectValue placeholder="Selecione o provedor principal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notaas">Nota AaS (Recomendado)</SelectItem>
                          <SelectItem value="focusnfe">Focus NFe</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        API utilizada por padrão para transmitir as notas fiscais dos seus clientes para a SEFAZ/Prefeituras.
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-blue-200/40 pt-3">
                      <div className="space-y-0.5">
                        <Label className="font-semibold text-sm flex items-center gap-1.5">
                          <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                          Fallback Automático em caso de queda
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Redireciona para o outro provedor se a API principal estiver fora do ar
                        </p>
                      </div>
                      <Switch
                        checked={fallbackEnabled}
                        onCheckedChange={(checked) => setFallbackEnabled(checked)}
                      />
                    </div>
                  </div>

                  {/* Section 1: Nota AaS */}
                  <div className="border-t border-slate-200 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Key className="h-4 w-4 text-emerald-600" />
                        Integração Nota AaS (Nota como Serviço)
                      </h3>
                      <Switch
                        checked={notaasEnabled}
                        onCheckedChange={(c) => setNotaasEnabled(c)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notaas_key" className="font-semibold text-slate-700 dark:text-slate-300">
                        API Key / Token da Nota AaS
                      </Label>
                      <Input
                        id="notaas_key"
                        type="password"
                        placeholder={notaasIntegration?.api_token ? "••••••••••••••••••••••••••••••••" : "Cole aqui sua API Key (x-api-key) da Nota AaS"}
                        value={notaasApiKey}
                        onChange={(e) => setNotaasApiKey(e.target.value)}
                        className="border-slate-200 focus:border-emerald-500 rounded-xl"
                      />
                      {notaasIntegration?.api_token && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                          <Sparkles className="h-3 w-3" /> API Key Nota AaS ativa e pronta para uso
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Focus NFe */}
                  <div className="border-t border-slate-200 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Key className="h-4 w-4 text-blue-600" />
                        Integração Focus NFe (Opcional / Fallback)
                      </h3>
                      <Switch
                        checked={focusEnabled}
                        onCheckedChange={(c) => setFocusEnabled(c)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="focus_token" className="font-semibold text-slate-700 dark:text-slate-300">
                        Token da API Focus NFe
                      </Label>
                      <Input
                        id="focus_token"
                        type="password"
                        placeholder={focusIntegration?.api_token ? "••••••••••••••••••••••••••••••••" : "Cole aqui o token da Focus NFe (se utilizar)"}
                        value={focusApiToken}
                        onChange={(e) => setFocusApiToken(e.target.value)}
                        className="border-slate-200 focus:border-blue-500 rounded-xl"
                      />
                      {focusIntegration?.api_token && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                          <Sparkles className="h-3 w-3" /> Token Focus NFe ativo
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300">Ambiente Focus NFe</Label>
                      <Select
                        value={focusEnvironment}
                        onValueChange={(val: 'homologacao' | 'producao') => setFocusEnvironment(val)}
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                          <SelectItem value="producao">Produção (Validade Fiscal Real)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Section 3: Collapsible / Optional Prestador Data */}
                  <div className="border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowOptionalPrestador(!showOptionalPrestador)}
                      className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-slate-500" />
                        Dados Fiscais da Sua Empresa SaaS (Opcional)
                      </span>
                      {showOptionalPrestador ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    {showOptionalPrestador && (
                      <div className="pt-4 space-y-4 border-l-2 border-slate-200 pl-4 mt-2">
                        <p className="text-xs text-muted-foreground">
                          Preencha estes dados apenas se você planeja utilizar o sistema para emitir nota fiscal referente às mensalidades cobradas dos seus clientes.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cnpj" className="font-semibold text-slate-700">Seu CNPJ</Label>
                            <Input
                              id="cnpj"
                              placeholder="00.000.000/0000-00"
                              value={cnpj}
                              onChange={(e) => setCnpj(e.target.value)}
                              className="border-slate-200 rounded-xl"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="im" className="font-semibold text-slate-700">Sua Inscrição Municipal</Label>
                            <Input
                              id="im"
                              placeholder="Inscrição Municipal"
                              value={im}
                              onChange={(e) => setIm(e.target.value)}
                              className="border-slate-200 rounded-xl"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="razao_social" className="font-semibold text-slate-700">Sua Razão Social</Label>
                          <Input
                            id="razao_social"
                            placeholder="SUA EMPRESA LTDA"
                            value={razaoSocial}
                            onChange={(e) => setRazaoSocial(e.target.value)}
                            className="border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
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
                      className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 px-6 h-11"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Configurações
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
                Status das Chaves
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Provedor Ativo</span>
                <Badge className="bg-emerald-600 text-white font-bold w-fit text-xs px-3 py-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {primaryProvider === 'notaas' ? 'Nota AaS (Principal)' : 'Focus NFe (Principal)'}
                </Badge>
              </div>

              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-muted-foreground">Nota AaS API Key</span>
                <span className="text-xs font-semibold flex items-center gap-1">
                  {notaasIntegration?.api_token ? (
                    <span className="text-emerald-600 font-bold">● Configurada e Ativa</span>
                  ) : (
                    <span className="text-amber-600">○ Pendente / Não informada</span>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-muted-foreground">Focus NFe Token</span>
                <span className="text-xs font-semibold flex items-center gap-1">
                  {focusIntegration?.api_token ? (
                    <span className="text-emerald-600 font-bold">● Configurado e Ativo</span>
                  ) : (
                    <span className="text-slate-400">○ Não utilizado</span>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="text-xs text-muted-foreground">Modo Fallback</span>
                <span className="text-xs font-semibold">
                  {fallbackEnabled ? 'Ativo (Redundância Automática)' : 'Desativado'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtection>
  );
}
