'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart, Package, Percent } from 'lucide-react';
import { CartItem } from '@/types';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateDiscount?: (index: number, discount: number) => void;
  onClearCart?: () => void;
}

export function CartItems({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onUpdateDiscount,
  onClearCart 
}: CartItemsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountTotal = items.reduce((sum, item) => {
    const discount = (item as any).discount || 0;
    return sum + ((item.unit_price * item.quantity * discount) / 100);
  }, 0);
  const total = items.reduce((sum, item) => sum + item.total_price, 0);

  if (items.length === 0) {
    return (
      <Card className="h-full juga-card">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho de Compras
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <ShoppingCart className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground font-medium">Carrinho vazio</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione produtos para começar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full juga-card flex flex-col">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </CardTitle>
          {onClearCart && items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearCart}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.map((item, index) => {
            const discount = (item as any).discount || 0;
            const itemSubtotal = item.unit_price * item.quantity;
            const itemDiscount = (itemSubtotal * discount) / 100;
            const itemTotal = itemSubtotal - itemDiscount;
            
            return (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-3 border-2 border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-sm text-heading truncate">
                        {item.product.name}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price)} x unidade
                      </p>
                      {discount > 0 && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          {discount}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        onUpdateQuantity(index, Math.max(1, qty));
                      }}
                      className="w-14 h-8 text-center font-semibold text-sm"
                      min="1"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    {discount > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(itemSubtotal)}
                      </p>
                    )}
                    <p className="font-bold text-base text-primary">
                      {formatCurrency(itemTotal)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="border-t p-4 space-y-3 bg-muted/30">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Desconto:
                </span>
                <span className="font-semibold">-{formatCurrency(discountTotal)}</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-2xl font-extrabold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
