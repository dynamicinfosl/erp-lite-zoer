'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Barcode, TrendingUp } from 'lucide-react';
import { Product } from '@/types';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  products: Product[];
  loading?: boolean;
}

export function ProductSearch({ onProductSelect, products, loading = false }: ProductSearchProps) {
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
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={loading ? "Carregando produtos..." : "Digite o código ou nome do produto (F2)"}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-11 pr-11 text-base h-12 border-2 focus:border-primary transition-all"
          autoFocus
          disabled={loading}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Barcode className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {showResults && filteredProducts.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto shadow-lg border-2 border-primary/20">
          <CardContent className="p-0">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={`p-4 cursor-pointer border-b last:border-b-0 transition-all ${
                  index === selectedIndex 
                    ? 'bg-primary/10 border-l-4 border-l-primary' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2.5 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base truncate">{product.name}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {product.sku && (
                          <Badge variant="outline" className="text-xs">
                            SKU: {product.sku}
                          </Badge>
                        )}
                        {product.barcode && (
                          <Badge variant="outline" className="text-xs">
                            <Barcode className="h-3 w-3 mr-1" />
                            {product.barcode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-xl text-primary">
                      {formatCurrency(product.sale_price)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <TrendingUp className="h-3 w-3" />
                      Estoque: {product.stock_quantity || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && searchTerm && filteredProducts.length === 0 && !loading && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 shadow-lg border-2 border-orange-200">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente buscar por outro termo
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>F2 = Buscar • Enter = Confirmar • ↑↓ = Navegar • Esc = Cancelar</span>
        {searchTerm && (
          <Badge variant="secondary" className="text-xs">
            {filteredProducts.length} resultado(s)
          </Badge>
        )}
      </div>
    </div>
  );
}
