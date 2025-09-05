
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Truck, MapPin, Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { Delivery, DeliveryDriver } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);
  const [driverFormData, setDriverFormData] = useState({
    name: '',
    phone: '',
    vehicle_type: '',
    vehicle_plate: '',
  });

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const data = await api.get<Delivery[]>('/deliveries');
      setDeliveries(data);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await api.get<DeliveryDriver[]>('/delivery-drivers');
      setDrivers(data);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: number, status: string, driverId?: number) => {
    try {
      const updateData: any = { status };
      if (driverId !== undefined) {
        updateData.driver_id = driverId;
      }

      await api.put(`/deliveries?id=${deliveryId}`, updateData);
      toast.success('Status da entrega atualizado');
      fetchDeliveries();
    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      toast.error('Erro ao atualizar entrega');
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driverFormData.name || !driverFormData.phone || !driverFormData.vehicle_type) {
      toast.error('Nome, telefone e tipo de veículo são obrigatórios');
      return;
    }

    try {
      if (editingDriver) {
        await api.put(`/delivery-drivers?id=${editingDriver.id}`, driverFormData);
        toast.success('Entregador atualizado com sucesso');
      } else {
        await api.post('/delivery-drivers', driverFormData);
        toast.success('Entregador criado com sucesso');
      }

      setShowDriverDialog(false);
      setEditingDriver(null);
      resetDriverForm();
      fetchDrivers();
    } catch (error) {
      console.error('Erro ao salvar entregador:', error);
      toast.error('Erro ao salvar entregador');
    }
  };

  const handleEditDriver = (driver: DeliveryDriver) => {
    setEditingDriver(driver);
    setDriverFormData({
      name: driver.name,
      phone: driver.phone,
      vehicle_type: driver.vehicle_type,
      vehicle_plate: driver.vehicle_plate || '',
    });
    setShowDriverDialog(true);
  };

  const handleDeleteDriver = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este entregador?')) return;

    try {
      await api.delete(`/delivery-drivers?id=${id}`);
      toast.success('Entregador excluído com sucesso');
      fetchDrivers();
    } catch (error) {
      console.error('Erro ao excluir entregador:', error);
      toast.error('Erro ao excluir entregador');
    }
  };

  const resetDriverForm = () => {
    setDriverFormData({
      name: '',
      phone: '',
      vehicle_type: '',
      vehicle_plate: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Aguardando</Badge>;
      case 'em_rota':
        return <Badge variant="default"><Truck className="h-3 w-3 mr-1" />Em Rota</Badge>;
      case 'entregue':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Entregue</Badge>;
      case 'cancelada':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDriverName = (driverId?: number) => {
    if (!driverId) return 'Não atribuído';
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Entregador não encontrado';
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayDeliveries = deliveries.filter(delivery => {
    const today = new Date().toISOString().split('T')[0];
    return delivery.created_at.startsWith(today);
  });

  const deliveryStats = {
    total: todayDeliveries.length,
    aguardando: todayDeliveries.filter(d => d.status === 'aguardando').length,
    em_rota: todayDeliveries.filter(d => d.status === 'em_rota').length,
    entregue: todayDeliveries.filter(d => d.status === 'entregue').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Entregas</h1>
          <p className="text-muted-foreground">
            Controle entregas e gerencie entregadores
          </p>
        </div>
        <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetDriverForm(); setEditingDriver(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Entregador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDriver ? 'Editar Entregador' : 'Novo Entregador'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={driverFormData.name}
                  onChange={(e) => setDriverFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={driverFormData.phone}
                  onChange={(e) => setDriverFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipo de Veículo *</Label>
                <Select
                  value={driverFormData.vehicle_type}
                  onValueChange={(value) => setDriverFormData(prev => ({ ...prev, vehicle_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="bicicleta">Bicicleta</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Placa do Veículo</Label>
                <Input
                  id="vehicle_plate"
                  value={driverFormData.vehicle_plate}
                  onChange={(e) => setDriverFormData(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDriverDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDriver ? 'Atualizar' : 'Criar'} Entregador
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoje</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{deliveryStats.aguardando}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Rota</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{deliveryStats.em_rota}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveryStats.entregue}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entregas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="entregadores">Entregadores</TabsTrigger>
        </TabsList>

        <TabsContent value="entregas" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={fetchDeliveries}>
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Entregas */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Entregas ({filteredDeliveries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Entregador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{delivery.customer_name}</div>
                            {delivery.phone && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {delivery.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm">{delivery.delivery_address}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{getDriverName(delivery.driver_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(delivery.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {delivery.status === 'aguardando' && (
                              <>
                                <Select
                                  onValueChange={(driverId) => 
                                    handleUpdateDeliveryStatus(delivery.id, 'em_rota', parseInt(driverId))
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Atribuir" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {drivers.map(driver => (
                                      <SelectItem key={driver.id} value={driver.id.toString()}>
                                        {driver.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            {delivery.status === 'em_rota' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateDeliveryStatus(delivery.id, 'entregue')}
                              >
                                Marcar Entregue
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!loading && filteredDeliveries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma entrega encontrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregadores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Entregadores ({drivers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="font-medium">{driver.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{driver.vehicle_type}</div>
                          {driver.vehicle_plate && (
                            <div className="text-sm text-muted-foreground">{driver.vehicle_plate}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={driver.is_active ? 'default' : 'secondary'}>
                          {driver.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDriver(driver)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteDriver(driver.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {drivers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum entregador cadastrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
