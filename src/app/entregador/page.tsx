
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, CheckCircle, Truck, Navigation } from 'lucide-react';
import { Delivery as DeliveryType } from '@/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/constants/auth';

interface Delivery {
  id: string
  orderId: string
  customerName: string
  address: string
  status: 'pending' | 'in-progress' | 'delivered' | 'cancelled' | 'em_rota' | 'aguardando' | 'entregue'
  scheduledAt: string
  deliveredAt?: string | null
  notes?: string
  created_at: string
}

export default function EntregadorPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyDeliveries();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMyDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      
      if (ENABLE_AUTH) {
        // Buscar entregas do entregador logado
        const data = await api.get<Delivery[]>('/deliveries');
        // Filtrar apenas entregas atribuídas ao entregador atual
        // Em um cenário real, isso seria filtrado no backend
        const today = new Date().toISOString().split('T')[0];
        const myDeliveries = data.filter(delivery => 
          delivery.created_at.startsWith(today) && 
          (delivery.status === 'em_rota' || delivery.status === 'aguardando')
        );
        setDeliveries(myDeliveries);
      } else {
        // Usar dados mockados quando autenticação estiver desabilitada
        const mockDeliveries: Delivery[] = [
          {
            id: '1',
            orderId: 'PED-1024',
            customerName: 'Gabriel Oliveira',
            address: 'Av. Paulista, 1500 - São Paulo/SP',
            status: 'pending',
            scheduledAt: '2025-09-24T10:00:00',
            notes: 'Cliente prefere entrega na parte da tarde',
            created_at: '2025-09-24T08:00:00',
          },
          {
            id: '2',
            orderId: 'PED-1025',
            customerName: 'Mariana Santos',
            address: 'Rua das Flores, 250 - Belo Horizonte/MG',
            status: 'in-progress',
            scheduledAt: '2025-09-24T09:30:00',
            notes: 'Condomínio com porteiro',
            created_at: '2025-09-24T08:30:00',
          },
          {
            id: '3',
            orderId: 'PED-1026',
            customerName: 'Carlos Souza',
            address: 'Rua XV de Novembro, 780 - Curitiba/PR',
            status: 'delivered',
            scheduledAt: '2025-09-23T14:00:00',
            deliveredAt: '2025-09-23T15:25:00',
            created_at: '2025-09-23T12:00:00',
          },
        ];
        setDeliveries(mockDeliveries);
      }
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDelivery = async (deliveryId: string) => {
    try {
      if (ENABLE_AUTH) {
        await api.put(`/deliveries?id=${deliveryId}`, { status: 'em_rota' });
      } else {
        // Simular atualização com dados mockados
        setDeliveries(prev => prev.map(delivery => 
          delivery.id === deliveryId 
            ? { ...delivery, status: 'em_rota' as const, updated_at: new Date().toISOString() }
            : delivery
        ));
      }
      toast.success('Entrega iniciada!');
      if (ENABLE_AUTH) {
        fetchMyDeliveries();
      }
    } catch (error) {
      console.error('Erro ao iniciar entrega:', error);
      toast.error('Erro ao iniciar entrega');
    }
  };

  const handleCompleteDelivery = async (deliveryId: string) => {
    if (!confirm('Confirmar que a entrega foi realizada?')) return;

    try {
      if (ENABLE_AUTH) {
        await api.put(`/deliveries?id=${deliveryId}`, { status: 'entregue' });
      } else {
        // Simular atualização com dados mockados
        setDeliveries(prev => prev.map(delivery => 
          delivery.id === deliveryId 
            ? { 
                ...delivery, 
                status: 'entregue' as const, 
                updated_at: new Date().toISOString(),
                delivered_at: new Date().toISOString()
              }
            : delivery
        ));
      }
      toast.success('Entrega finalizada com sucesso!');
      if (ENABLE_AUTH) {
        fetchMyDeliveries();
      }
    } catch (error) {
      console.error('Erro ao finalizar entrega:', error);
      toast.error('Erro ao finalizar entrega');
    }
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Aguardando Saída</Badge>;
      case 'em_rota':
        return <Badge variant="default"><Truck className="h-3 w-3 mr-1" />Em Rota</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingDeliveries = deliveries.filter(d => d.status === 'aguardando');
  const inRouteDeliveries = deliveries.filter(d => d.status === 'em_rota');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Portal do Entregador</h1>
        <p className="text-muted-foreground">
          Suas entregas do dia - {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Dia</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingDeliveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Rota</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inRouteDeliveries.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Entregas Aguardando */}
          {pendingDeliveries.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Entregas Aguardando Saída</h2>
              <div className="grid gap-4">
                {pendingDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="font-semibold text-lg">{delivery.customerName}</h3>
                            {getStatusBadge(delivery.status)}
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <div className="font-medium">{delivery.address}</div>
                              {/* Assuming neighborhood is not directly available in the new mock data */}
                              {/* {delivery.neighborhood && (
                                <div className="text-sm text-muted-foreground">{delivery.neighborhood}</div>
                              )} */}
                            </div>
                          </div>

                          {/* Assuming phone is not directly available in the new mock data */}
                          {/* {delivery.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{delivery.phone}</span>
                            </div>
                          )} */}

                          {delivery.notes && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Obs:</strong> {delivery.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => openMaps(delivery.address)}
                            variant="outline"
                            size="sm"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Ver no Mapa
                          </Button>
                          <Button
                            onClick={() => handleStartDelivery(delivery.id)}
                            size="sm"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Iniciar Entrega
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Entregas Em Rota */}
          {inRouteDeliveries.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Entregas Em Rota</h2>
              <div className="grid gap-4">
                {inRouteDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="font-semibold text-lg">{delivery.customerName}</h3>
                            {getStatusBadge(delivery.status)}
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <div className="font-medium">{delivery.address}</div>
                              {/* Assuming neighborhood is not directly available in the new mock data */}
                              {/* {delivery.neighborhood && (
                                <div className="text-sm text-muted-foreground">{delivery.neighborhood}</div>
                              )} */}
                            </div>
                          </div>

                          {/* Assuming phone is not directly available in the new mock data */}
                          {/* {delivery.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={`tel:${delivery.phone}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {delivery.phone}
                              </a>
                            </div>
                          )} */}

                          {delivery.notes && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Obs:</strong> {delivery.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => openMaps(delivery.address)}
                            variant="outline"
                            size="sm"
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Ver no Mapa
                          </Button>
                          <Button
                            onClick={() => handleCompleteDelivery(delivery.id)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar Entregue
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Nenhuma entrega */}
          {deliveries.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma entrega hoje</h3>
                  <p className="text-muted-foreground">
                    Você não possui entregas atribuídas para hoje.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Botão de Atualizar */}
      <div className="text-center">
        <Button variant="outline" onClick={fetchMyDeliveries}>
          Atualizar Entregas
        </Button>
      </div>
    </div>
  );
}
