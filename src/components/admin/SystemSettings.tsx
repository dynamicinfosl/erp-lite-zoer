'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Shield,
  Mail,
  Database,
  Palette,
  Bell,
  FileText,
  Users,
  CreditCard,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Upload,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    maintenanceMode: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    maxLoginAttempts: number;
    accountLockoutTime: number;
    apiRateLimit: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    systemAlerts: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  integrations: {
    googleAnalytics: string;
    facebookPixel: string;
    stripePublicKey: string;
    paypalClientId: string;
    awsAccessKey: string;
    sendgridApiKey: string;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupTime: string;
    retentionPeriod: number;
    cloudBackup: boolean;
    backupLocation: string;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTimeout: number;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    imageOptimization: boolean;
    lazyLoading: boolean;
  };
}

const defaultConfig: SystemConfig = {
  general: {
    siteName: 'JUGA - Sistema ERP',
    siteDescription: 'Sistema completo de gestão empresarial',
    defaultLanguage: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    maintenanceMode: false,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    accountLockoutTime: 15,
    apiRateLimit: 1000,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    systemAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    monthlyReports: true,
  },
  integrations: {
    googleAnalytics: '',
    facebookPixel: '',
    stripePublicKey: '',
    paypalClientId: '',
    awsAccessKey: '',
    sendgridApiKey: '',
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionPeriod: 30,
    cloudBackup: true,
    backupLocation: '/backups',
  },
  performance: {
    cacheEnabled: true,
    cacheTimeout: 3600,
    compressionEnabled: true,
    cdnEnabled: false,
    imageOptimization: true,
    lazyLoading: true,
  },
};

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // Simular carregamento da configuração
      await new Promise(resolve => setTimeout(resolve, 500));
      setConfig(defaultConfig);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = async () => {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão?')) return;
    
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setConfig(defaultConfig);
      setHasChanges(true);
      toast.success('Configurações restauradas para o padrão');
    } catch (error) {
      toast.error('Erro ao restaurar configurações');
    } finally {
      setLoading(false);
    }
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'configuracoes-sistema.json';
    link.click();
    toast.success('Configurações exportadas com sucesso!');
  };

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Sistema
          </h2>
          <p className="text-muted-foreground">Gerencie as configurações globais do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={resetConfig} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={saveConfig} disabled={loading || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
          </AlertDescription>
        </Alert>
      )}

      {/* Maintenance Mode Alert */}
      {config.general.maintenanceMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Modo de Manutenção Ativo:</strong> O sistema está em manutenção e não está acessível para usuários regulares.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                <Globe className="h-5 w-5 text-juga-primary" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
                  <Select 
                    value={config.general.defaultLanguage} 
                    onValueChange={(value) => updateConfig('general', 'defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descrição do Site</Label>
                <Textarea
                  id="siteDescription"
                  value={config.general.siteDescription}
                  onChange={(e) => updateConfig('general', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={config.general.timezone} 
                    onValueChange={(value) => updateConfig('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select 
                    value={config.general.dateFormat} 
                    onValueChange={(value) => updateConfig('general', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select 
                    value={config.general.currency} 
                    onValueChange={(value) => updateConfig('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativa o modo de manutenção, bloqueando o acesso de usuários regulares
                  </p>
                </div>
                <Switch
                  checked={config.general.maintenanceMode}
                  onCheckedChange={(checked) => updateConfig('general', 'maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                <Shield className="h-5 w-5 text-juga-primary" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Exige autenticação adicional para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={config.security.twoFactorAuth}
                  onCheckedChange={(checked) => updateConfig('security', 'twoFactorAuth', checked)}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (min)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Tamanho Mín. Senha</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="20"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máx. Tentativas Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountLockoutTime">Tempo de Bloqueio (min)</Label>
                  <Input
                    id="accountLockoutTime"
                    type="number"
                    min="5"
                    max="1440"
                    value={config.security.accountLockoutTime}
                    onChange={(e) => updateConfig('security', 'accountLockoutTime', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">Limite de API (req/min)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    min="100"
                    max="10000"
                    value={config.security.apiRateLimit}
                    onChange={(e) => updateConfig('security', 'apiRateLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Caracteres Especiais na Senha</Label>
                  <p className="text-sm text-muted-foreground">
                    Exige pelo menos um caractere especial nas senhas
                  </p>
                </div>
                <Switch
                  checked={config.security.passwordRequireSpecialChars}
                  onCheckedChange={(checked) => updateConfig('security', 'passwordRequireSpecialChars', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                <Bell className="h-5 w-5 text-juga-primary" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações importantes por email
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações críticas por SMS
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas de erros e problemas do sistema
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.systemAlerts}
                    onCheckedChange={(checked) => updateConfig('notifications', 'systemAlerts', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Relatórios Automáticos</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Relatórios Diários</Label>
                    <Switch
                      checked={config.notifications.dailyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'dailyReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Relatórios Semanais</Label>
                    <Switch
                      checked={config.notifications.weeklyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'weeklyReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Relatórios Mensais</Label>
                    <Switch
                      checked={config.notifications.monthlyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'monthlyReports', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                <Zap className="h-5 w-5 text-juga-primary" />
                Integrações Externas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Mantenha suas chaves de API seguras. Nunca compartilhe essas informações.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                  <Input
                    id="googleAnalytics"
                    placeholder="G-XXXXXXXXXX"
                    value={config.integrations.googleAnalytics}
                    onChange={(e) => updateConfig('integrations', 'googleAnalytics', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebookPixel"
                    placeholder="123456789012345"
                    value={config.integrations.facebookPixel}
                    onChange={(e) => updateConfig('integrations', 'facebookPixel', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Gateways de Pagamento
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                    <Input
                      id="stripePublicKey"
                      placeholder="pk_test_..."
                      value={config.integrations.stripePublicKey}
                      onChange={(e) => updateConfig('integrations', 'stripePublicKey', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                    <Input
                      id="paypalClientId"
                      placeholder="AXXxxXxXxXxXxX..."
                      value={config.integrations.paypalClientId}
                      onChange={(e) => updateConfig('integrations', 'paypalClientId', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Serviços de Email
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input
                      id="sendgridApiKey"
                      placeholder="SG.xxxxxxxxxxxxxx"
                      type="password"
                      value={config.integrations.sendgridApiKey}
                      onChange={(e) => updateConfig('integrations', 'sendgridApiKey', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awsAccessKey">AWS Access Key</Label>
                    <Input
                      id="awsAccessKey"
                      placeholder="AKIA..."
                      type="password"
                      value={config.integrations.awsAccessKey}
                      onChange={(e) => updateConfig('integrations', 'awsAccessKey', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                <Database className="h-5 w-5 text-juga-primary" />
                Configurações de Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Realizar backups automáticos do sistema
                  </p>
                </div>
                <Switch
                  checked={config.backup.autoBackup}
                  onCheckedChange={(checked) => updateConfig('backup', 'autoBackup', checked)}
                />
              </div>

              {config.backup.autoBackup && (
                <>
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Frequência</Label>
                      <Select 
                        value={config.backup.backupFrequency} 
                        onValueChange={(value) => updateConfig('backup', 'backupFrequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backupTime">Horário do Backup</Label>
                      <Input
                        id="backupTime"
                        type="time"
                        value={config.backup.backupTime}
                        onChange={(e) => updateConfig('backup', 'backupTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retentionPeriod">Retenção (dias)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        min="7"
                        max="365"
                        value={config.backup.retentionPeriod}
                        onChange={(e) => updateConfig('backup', 'retentionPeriod', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backupLocation">Localização dos Backups</Label>
                    <Input
                      id="backupLocation"
                      value={config.backup.backupLocation}
                      onChange={(e) => updateConfig('backup', 'backupLocation', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup na Nuvem</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar backups para armazenamento na nuvem
                      </p>
                    </div>
                    <Switch
                      checked={config.backup.cloudBackup}
                      onCheckedChange={(checked) => updateConfig('backup', 'cloudBackup', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-juga-text-secondary">
                <Zap className="h-5 w-5 text-juga-primary" />
                Configurações de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar cache para melhorar a performance
                  </p>
                </div>
                <Switch
                  checked={config.performance.cacheEnabled}
                  onCheckedChange={(checked) => updateConfig('performance', 'cacheEnabled', checked)}
                />
              </div>

              {config.performance.cacheEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="cacheTimeout">Timeout do Cache (segundos)</Label>
                  <Input
                    id="cacheTimeout"
                    type="number"
                    min="60"
                    max="86400"
                    value={config.performance.cacheTimeout}
                    onChange={(e) => updateConfig('performance', 'cacheTimeout', parseInt(e.target.value))}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compressão Gzip</Label>
                    <p className="text-sm text-muted-foreground">
                      Comprimir respostas para reduzir o tráfego
                    </p>
                  </div>
                  <Switch
                    checked={config.performance.compressionEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'compressionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CDN Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar CDN para servir arquivos estáticos
                    </p>
                  </div>
                  <Switch
                    checked={config.performance.cdnEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'cdnEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otimização de Imagens</Label>
                    <p className="text-sm text-muted-foreground">
                      Otimizar imagens automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={config.performance.imageOptimization}
                    onCheckedChange={(checked) => updateConfig('performance', 'imageOptimization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lazy Loading</Label>
                    <p className="text-sm text-muted-foreground">
                      Carregar imagens sob demanda
                    </p>
                  </div>
                  <Switch
                    checked={config.performance.lazyLoading}
                    onCheckedChange={(checked) => updateConfig('performance', 'lazyLoading', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
