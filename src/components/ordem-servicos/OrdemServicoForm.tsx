'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
}

interface Equipamento {
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
}

interface OrdemServicoFormData {
  cliente: Cliente;
  equipamento: Equipamento;
  problema: string;
  diagnostico?: string;
  solucao?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataPrevisao: string;
  tecnico: string;
  valorServico: number;
  valorPecas: number;
  observacoes: string;
}

interface OrdemServicoFormProps {
  initialData?: Partial<OrdemServicoFormData>;
  onSubmit: (data: OrdemServicoFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

const tiposEquipamento = [
  { value: 'geladeira', label: 'Geladeira' },
  { value: 'maquina_lavar', label: 'Máquina de Lavar' },
  { value: 'ar_condicionado', label: 'Ar Condicionado' },
  { value: 'microondas', label: 'Microondas' },
  { value: 'fogao', label: 'Fogão' },
  { value: 'televisao', label: 'Televisão' },
  { value: 'outros', label: 'Outros' }
];

const prioridades = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
];

export function OrdemServicoForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  title = 'Nova Ordem de Serviço'
}: OrdemServicoFormProps) {
  const [formData, setFormData] = useState<OrdemServicoFormData>({
    cliente: {
      id: '',
      nome: '',
      telefone: '',
      endereco: ''
    },
    equipamento: {
      tipo: '',
      marca: '',
      modelo: '',
      numeroSerie: ''
    },
    problema: '',
    diagnostico: '',
    solucao: '',
    prioridade: 'media',
    dataPrevisao: '',
    tecnico: '',
    valorServico: 0,
    valorPecas: 0,
    observacoes: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cliente.nome.trim()) {
      newErrors['cliente.nome'] = 'Nome do cliente é obrigatório';
    }

    if (!formData.cliente.telefone.trim()) {
      newErrors['cliente.telefone'] = 'Telefone do cliente é obrigatório';
    }

    if (!formData.equipamento.tipo) {
      newErrors['equipamento.tipo'] = 'Tipo do equipamento é obrigatório';
    }

    if (!formData.equipamento.marca.trim()) {
      newErrors['equipamento.marca'] = 'Marca do equipamento é obrigatória';
    }

    if (!formData.problema.trim()) {
      newErrors['problema'] = 'Descrição do problema é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error);
    }
  };

  const updateCliente = (field: keyof Cliente, value: string) => {
    setFormData(prev => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        [field]: value
      }
    }));
    
    // Limpar erro do campo
    if (errors[`cliente.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`cliente.${field}`];
        return newErrors;
      });
    }
  };

  const updateEquipamento = (field: keyof Equipamento, value: string) => {
    setFormData(prev => ({
      ...prev,
      equipamento: {
        ...prev.equipamento,
        [field]: value
      }
    }));
    
    // Limpar erro do campo
    if (errors[`equipamento.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`equipamento.${field}`];
        return newErrors;
      });
    }
  };

  const updateField = (field: keyof OrdemServicoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
          <span className="truncate">{title}</span>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Tabs defaultValue="cliente" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="cliente" className="text-xs sm:text-sm py-2">Cliente</TabsTrigger>
              <TabsTrigger value="equipamento" className="text-xs sm:text-sm py-2">Equipamento</TabsTrigger>
              <TabsTrigger value="servico" className="text-xs sm:text-sm py-2">Serviço</TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs sm:text-sm py-2">Financeiro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cliente" className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="cliente-nome" className="text-sm">Nome do Cliente *</Label>
                  <Input
                    id="cliente-nome"
                    value={formData.cliente.nome}
                    onChange={(e) => updateCliente('nome', e.target.value)}
                    className={`h-9 text-sm ${errors['cliente.nome'] ? 'border-red-500' : ''}`}
                  />
                  {errors['cliente.nome'] && (
                    <p className="text-xs text-red-500">{errors['cliente.nome']}</p>
                  )}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="cliente-telefone" className="text-sm">Telefone *</Label>
                  <Input
                    id="cliente-telefone"
                    value={formData.cliente.telefone}
                    onChange={(e) => updateCliente('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={`h-9 text-sm ${errors['cliente.telefone'] ? 'border-red-500' : ''}`}
                  />
                  {errors['cliente.telefone'] && (
                    <p className="text-xs text-red-500">{errors['cliente.telefone']}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="cliente-endereco" className="text-sm">Endereço</Label>
                <Textarea
                  id="cliente-endereco"
                  value={formData.cliente.endereco}
                  onChange={(e) => updateCliente('endereco', e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="text-sm min-h-[80px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="equipamento" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipamento-tipo">Tipo do Equipamento *</Label>
                  <Select
                    value={formData.equipamento.tipo}
                    onValueChange={(value) => updateEquipamento('tipo', value)}
                  >
                    <SelectTrigger className={errors['equipamento.tipo'] ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEquipamento.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors['equipamento.tipo'] && (
                    <p className="text-sm text-red-500">{errors['equipamento.tipo']}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipamento-marca">Marca *</Label>
                  <Input
                    id="equipamento-marca"
                    value={formData.equipamento.marca}
                    onChange={(e) => updateEquipamento('marca', e.target.value)}
                    className={errors['equipamento.marca'] ? 'border-red-500' : ''}
                  />
                  {errors['equipamento.marca'] && (
                    <p className="text-sm text-red-500">{errors['equipamento.marca']}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipamento-modelo">Modelo</Label>
                  <Input
                    id="equipamento-modelo"
                    value={formData.equipamento.modelo}
                    onChange={(e) => updateEquipamento('modelo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipamento-serie">Número de Série</Label>
                  <Input
                    id="equipamento-serie"
                    value={formData.equipamento.numeroSerie}
                    onChange={(e) => updateEquipamento('numeroSerie', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="servico" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problema">Descrição do Problema *</Label>
                <Textarea
                  id="problema"
                  value={formData.problema}
                  onChange={(e) => updateField('problema', e.target.value)}
                  placeholder="Descreva detalhadamente o problema relatado pelo cliente"
                  className={errors['problema'] ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors['problema'] && (
                  <p className="text-sm text-red-500">{errors['problema']}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  value={formData.diagnostico}
                  onChange={(e) => updateField('diagnostico', e.target.value)}
                  placeholder="Diagnóstico técnico do problema"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="solucao">Solução Aplicada</Label>
                <Textarea
                  id="solucao"
                  value={formData.solucao}
                  onChange={(e) => updateField('solucao', e.target.value)}
                  placeholder="Descrição da solução aplicada"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value: any) => updateField('prioridade', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map(prioridade => (
                        <SelectItem key={prioridade.value} value={prioridade.value}>
                          {prioridade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-previsao">Data de Previsão</Label>
                  <Input
                    id="data-previsao"
                    type="date"
                    value={formData.dataPrevisao}
                    onChange={(e) => updateField('dataPrevisao', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tecnico">Técnico Responsável</Label>
                  <Input
                    id="tecnico"
                    value={formData.tecnico}
                    onChange={(e) => updateField('tecnico', e.target.value)}
                    placeholder="Nome do técnico"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="financeiro" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor-servico">Valor do Serviço (R$)</Label>
                  <Input
                    id="valor-servico"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorServico}
                    onChange={(e) => updateField('valorServico', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor-pecas">Valor das Peças (R$)</Label>
                  <Input
                    id="valor-pecas"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorPecas}
                    onChange={(e) => updateField('valorPecas', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total:</span>
                  <span className="text-lg font-bold">
                    R$ {(formData.valorServico + formData.valorPecas).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isLoading}
              className="w-full sm:w-auto h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto h-9 text-sm"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Ordem
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
