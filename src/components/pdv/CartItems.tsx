
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '@/types';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
}

export function CartItems({ items, onUpdateQuantity, onRemoveItem }: CartItemsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const total = items.reduce((sum, item) => sum + item.total_price, 0);

  if (items.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Carrinho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Nenhum produto adicionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Carrinho ({items.length} itens)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.product.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(item.unit_price)} cada
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                  className="h-8 w-8 p-0"
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
                  className="w-16 h-8 text-center"
                  min="1"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-right min-w-20">
                <div className="font-semibold">
                  {formatCurrency(item.total_price)}
                </div>
              </div>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveItem(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
