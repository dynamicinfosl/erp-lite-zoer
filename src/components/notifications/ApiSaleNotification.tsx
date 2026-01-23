'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Bell, 
  X, 
  Minimize2, 
  Maximize2, 
  Eye, 
  Printer,
  ShoppingCart,
  Clock,
  User,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface ApiSale {
  id: number;
  sale_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  sale_type: string;
  created_at: string;
}

interface ApiSaleNotificationProps {
  tenantId: string | null;
}

export function ApiSaleNotification({ tenantId }: ApiSaleNotificationProps) {
  const [notifications, setNotifications] = useState<ApiSale[]>([]);
  const [viewedSaleIds, setViewedSaleIds] = useState<Set<number>>(new Set()); // IDs dos pedidos visualizados
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Sempre começar minimizado
  const [lastCheckedId, setLastCheckedId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      // Criar um contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar um oscilador para gerar o som
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Conectar os nós
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som (frequência, tipo de onda, volume)
      oscillator.frequency.value = 800; // Frequência em Hz (tom médio)
      oscillator.type = 'sine'; // Tipo de onda suave
      
      // Configurar envelope de volume (fade in/out)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // Tocar o som
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Erro ao tocar som de notificação:', error);
      // Fallback: usar beep do sistema se disponível
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      } catch (e) {
        // Ignorar se não suportar
      }
    }
  }, []);

  // Carregar últimos pedidos da IA
  const loadRecentSales = useCallback(async () => {
    if (!tenantId) return;

    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        sale_source: 'api',
        branch_scope: 'all',
      });

      const res = await fetch(`/next_api/sales?${params.toString()}`);
      if (!res.ok) return;

      const json = await res.json();
      const sales = Array.isArray(json?.data) ? json.data : (json?.rows || []);

      if (sales.length > 0) {
        // Ordenar por ID (mais recente primeiro) e pegar os últimos 50
        const sortedSales = [...sales].sort((a: any, b: any) => {
          const idA = Number(a.id) || 0;
          const idB = Number(b.id) || 0;
          return idB - idA;
        }).slice(0, 50);

        const formattedSales: ApiSale[] = sortedSales.map((s: any) => ({
          id: Number(s.id) || 0,
          sale_number: s.sale_number || `VND-${String(s.id).padStart(6, '0')}`,
          customer_name: s.customer_name || 'Cliente Avulso',
          total_amount: Number(s.total_amount || s.final_amount || 0),
          payment_method: s.payment_method || 'dinheiro',
          sale_type: s.sale_type || 'balcao',
          created_at: s.created_at || new Date().toISOString(),
        }));

        // Usar função de atualização que recebe o estado anterior
        setNotifications((prev) => {
          // Se é o carregamento inicial, apenas definir os pedidos
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            const latestId = Math.max(...formattedSales.map((s) => s.id));
            setLastCheckedId(latestId);
            return formattedSales;
          }

          // Verificar se há novos pedidos comparando com o estado anterior
          const existingIds = new Set(prev.map((n) => n.id));
          const newSales = formattedSales.filter((s) => !existingIds.has(s.id));

          if (newSales.length > 0) {
            // Adicionar novos pedidos no início da lista
            const updated = [...newSales, ...prev];
            // Remover duplicatas e manter apenas os 50 mais recentes
            const unique = Array.from(
              new Map(updated.map((s) => [s.id, s])).values()
            ).slice(0, 50);

            // Tocar som de notificação
            playNotificationSound();

            // Mostrar toast para cada nova venda
            newSales.forEach((sale) => {
              toast.success('Novo pedido via API externa!', {
                description: `${sale.sale_number} - ${sale.customer_name} - ${formatCurrency(sale.total_amount)}`,
                duration: 5000,
              });
            });

            // Atualizar último ID verificado
            const latestId = Math.max(...formattedSales.map((s) => s.id));
            setLastCheckedId(latestId);

            return unique;
          } else {
            // Atualizar lista mesmo sem novos pedidos (para manter sincronizado)
            const latestId = Math.max(...formattedSales.map((s) => s.id));
            setLastCheckedId(latestId);
            return formattedSales;
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  }, [tenantId, playNotificationSound]);


  // Verificar se o tenant tem API keys ativas
  useEffect(() => {
    const checkApiKeys = async () => {
      if (!tenantId) {
        setHasApiKeys(false);
        return;
      }

      try {
        const res = await fetch(`/next_api/api-keys?tenant_id=${encodeURIComponent(tenantId)}`);
        if (res.ok) {
          const json = await res.json();
          const keys = Array.isArray(json?.data) ? json.data : [];
          // Verificar se há pelo menos uma API key ativa
          const activeKeys = keys.filter((k: any) => {
            if (!k.is_active) return false;
            // Verificar se não expirou
            if (k.expires_at) {
              const expiresAt = new Date(k.expires_at);
              return expiresAt > new Date();
            }
            return true;
          });
          setHasApiKeys(activeKeys.length > 0);
        } else {
          setHasApiKeys(false);
        }
      } catch (error) {
        console.error('Erro ao verificar API keys:', error);
        setHasApiKeys(false);
      }
    };

    checkApiKeys();
    // Re-verificar a cada 30 segundos
    const interval = setInterval(checkApiKeys, 30000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Carregar pedidos iniciais e configurar polling
  useEffect(() => {
    if (!tenantId || !hasApiKeys) {
      // Reset quando não há tenant ou não tem API keys
      setNotifications([]);
      setViewedSaleIds(new Set());
      setLastCheckedId(null);
      isInitialLoadRef.current = true;
      return;
    }

    // Carregar pedidos iniciais imediatamente
    loadRecentSales();

    // Configurar polling a cada 10 segundos
    const interval = setInterval(() => {
      loadRecentSales();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [tenantId, hasApiKeys, loadRecentSales]);

  const handleViewReceipt = (saleId: number) => {
    window.open(`/cupom/${saleId}`, '_blank');
  };

  const handlePrintReceipt = (saleId: number) => {
    const printWindow = window.open(`/cupom/${saleId}`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setViewedSaleIds(new Set());
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_debito: 'Cartão Débito',
      cartao_credito: 'Cartão Crédito',
      boleto: 'Boleto',
    };
    return labels[method] || method;
  };

  // Calcular apenas pedidos não visualizados
  const unreadCount = notifications.filter((sale) => !viewedSaleIds.has(sale.id)).length;

  // Marcar todos os pedidos como visualizados quando o modal é aberto
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      setViewedSaleIds((prev) => {
        const newViewedIds = new Set(prev);
        notifications.forEach((sale) => {
          newViewedIds.add(sale.id);
        });
        return newViewedIds;
      });
    }
  }, [isOpen, notifications]);

  // Não renderizar nada se não tiver API keys ativas
  if (!hasApiKeys) {
    return null;
  }

  return (
    <>
      {/* Botão de notificação sempre visível no canto (quando modal não está aberto) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="relative shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Bell className="h-5 w-5 mr-2" />
            Pedidos da IA
            {unreadCount > 0 && (
              <span
                className="absolute -top-2 -right-2 h-6 min-w-6 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-600 border-2 border-white rounded-full shadow-lg animate-pulse z-10"
                style={{ backgroundColor: '#dc2626' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Modal de notificações */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setIsMinimized(true);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Pedidos Criados via API Externa
                </DialogTitle>
                <DialogDescription>
                  Notificações de novos pedidos criados automaticamente pela IA
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge className="text-sm bg-red-600 text-white border-0">
                    {unreadCount} novo{unreadCount !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(true);
                  }}
                  title="Fechar"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pedido novo no momento</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Você será notificado quando houver novos pedidos via API externa
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {sale.customer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.sale_type === 'entrega' ? 'default' : 'secondary'}>
                          {sale.sale_type === 'entrega' ? 'Entrega' : 'Balcão'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(sale.total_amount)}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(sale.payment_method)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(sale.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(sale.id)}
                            title="Visualizar cupom"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintReceipt(sale.id)}
                            title="Imprimir cupom"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={handleClearNotifications}>
                Limpar notificações
              </Button>
              <p className="text-sm text-muted-foreground">
                Total: {notifications.length} pedido{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
