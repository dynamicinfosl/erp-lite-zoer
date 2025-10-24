'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, CreditCard, Calendar, Save, Loader2, UserCog, Lock } from 'lucide-react';

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  created_at?: string;
}

export default function PerfilUsuarioPage() {
  const { user, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Funções de máscara
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  };

  const formatRG = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}-${numbers.slice(8)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    rg: '',
    birth_date: '',
    gender: '',
  });

  const [originalFormData, setOriginalFormData] = useState(formData);

  const loadUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Carregar dados do user_metadata ou usar valores padrão
      const userData = {
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        cpf: user.user_metadata?.cpf || '',
        rg: user.user_metadata?.rg || '',
        birth_date: user.user_metadata?.birth_date || '',
        gender: user.user_metadata?.gender || '',
      };

      console.log('👤 Dados do usuário carregados:', userData);

      setFormData(userData);
      setOriginalFormData(userData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadUserData();
  }, [user, authLoading, loadUserData]);

  // Auto-esconder mensagem de sucesso após 5 segundos
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    try {
      setSaving(true);

      console.log('💾 Salvando dados do usuário:', formData);

      const response = await fetch('/next_api/user-profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar dados');
      }

      console.log('✅ Dados salvos com sucesso:', result);
      
      setShowSuccessMessage(true);
      setOriginalFormData(formData);
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao salvar dados: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Usuário não encontrado</CardTitle>
            <CardDescription>
              Não foi possível carregar os dados do usuário.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Perfil do Usuário</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e dados de acesso
            </p>
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-green-800 font-medium">Dados do usuário atualizados com sucesso!</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-600 hover:bg-green-100"
          >
            ✕
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="dados-gerais" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dados-gerais" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados Gerais
            </TabsTrigger>
            <TabsTrigger value="acesso" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Dados de Acesso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados-gerais" className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Atualize seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primeira linha: Nome completo */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nome Completo
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite seu nome completo"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Segunda linha: CPF, RG */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      className="h-11"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rg" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      RG
                    </Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: formatRG(e.target.value) })}
                      placeholder="00.000.000-0"
                      className="h-11"
                      maxLength={12}
                    />
                  </div>
                </div>

                {/* Terceira linha: Data de nascimento, Sexo */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sexo
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="flex h-11 w-full rounded-md border border-input bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm text-gray-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                {/* Quarta linha: Telefone */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                      className="h-11"
                      maxLength={15}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acesso" className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Lock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  Dados de Acesso
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Gerencie seu e-mail e senha de acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* E-mail (somente leitura) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="h-11 bg-muted"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    O e-mail não pode ser alterado. Entre em contato com o suporte se necessário.
                  </p>
                </div>

                {/* Seção de alteração de senha */}
                <div className="pt-6 border-t dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Lock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    Segurança
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Senha</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">••••••••••••</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="ml-4 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-500"
                        onClick={() => alert('Funcionalidade de alteração de senha em desenvolvimento')}
                      >
                        🔑 Alterar senha
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Autenticação em duas etapas</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Adicione mais segurança à sua conta</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="ml-4 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-500"
                        onClick={() => alert('Funcionalidade de 2FA em desenvolvimento')}
                      >
                        🛡️ Habilitar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData(originalFormData)}
            disabled={saving || loading}
            className="min-w-[120px]"
          >
            <span>✕</span>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving || loading}
            className="min-w-[120px] bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

