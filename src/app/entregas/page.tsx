'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, Clock, CheckCircle, RefreshCw, MapPin, Package2, Printer, ClipboardList, UsersRound, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { JugaKPICard } from '@/components/dashboard/JugaComponents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import type { Delivery } from '@/types';
import { toast } from 'sonner';
import { Trash2, Edit, X, Plus } from 'lucide-react';

// Funções helper para filtros de data
const isToday = (date: string) => {
  const today = new Date();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

const isYesterday = (date: string) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  return checkDate.toDateString() === yesterday.toDateString();
};

const isThisWeek = (date: string) => {
  const today = new Date();
  const checkDate = new Date(date);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  return checkDate >= weekAgo && checkDate <= today;
};

export default function EntregasPage() {
  const { user, tenant } = useSimpleAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [manifests, setManifests] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingManifests, setLoadingManifests] = useState(false);
  const [creatingForDriver, setCreatingForDriver] = useState<number | null>(null);
  const [finalizingManifest, setFinalizingManifest] = useState<string | null>(null);
  const [deletingManifest, setDeletingManifest] = useState<string | null>(null);
  const [editingManifest, setEditingManifest] = useState<string | null>(null);
  const [deleteDeliveries, setDeleteDeliveries] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState<any>(null);
  const [selectedDeliveries, setSelectedDeliveries] = useState<number[]>([]);
  const [newDriverId, setNewDriverId] = useState<string>('');
  
  // Estados para criação de novo romaneio
  const [showCreateManifestDialog, setShowCreateManifestDialog] = useState(false);
  const [selectedDeliveriesForManifest, setSelectedDeliveriesForManifest] = useState<number[]>([]);
  const [createManifestDriverId, setCreateManifestDriverId] = useState<string>('');
  const [creatingManifest, setCreatingManifest] = useState(false);
  
  // Estados para edição de entrega individual
  const [showEditDeliveryDialog, setShowEditDeliveryDialog] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [editDeliveryDriverId, setEditDeliveryDriverId] = useState<string>('');
  const [savingDelivery, setSavingDelivery] = useState(false);

  const loadDeliveries = useCallback(async () => {
    if (!tenant?.id) {
      setDeliveries([]);
      return;
    }

    try {
      setLoading(true);
      
      // Carregar entregas e vendas canceladas em paralelo
      const [deliveriesRes, salesRes] = await Promise.all([
        fetch(`/next_api/deliveries?tenant_id=${tenant.id}`),
        fetch(`/next_api/sales?tenant_id=${tenant.id}`)
      ]);
      
      if (!deliveriesRes.ok) {
        console.error('Falha na API /next_api/deliveries:', deliveriesRes.status);
        setDeliveries([]);
      } else {
        const data = await deliveriesRes.json();
        const rows = Array.isArray(data?.data) ? data.data : (data?.rows || data || []);
        setDeliveries(Array.isArray(rows) ? rows : []);
      }
      
      // Atualizar vendas canceladas
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        const sales = Array.isArray(salesData?.sales) ? salesData.sales : (salesData?.data || []);
        const cancelledSales = sales.filter((s: any) => s.status === 'cancelada');
        const cancelledIds = new Set<number>(cancelledSales.map((s: any) => Number(s.id)));
        console.log('🔍 Vendas canceladas encontradas:', cancelledSales.length, 'IDs:', Array.from(cancelledIds));
        setCancelledSaleIds(cancelledIds);
      }
    } catch (e) {
      console.error('Falha ao carregar entregas', e);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  const loadDrivers = useCallback(async () => {
    if (!tenant?.id) {
      setDrivers([]);
      return;
    }
    try {
      const res = await fetch(`/next_api/delivery-drivers?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) return setDrivers([]);
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
      const list = Array.isArray(rows) ? rows : [];
      setDrivers(list.map((d: any) => ({ id: Number(d.id), name: d.name })));
    } catch {
      setDrivers([]);
    }
  }, [tenant?.id]);

  const loadManifests = useCallback(async () => {
    if (!tenant?.id) {
      setManifests([]);
      return;
    }
    try {
      setLoadingManifests(true);
      const res = await fetch(`/next_api/delivery-manifests?tenant_id=${encodeURIComponent(tenant.id)}&status=aberta`);
      if (!res.ok) {
        setManifests([]);
      } else {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : (json?.rows || json || []);
        setManifests(Array.isArray(rows) ? rows : []);
      }
    } catch (e) {
      console.error(e);
      setManifests([]);
    } finally {
      setLoadingManifests(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    loadDeliveries();
    loadDrivers();
    loadManifests();
  }, [tenant?.id, loadDeliveries, loadDrivers, loadManifests]);

  const safeDeliveries = useMemo(() => Array.isArray(deliveries) ? deliveries : [], [deliveries]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'aguardando' | 'em_rota' | 'entregue' | 'todas'>('todas');
  const [dateFilter, setDateFilter] = useState<'hoje' | 'ontem' | 'semana' | 'todos'>('hoje');
  const [manifestSearch, setManifestSearch] = useState('');
  const [manifestDateFilter, setManifestDateFilter] = useState<'hoje' | 'ontem' | 'semana' | 'todos'>('hoje');
  const [deletingDelivery, setDeletingDelivery] = useState<number | null>(null);
  const [showDeleteDeliveryDialog, setShowDeleteDeliveryDialog] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);
  const [manifestCustomers, setManifestCustomers] = useState<Map<string, string[]>>(new Map());
  const [cancelledSaleIds, setCancelledSaleIds] = useState<Set<number>>(new Set());

  // Carregar clientes de cada romaneio (safeDeliveries já declarado acima)
  useEffect(() => {
    if (manifests.length === 0 || !tenant?.id) return;
    
    const loadManifestCustomers = async () => {
      const customersMap = new Map<string, string[]>();
      
      for (const manifest of manifests) {
        const deliveriesInManifest = safeDeliveries.filter(
          d => d.manifest_id === manifest.id
        );
        const customerNames = deliveriesInManifest.map(d => d.customer_name);
        customersMap.set(manifest.id, customerNames);
      }
      
      setManifestCustomers(customersMap);
    };
    
    loadManifestCustomers();
  }, [manifests, safeDeliveries, tenant?.id]);
  
  const filtered = useMemo(() => {
    const result = safeDeliveries.filter((d) => {
      const matchesSearch = `${d.id} ${d.customer_name} ${d.delivery_address}`.toLowerCase().includes(search.toLowerCase());
      
      // "todas" = todas ativas (aguardando, em_rota, entregue), sem canceladas
      const matchesStatus = statusFilter === 'todas' 
        ? (d.status === 'aguardando' || d.status === 'em_rota' || d.status === 'entregue')
        : d.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter === 'hoje') {
        matchesDate = isToday(d.created_at);
      } else if (dateFilter === 'ontem') {
        matchesDate = isYesterday(d.created_at);
      } else if (dateFilter === 'semana') {
        matchesDate = isThisWeek(d.created_at);
      }
      
      // Não mostrar entregas de vendas canceladas
      const saleNotCancelled = !d.sale_id || !cancelledSaleIds.has(Number(d.sale_id));
      
      if (d.sale_id && cancelledSaleIds.has(Number(d.sale_id))) {
        console.log('🚫 Filtrando entrega de venda cancelada:', {
          delivery_id: d.id,
          sale_id: d.sale_id,
          customer: d.customer_name
        });
      }
      
      return matchesSearch && matchesStatus && matchesDate && saleNotCancelled;
    });
    
    console.log('📊 Total entregas:', safeDeliveries.length, 'Filtradas:', result.length);
    return result;
  }, [safeDeliveries, search, statusFilter, dateFilter, cancelledSaleIds]);

  const isSelectableForManifest = useCallback((d: Delivery) => {
    return d.status === 'aguardando' && !d.manifest_id;
  }, []);

  const driverNameById = useMemo(() => {
    const m = new Map<number, string>();
    drivers.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [drivers]);

  const selectedSetForManifest = useMemo(() => new Set<number>(selectedDeliveriesForManifest), [selectedDeliveriesForManifest]);

  const eligibleFilteredIds = useMemo(() => {
    return filtered
      .filter(isSelectableForManifest)
      .map((d) => d.id);
  }, [filtered, isSelectableForManifest]);

  const allEligibleSelected = useMemo(() => {
    if (eligibleFilteredIds.length === 0) return false;
    return eligibleFilteredIds.every((id) => selectedSetForManifest.has(id));
  }, [eligibleFilteredIds, selectedSetForManifest]);

  const toggleSelectDeliveryForManifest = useCallback((deliveryId: number, next?: boolean) => {
    setSelectedDeliveriesForManifest((prev) => {
      const set = new Set<number>(prev);
      const has = set.has(deliveryId);
      const shouldAdd = typeof next === 'boolean' ? next : !has;
      if (shouldAdd) set.add(deliveryId);
      else set.delete(deliveryId);
      return Array.from(set);
    });
  }, []);

  const toggleSelectAllEligibleFiltered = useCallback(() => {
    setSelectedDeliveriesForManifest((prev) => {
      const set = new Set<number>(prev);
      const ids = eligibleFilteredIds;
      if (ids.length === 0) return prev;
      const allSelected = ids.every((id) => set.has(id));
      if (allSelected) {
        ids.forEach((id) => set.delete(id));
      } else {
        ids.forEach((id) => set.add(id));
      }
      return Array.from(set);
    });
  }, [eligibleFilteredIds]);

  const openCreateManifestFromSelection = useCallback(() => {
    if (!tenant?.id) return;
    if (selectedDeliveriesForManifest.length === 0) {
      toast.error('Selecione pelo menos uma entrega na lista para gerar o romaneio');
      return;
    }
    setCreateManifestDriverId('');
    setShowCreateManifestDialog(true);
  }, [selectedDeliveriesForManifest.length, tenant?.id]);

  const pendingByDriver = useMemo(() => {
    const map = new Map<number, Delivery[]>();
    safeDeliveries
      .filter((d) => d.status === 'aguardando' && d.driver_id && !d.manifest_id)
      .forEach((d) => {
        const id = Number(d.driver_id);
        const list = map.get(id) || [];
        list.push(d);
        map.set(id, list);
      });
    return map;
  }, [safeDeliveries]);

  const deliveriesCountByManifest = useMemo(() => {
    const map = new Map<string, number>();
    safeDeliveries
      .filter((d) => d.manifest_id)
      .forEach((d) => {
        const id = String(d.manifest_id);
        map.set(id, (map.get(id) || 0) + 1);
      });
    return map;
  }, [safeDeliveries]);

  const openCreateManifestDialog = () => {
    const available = safeDeliveries.filter((d) => 
      d.status === 'aguardando' && !d.manifest_id
    );
    if (available.length === 0) {
      toast.error('Não há entregas disponíveis para criar romaneio');
      return;
    }
    setSelectedDeliveriesForManifest([]);
    setCreateManifestDriverId('');
    setShowCreateManifestDialog(true);
  };

  const createManifest = async () => {
    if (!tenant?.id) return;
    if (selectedDeliveriesForManifest.length === 0) {
      toast.error('Selecione pelo menos uma entrega');
      return;
    }
    
    try {
      setCreatingManifest(true);
      const res = await fetch('/next_api/delivery-manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenant_id: tenant.id, 
          driver_id: createManifestDriverId || null,
          delivery_ids: selectedDeliveriesForManifest 
        }),
      });
      
      if (!res.ok) {
        let errorMessage = 'Erro ao criar romaneio';
        try {
          const errorData = await res.json();
          errorMessage = errorData.errorMessage || errorData.error || errorMessage;
        } catch {
          const txt = await res.text();
          errorMessage = txt || `HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const json = await res.json();
      toast.success('Romaneio criado com sucesso');
      setShowCreateManifestDialog(false);
      setSelectedDeliveriesForManifest([]);
      setCreateManifestDriverId('');
      await loadDeliveries();
      await loadManifests();
    } catch (e: any) {
      console.error('Erro ao criar romaneio:', e);
      const errorMessage = e?.message || 'Erro ao criar romaneio';
      toast.error(errorMessage);
    } finally {
      setCreatingManifest(false);
    }
  };

  const createManifestForDriver = async (driverId: number) => {
    if (!tenant?.id) return;
    const driverDeliveries = safeDeliveries.filter((d) => 
      d.status === 'aguardando' && 
      d.driver_id === driverId && 
      !d.manifest_id
    ).map((d) => d.id);
    
    if (driverDeliveries.length === 0) {
      toast.error('Não há entregas disponíveis para este entregador');
      return;
    }
    
    try {
      setCreatingForDriver(driverId);
      const res = await fetch('/next_api/delivery-manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenant_id: tenant.id, 
          driver_id: driverId,
          delivery_ids: driverDeliveries 
        }),
      });
      
      if (!res.ok) {
        let errorMessage = 'Erro ao criar romaneio';
        try {
          const errorData = await res.json();
          errorMessage = errorData.errorMessage || errorData.error || errorMessage;
        } catch {
          const txt = await res.text();
          errorMessage = txt || `HTTP ${res.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const json = await res.json();
      const manifest = json?.data || json;
      toast.success('Romaneio criado com sucesso');
      await loadDeliveries();
      await loadManifests();
    } catch (e: any) {
      console.error('Erro ao criar romaneio:', e);
      const errorMessage = e?.message || 'Erro ao criar romaneio';
      toast.error(errorMessage);
    } finally {
      setCreatingForDriver(null);
    }
  };

  const finalizeManifest = async (manifestId: string) => {
    if (!tenant?.id) return;
    if (!confirm('Finalizar este romaneio? (poderá criar um novo para o entregador)')) return;
    try {
      setFinalizingManifest(manifestId);
      const res = await fetch(`/next_api/delivery-manifests?id=${encodeURIComponent(manifestId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'finalizada' }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      toast.success('Romaneio finalizado');
      await loadManifests();
      await loadDeliveries();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao finalizar romaneio');
    } finally {
      setFinalizingManifest(null);
    }
  };

  const handleDeleteManifest = (manifest: any) => {
    setSelectedManifest(manifest);
    setDeleteDeliveries(false);
    setShowDeleteDialog(true);
  };

  const confirmDeleteManifest = async () => {
    if (!tenant?.id || !selectedManifest) return;
    try {
      setDeletingManifest(selectedManifest.id);
      const res = await fetch(
        `/next_api/delivery-manifests?id=${encodeURIComponent(selectedManifest.id)}&delete_deliveries=${deleteDeliveries}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json();
      toast.success(json.message || 'Romaneio deletado com sucesso');
      await loadManifests();
      await loadDeliveries();
      setShowDeleteDialog(false);
      setSelectedManifest(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao deletar romaneio');
    } finally {
      setDeletingManifest(null);
    }
  };

  const handleEditManifest = async (manifest: any) => {
    if (!tenant?.id) return;
    try {
      // Buscar entregas vinculadas ao romaneio
      const res = await fetch(`/next_api/delivery-manifests/${manifest.id}?tenant_id=${encodeURIComponent(tenant.id)}`);
      if (!res.ok) throw new Error('Erro ao carregar dados do romaneio');
      const json = await res.json();
      const data = json.data || json;
      
      setSelectedManifest(manifest);
      setNewDriverId(String(manifest.driver_id));
      setSelectedDeliveries((data.deliveries || []).map((d: any) => d.id));
      setShowEditDialog(true);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao carregar dados do romaneio');
    }
  };

  const confirmEditManifest = async () => {
    if (!tenant?.id || !selectedManifest) return;
    try {
      setEditingManifest(selectedManifest.id);
      const res = await fetch(`/next_api/delivery-manifests?id=${encodeURIComponent(selectedManifest.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: newDriverId ? Number(newDriverId) : null,
          delivery_ids: selectedDeliveries,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      toast.success('Romaneio atualizado com sucesso');
      await loadManifests();
      await loadDeliveries();
      setShowEditDialog(false);
      setSelectedManifest(null);
      setSelectedDeliveries([]);
      setNewDriverId('');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao atualizar romaneio');
    } finally {
      setEditingManifest(null);
    }
  };

  const handleEditDelivery = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setEditDeliveryDriverId(delivery.driver_id ? String(delivery.driver_id) : '');
    setShowEditDeliveryDialog(true);
  };

  const confirmEditDelivery = async () => {
    if (!editingDelivery || !editDeliveryDriverId) {
      toast.error('Selecione um entregador');
      return;
    }
    
    try {
      setSavingDelivery(true);
      const res = await fetch(`/next_api/deliveries?id=${editingDelivery.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: parseInt(editDeliveryDriverId),
        }),
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      
      toast.success('Entrega atualizada com sucesso');
      await loadDeliveries();
      setShowEditDeliveryDialog(false);
      setEditingDelivery(null);
      setEditDeliveryDriverId('');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao atualizar entrega');
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleDeleteDelivery = (delivery: Delivery) => {
    setDeliveryToDelete(delivery);
    setShowDeleteDeliveryDialog(true);
  };

  const confirmDeleteDelivery = async () => {
    if (!deliveryToDelete) return;
    
    try {
      setDeletingDelivery(deliveryToDelete.id);
      const res = await fetch(`/next_api/deliveries?id=${deliveryToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      
      toast.success('Entrega excluída com sucesso');
      await loadDeliveries();
      setShowDeleteDeliveryDialog(false);
      setDeliveryToDelete(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erro ao excluir entrega');
    } finally {
      setDeletingDelivery(null);
    }
  };

  // Buscar entregas disponíveis para edição
  const availableDeliveries = useMemo(() => {
    return safeDeliveries.filter((d) => 
      d.status === 'aguardando' || 
      d.status === 'em_rota' ||
      (selectedManifest && d.manifest_id === selectedManifest.id)
    );
  }, [safeDeliveries, selectedManifest]);

  // Buscar vendas para exibir números no modal de edição
  const [salesForEdit, setSalesForEdit] = useState<Map<number, any>>(new Map());
  
  useEffect(() => {
    if (showEditDialog && availableDeliveries.length > 0) {
      const saleIds = availableDeliveries
        .map((d) => d.sale_id)
        .filter(Boolean)
        .map((id) => Number(id));
      
      if (saleIds.length > 0) {
        fetch(`/next_api/sales?tenant_id=${encodeURIComponent(tenant?.id || '')}`)
          .then((res) => res.json())
          .then((data) => {
            const salesMap = new Map<number, any>();
            const salesList = data.sales || data.data || [];
            salesList.forEach((sale: any) => {
              if (saleIds.includes(Number(sale.id))) {
                salesMap.set(Number(sale.id), sale);
              }
            });
            setSalesForEdit(salesMap);
          })
          .catch((e) => console.error('Erro ao buscar vendas:', e));
      }
    }
  }, [showEditDialog, availableDeliveries, tenant?.id]);

  const stats = useMemo(() => {
    const emRota = safeDeliveries.filter(d => d.status === 'em_rota').length;
    const aguardando = safeDeliveries.filter(d => d.status === 'aguardando').length;
    const entregues = safeDeliveries.filter(d => d.status === 'entregue').length;
    const total = safeDeliveries.length;
    
    return { emRota, aguardando, entregues, total };
  }, [safeDeliveries]);

  const filteredManifests = useMemo(() => {
    return manifests.filter((m) => {
      const matchesSearch = manifestSearch === '' || 
        `${m.manifest_number || ''} ${m.id}`.toLowerCase().includes(manifestSearch.toLowerCase()) ||
        (m.driver_id && driverNameById.get(Number(m.driver_id))?.toLowerCase().includes(manifestSearch.toLowerCase()));
      
      let matchesDate = true;
      if (manifestDateFilter === 'hoje') {
        matchesDate = isToday(m.created_at);
      } else if (manifestDateFilter === 'ontem') {
        matchesDate = isYesterday(m.created_at);
      } else if (manifestDateFilter === 'semana') {
        matchesDate = isThisWeek(m.created_at);
      }
      
      return matchesSearch && matchesDate;
    });
  }, [manifests, manifestSearch, manifestDateFilter, driverNameById]);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsivo */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-heading">Entregas</h1>
        <p className="text-sm sm:text-base text-body">
          Gerencie e acompanhe todas as entregas em tempo real
        </p>
      </div>

      {/* KPI Cards - Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <JugaKPICard
          title="Total de Entregas"
          value={`${stats.total}`}
          description="Entregas registradas"
          trend="up"
          trendValue="+8.2%"
          icon={<Package2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="primary"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Em Rota"
          value={`${stats.emRota}`}
          description="Saíram para entrega"
          trend="up"
          trendValue="Ativas"
          icon={<Truck className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="accent"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Aguardando"
          value={`${stats.aguardando}`}
          description="Aguardando saída"
          trend="down"
          trendValue="Requer atenção"
          icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="warning"
          className="min-h-[120px] sm:min-h-[140px]"
        />
        <JugaKPICard
          title="Entregues"
          value={`${stats.entregues}`}
          description="Finalizadas"
          trend="up"
          trendValue="+12.5%"
          icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="success"
          className="min-h-[120px] sm:min-h-[140px]"
        />
      </div>

      {/* Botão criar novo romaneio */}
      <Card className="juga-card">
        <CardContent className="pt-6">
          <Button 
            onClick={openCreateManifestDialog}
            className="juga-gradient text-white gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Criar Novo Romaneio
          </Button>
        </CardContent>
      </Card>

      {/* Romaneios abertos */}
      <Card className="juga-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl text-heading flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Romaneios Abertos
              </CardTitle>
              <CardDescription className="text-sm">
                Gerencie os romaneios de entrega. Finalize quando o entregador retornar.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input 
                placeholder="Buscar romaneio..." 
                value={manifestSearch} 
                onChange={(e) => setManifestSearch(e.target.value)} 
                className="w-full sm:w-48" 
              />
              <Select value={manifestDateFilter} onValueChange={(value: any) => setManifestDateFilter(value)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="todos">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingManifests ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3"></div>
              <p>Carregando romaneios...</p>
            </div>
          ) : filteredManifests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhum romaneio encontrado.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Entregador</TableHead>
                      <TableHead>Qtd. Entregas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManifests.map((m: any) => {
                      const customers = manifestCustomers.get(m.id) || [];
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium text-heading">
                            <div>
                              <div>{m.manifest_number || `Entrega ${m.id.slice(0, 8)}`}</div>
                              {customers.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {customers.join(', ')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-body">
                            {m.driver_id ? (driverNameById.get(Number(m.driver_id)) || `#${m.driver_id}`) : '—'}
                          </TableCell>
                          <TableCell className="text-body">
                            {deliveriesCountByManifest.get(String(m.id)) || 0}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Aberto</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/entregas/romaneio/${m.id}/a4`, '_blank')}
                                className="gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                A4
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/entregas/romaneio/${m.id}/cupom`, '_blank')}
                                className="gap-2"
                              >
                                <Printer className="h-4 w-4" />
                                Cupom
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditManifest(m)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-2"
                                onClick={() => finalizeManifest(String(m.id))}
                                disabled={finalizingManifest === String(m.id)}
                              >
                                <Check className="h-4 w-4" />
                                {finalizingManifest === String(m.id) ? 'Finalizando...' : 'Finalizar'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteManifest(m)}
                                disabled={deletingManifest === String(m.id)}
                                className="gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingManifest === String(m.id) ? 'Excluindo...' : 'Excluir'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pendências por Entregador */}
      <Card className="juga-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl text-heading flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Vendas marcadas para entrega (aguardando)
          </CardTitle>
          <CardDescription className="text-sm">
            Gere o romaneio para o entregador (vai mover as entregas para <strong>Em rota</strong>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Array.from(pendingByDriver.entries()).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhuma entrega aguardando com entregador vinculado.</p>
              <p className="text-xs mt-2">No PDV, finalize a venda e marque “É entrega” (o entregador agora é opcional).</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(pendingByDriver.entries()).map(([driverId, list]) => (
                <div key={driverId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-lg p-4">
                  <div>
                    <div className="font-semibold text-heading">
                      {driverNameById.get(driverId) || `Entregador #${driverId}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {list.length} {list.length === 1 ? 'entrega aguardando' : 'entregas aguardando'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="juga-gradient text-white gap-2"
                      onClick={() => createManifestForDriver(driverId)}
                      disabled={creatingForDriver === driverId}
                    >
                      <ClipboardList className="h-4 w-4" />
                      {creatingForDriver === driverId ? 'Gerando...' : 'Gerar Romaneio'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Entregas */}
      <Card className="juga-card">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl text-heading">Lista de Entregas</CardTitle>
                <CardDescription className="text-sm">
                  {filtered.length} {filtered.length === 1 ? 'entrega encontrada' : 'entregas encontradas'}
                  {dateFilter === 'hoje' && ' (somente hoje)'}
                  {dateFilter === 'ontem' && ' (somente ontem)'}
                  {dateFilter === 'semana' && ' (desta semana)'}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDeliveriesForManifest([])}
                  disabled={selectedDeliveriesForManifest.length === 0}
                >
                  Limpar seleção ({selectedDeliveriesForManifest.length})
                </Button>
                <Button
                  className="juga-gradient text-white gap-2"
                  onClick={openCreateManifestFromSelection}
                  disabled={selectedDeliveriesForManifest.length === 0}
                >
                  <ClipboardList className="h-4 w-4" />
                  Gerar Romaneio ({selectedDeliveriesForManifest.length})
                </Button>
              </div>
            </div>
            
            {/* Filtros de pesquisa */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Input 
                placeholder="Buscar por ID, cliente..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full sm:w-64" 
              />
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas ativas</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="em_rota">Em rota</SelectItem>
                  <SelectItem value="entregue">Entregues</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="todos">Todas as datas</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={loadDeliveries} 
                disabled={loading}
                variant="outline"
                className="w-full sm:w-auto gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allEligibleSelected}
                        onCheckedChange={() => toggleSelectAllEligibleFiltered()}
                        aria-label="Selecionar entregas elegíveis"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Entregador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aberta em</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!loading ? filtered : []).map((d) => (
                    <TableRow key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <Checkbox
                          checked={selectedSetForManifest.has(d.id)}
                          disabled={!isSelectableForManifest(d)}
                          onCheckedChange={(checked) => toggleSelectDeliveryForManifest(d.id, checked === true)}
                          aria-label={`Selecionar entrega ${d.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-body">{d.id}</TableCell>
                      <TableCell className="font-medium text-heading">
                        {d.customer_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.delivery_address}
                      </TableCell>
                      <TableCell className="text-sm text-body">
                        {d.driver_id ? (driverNameById.get(Number(d.driver_id)) || `#${d.driver_id}`) : '—'}
                      </TableCell>
                      <TableCell>
                        {d.status === 'aguardando' && <Badge variant="outline">Aguardando</Badge>}
                        {d.status === 'em_rota' && <Badge variant="default">Em rota</Badge>}
                        {d.status === 'entregue' && (
                          <Badge className="bg-green-600 hover:bg-green-700">Entregue</Badge>
                        )}
                        {d.status === 'cancelada' && (
                          <Badge variant="destructive">Cancelada</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-body">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm text-body">
                        {d.delivered_at ? new Date(d.delivered_at).toLocaleDateString('pt-BR') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDelivery(d)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDelivery(d)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma entrega encontrada</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-3"></div>
              <p>Carregando entregas...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Excluir Romaneio</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir o romaneio <strong className="text-gray-900 dark:text-gray-100">{selectedManifest?.manifest_number || selectedManifest?.id}</strong>?
              <br />
              <br />
              Este romaneio possui {deliveriesCountByManifest.get(String(selectedManifest?.id)) || 0} entrega(s) vinculada(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-deliveries"
                checked={deleteDeliveries}
                onCheckedChange={(checked) => setDeleteDeliveries(checked === true)}
              />
              <Label htmlFor="delete-deliveries" className="cursor-pointer">
                Excluir também as entregas vinculadas
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-6">
              {deleteDeliveries
                ? 'As entregas serão permanentemente excluídas.'
                : 'As entregas voltarão para o status "Aguardando" e poderão ser vinculadas a outro romaneio.'}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteManifest}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingManifest !== null}
            >
              {deletingManifest ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Romaneio</DialogTitle>
            <DialogDescription>
              Altere o entregador ou as entregas vinculadas ao romaneio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="driver-select">Entregador (opcional)</Label>
              <Select value={newDriverId} onValueChange={setNewDriverId}>
                <SelectTrigger id="driver-select">
                  <SelectValue placeholder="Selecione o entregador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem entregador</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entregas ({selectedDeliveries.length} selecionadas)</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto mt-2">
                {availableDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma entrega disponível
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableDeliveries.map((d) => {
                      const sale = salesForEdit.get(Number(d.sale_id));
                      return (
                        <div key={d.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`delivery-${d.id}`}
                            checked={selectedDeliveries.includes(d.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDeliveries([...selectedDeliveries, d.id]);
                              } else {
                                setSelectedDeliveries(selectedDeliveries.filter((id) => id !== d.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`delivery-${d.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="font-medium">{d.customer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {d.delivery_address}
                              {sale?.sale_number && ` • Venda #${sale.sale_number}`}
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEditManifest}
              disabled={editingManifest !== null || selectedDeliveries.length === 0}
            >
              {editingManifest ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação de Romaneio */}
      <Dialog open={showCreateManifestDialog} onOpenChange={setShowCreateManifestDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Romaneio</DialogTitle>
            <DialogDescription>
              Selecione as entregas que deseja incluir no romaneio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="manifest-driver-select">Entregador (opcional)</Label>
              <Select value={createManifestDriverId} onValueChange={setCreateManifestDriverId}>
                <SelectTrigger id="manifest-driver-select">
                  <SelectValue placeholder="Selecione o entregador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem entregador</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Entregas Disponíveis ({selectedDeliveriesForManifest.length} selecionadas)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const available = safeDeliveries.filter((d) => 
                      d.status === 'aguardando' && !d.manifest_id
                    );
                    if (selectedDeliveriesForManifest.length === available.length) {
                      setSelectedDeliveriesForManifest([]);
                    } else {
                      setSelectedDeliveriesForManifest(available.map((d) => d.id));
                    }
                  }}
                >
                  {selectedDeliveriesForManifest.length === safeDeliveries.filter((d) => 
                    d.status === 'aguardando' && !d.manifest_id
                  ).length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {safeDeliveries.filter((d) => d.status === 'aguardando' && !d.manifest_id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma entrega disponível
                  </p>
                ) : (
                  <div className="space-y-2">
                    {safeDeliveries
                      .filter((d) => d.status === 'aguardando' && !d.manifest_id)
                      .map((d) => (
                        <div key={d.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`manifest-delivery-${d.id}`}
                            checked={selectedDeliveriesForManifest.includes(d.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDeliveriesForManifest([...selectedDeliveriesForManifest, d.id]);
                              } else {
                                setSelectedDeliveriesForManifest(selectedDeliveriesForManifest.filter((id) => id !== d.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`manifest-delivery-${d.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="font-medium">{d.customer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {d.delivery_address}
                              {d.driver_id && ` • Entregador: ${driverNameById.get(Number(d.driver_id)) || `#${d.driver_id}`}`}
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateManifestDialog(false)} disabled={creatingManifest}>
              Cancelar
            </Button>
            <Button
              onClick={createManifest}
              disabled={creatingManifest || selectedDeliveriesForManifest.length === 0}
            >
              {creatingManifest ? 'Criando...' : 'Criar Romaneio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Entrega Individual */}
      <Dialog open={showEditDeliveryDialog} onOpenChange={setShowEditDeliveryDialog}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
            <DialogDescription>
              Altere o entregador responsável por esta entrega
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingDelivery && (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Cliente:</strong> {editingDelivery.customer_name}
                </div>
                <div className="text-sm">
                  <strong>Endereço:</strong> {editingDelivery.delivery_address}
                </div>
                <div className="text-sm">
                  <strong>Status:</strong> {editingDelivery.status}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="delivery-driver-select">Entregador</Label>
              <Select value={editDeliveryDriverId} onValueChange={setEditDeliveryDriverId}>
                <SelectTrigger id="delivery-driver-select">
                  <SelectValue placeholder="Selecione o entregador" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDeliveryDialog(false);
                setEditingDelivery(null);
                setEditDeliveryDriverId('');
              }}
              disabled={savingDelivery}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmEditDelivery}
              disabled={savingDelivery || !editDeliveryDriverId}
            >
              {savingDelivery ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão de Entrega Individual */}
      <AlertDialog open={showDeleteDeliveryDialog} onOpenChange={setShowDeleteDeliveryDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Excluir Entrega</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir esta entrega?
              {deliveryToDelete && (
                <>
                  <br />
                  <br />
                  <strong className="text-gray-900 dark:text-gray-100">Cliente:</strong> {deliveryToDelete.customer_name}
                  <br />
                  <strong className="text-gray-900 dark:text-gray-100">Endereço:</strong> {deliveryToDelete.delivery_address}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDelivery}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingDelivery !== null}
            >
              {deletingDelivery ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}