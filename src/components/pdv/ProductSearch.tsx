
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package } from 'lucide-react';
import { Product } from '@/types';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  products: Product[];
}

export function ProductSearch({ onProductSelect, products }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
      setFilteredProducts(filtered);
      setShowResults(true);
      setSelectedIndex(-1);
    } else {
      setFilteredProducts([]);
      setShowResults(false);
    }
  }, [searchTerm, products]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F2') {
      e.preventDefault();
      inputRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        handleProductSelect(filteredProducts[selectedIndex]);
      } else if (filteredProducts.length === 1) {
        handleProductSelect(filteredProducts[0]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSearchTerm('');
      inputRef.current?.blur();
    }
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setSearchTerm('');
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Digite o código ou nome do produto (F2)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 text-lg h-12"
          autoFocus
        />
      </div>

      {showResults && filteredProducts.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-muted ${
                  index === selectedIndex ? 'bg-muted' : ''
                }`}
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sku && `SKU: ${product.sku}`}
                        {product.sku && product.barcode && ' • '}
                        {product.barcode && `Código: ${product.barcode}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {formatCurrency(product.sale_price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estoque: {product.stock_quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        F2 = Buscar produto • Enter = Confirmar • Esc = Cancelar
      </div>
    </div>
  );
}
