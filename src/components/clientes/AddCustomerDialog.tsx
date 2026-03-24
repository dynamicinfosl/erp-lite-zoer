'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Info, 
  AlertTriangle, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  FileText, 
  X,
  User,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newCustomer: any) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) {
  const { tenant } = useSimpleAuth();
  const { scope, branchId } = useBranch();
  const [loading, setLoading] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    city: '',
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    state: '',
    zipcode: '',
    state_registration: '',
    notes: '',
    type: 'PF' as 'PF' | 'PJ',
    status: 'active' as 'active' | 'inactive'
  });

  const handleAddCustomer = async () => {
    if (!tenant?.id) {
      toast.error('Tenant não disponível');
      return;
    }

    if (!newCustomer.name) {
      toast.error('O nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/next_api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          tenant_id: tenant.id,
          branch_id: scope === 'branch' && branchId ? branchId : null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao adicionar cliente');
      }

      const result = await response.json();
      
      toast.success('Cliente adicionado com sucesso!');
      
      // Reset form
      setNewCustomer({ 
        name: '', email: '', phone: '', document: '', city: '', address: '',
        address_number: '', address_complement: '', neighborhood: '',
        state: '', zipcode: '', state_registration: '', notes: '',
        type: 'PF', status: 'active' 
      });

      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="relative">
          {/* Header com gradiente (Verde Esmeralda para Clientes) */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Adicionar Novo Cliente</DialogTitle>
                <DialogDescription className="text-emerald-100 mt-1">
                  Preencha as informações do cliente abaixo. Os campos com * são obrigatórios.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Conteúdo principal estilizado em dark premium */}
          <div className="p-6 bg-slate-800/50 backdrop-blur-sm space-y-8">
            
            {/* Seção 1: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Informações Básicas
              </h3>
              
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-200">Nome Completo / Razão Social *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Gabriel Silva ou Empresa LTDA"
                    className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-sm font-medium text-slate-200">Tipo de Pessoa</Label>
                    <select 
                      id="type"
                      className="h-11 w-full bg-slate-700/50 border border-slate-600 rounded-md text-white px-3 focus:border-emerald-400 focus:ring-emerald-400/20 outline-none"
                      value={newCustomer.type}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, type: e.target.value as 'PF' | 'PJ' }))}
                    >
                      <option value="PF" className="bg-slate-800">Pessoa Física (CPF)</option>
                      <option value="PJ" className="bg-slate-800">Pessoa Jurídica (CNPJ)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-sm font-medium text-slate-200">Status no Sistema</Label>
                    <select 
                      id="status"
                      className="h-11 w-full bg-slate-700/50 border border-slate-600 rounded-md text-white px-3 focus:border-emerald-400 focus:ring-emerald-400/20 outline-none"
                      value={newCustomer.status}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    >
                      <option value="active" className="bg-slate-800">Ativo</option>
                      <option value="inactive" className="bg-slate-800">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="document" className="text-sm font-medium text-slate-200">CPF / CNPJ</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-white border-slate-700">
                            <p>Somente números. Será normalizado automaticamente.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="document"
                      value={newCustomer.document}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, document: e.target.value.replace(/\D/g, '') }))}
                      placeholder="000.000.000-00"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state_registration" className="text-sm font-medium text-slate-200">Inscrição Estadual</Label>
                    <Input
                      id="state_registration"
                      value={newCustomer.state_registration}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setNewCustomer(prev => ({ ...prev, state_registration: val === 'ISENTO' ? 'ISENTO' : val.replace(/\D/g, '') }));
                      }}
                      placeholder="Digite o Nº ou ISENTO"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Contato e Comunicação */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Contato e Comunicação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-200">E-mail Principal</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="h-11 pl-10 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-200">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="h-11 pl-10 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Endereço Localização */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                Endereço e Localização
              </h3>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="zipcode" className="text-sm font-medium text-slate-200">CEP</Label>
                    <Input
                      id="zipcode"
                      value={newCustomer.zipcode}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, zipcode: e.target.value.replace(/\D/g, '') }))}
                      placeholder="00000-000"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="address" className="text-sm font-medium text-slate-200">Logradouro (Rua, Av.)</Label>
                    <Input
                      id="address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Digite o nome da rua ou avenida"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 md:col-span-1">
                    <Label htmlFor="address_number" className="text-sm font-medium text-slate-200">Número</Label>
                    <Input
                      id="address_number"
                      value={newCustomer.address_number}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address_number: e.target.value }))}
                      placeholder="Nº"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-3">
                    <Label htmlFor="address_complement" className="text-sm font-medium text-slate-200">Complemento</Label>
                    <Input
                      id="address_complement"
                      value={newCustomer.address_complement}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address_complement: e.target.value }))}
                      placeholder="Apto, Bloco, Referência..."
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="neighborhood" className="text-sm font-medium text-slate-200">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={newCustomer.neighborhood}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Nome do bairro"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-sm font-medium text-slate-200">Cidade</Label>
                    <Input
                      id="city"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Cidade"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-sm font-medium text-slate-200">Estado (UF)</Label>
                    <Input
                      id="state"
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                      placeholder="UF"
                      className="h-11 bg-slate-700/50 border-slate-600 focus:border-emerald-400 focus:ring-emerald-400/20 text-white placeholder:text-slate-500 font-bold uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 4: Observações Adicionais */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-2 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Observações Adicionais
              </h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium text-slate-200">Notas e Anotações Internas</Label>
                <textarea
                  id="notes"
                  className="w-full px-3 py-2 border rounded-md min-h-[100px] bg-slate-700/50 border-slate-600 text-white focus:border-emerald-400 focus:ring-emerald-400/20 outline-none placeholder:text-slate-500 resize-none"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Digite informações estratégicas ou observações sobre este cliente..."
                />
              </div>
            </div>
          </div>

          {/* Footer com gradiente estilizado */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-b-lg border-t border-slate-600/50">
            <div className="flex flex-col sm:flex-row gap-3 justify-end text-sm">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
                className="hover:bg-slate-700 text-slate-300 hover:text-white h-11 px-6 font-bold"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddCustomer} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 font-black uppercase tracking-wider transition-all hover:scale-[1.02] shadow-xl shadow-emerald-500/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Adicionando...</span>
                  </div>
                ) : (
                  <span>Criar Novo Cliente</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
