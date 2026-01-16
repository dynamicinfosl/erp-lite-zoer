'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TenantPageWrapper } from '@/components/layout/PageWrapper';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Tag, Trash2 } from 'lucide-react';

type PriceType = {
  id: number;
  tenant_id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function ValoresVendaPage() {
  const { tenant } = useSimpleAuth();
  const tenantId = tenant?.id;

  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<PriceType[]>([]);
  const [newName, setNewName] = useState('');

  const loadTypes = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/next_api/product-price-types?tenant_id=${encodeURIComponent(tenantId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar tipos');
      setTypes(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar tipos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    loadTypes();
  }, [tenantId, loadTypes]);

  const activeCount = useMemo(() => types.filter((t) => t.is_active).length, [types]);

  const createType = async () => {
    if (!tenantId) return;
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch('/next_api/product-price-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, name }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao criar tipo');
      setNewName('');
      toast.success('Tipo criado');
      await loadTypes();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar tipo');
    }
  };

  const deactivateType = async (id: number) => {
    if (!tenantId) return;
    if (!window.confirm('Desativar este tipo? (não remove preços já cadastrados)')) return;
    try {
      const res = await fetch(
        `/next_api/product-price-types?tenant_id=${encodeURIComponent(tenantId)}&id=${encodeURIComponent(String(id))}`,
        { method: 'DELETE' }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Erro ao desativar tipo');
      toast.success('Tipo desativado');
      await loadTypes();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao desativar tipo');
    }
  };

  return (
    <TenantPageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Valores de Venda
            </h1>
            <p className="text-sm text-muted-foreground">
              Cadastre tipos de valores de venda (ex.: Varejo, Atacado, Cartão). Importações com colunas “Valor ...”
              criam automaticamente quando necessário.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {activeCount} ativos
          </Badge>
        </div>

        <Card className="juga-card">
          <CardHeader>
            <CardTitle className="text-heading">Criar novo tipo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Valor atacado"
              className="sm:max-w-md"
            />
            <Button onClick={createType} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Criar
            </Button>
          </CardContent>
        </Card>

        <Card className="juga-card">
          <CardHeader>
            <CardTitle className="text-heading">Tipos cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando...</div>
            ) : types.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Nenhum tipo cadastrado ainda. Você pode criar manualmente aqui ou deixar que a importação crie
                automaticamente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types.map((t) => (
                      <TableRow key={t.id} className={!t.is_active ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                        <TableCell>
                          <Badge variant={t.is_active ? 'default' : 'secondary'}>
                            {t.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateType(t.id)}
                            disabled={!t.is_active}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Desativar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantPageWrapper>
  );
}

