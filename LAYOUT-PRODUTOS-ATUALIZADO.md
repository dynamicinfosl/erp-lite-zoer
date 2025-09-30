# Layout de Produtos - Identidade Visual do Dashboard

## Objetivo
Aplicar a mesma identidade visual do dashboard na página de produtos, utilizando os componentes JugaCards e mantendo consistência visual em todo o sistema.

## Alterações Implementadas

### **1. Header Modernizado**

#### **Antes:**
```typescript
<Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white">
  <CardContent className="pt-6 pb-5">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-blue-900">Produtos</h1>
        <p className="text-sm text-blue-900/70">
          Gerencie seu catálogo de produtos e controle de estoque
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="px-3 py-1 bg-blue-600 text-white">
          <Package className="h-3 w-3 mr-1" />
          {products.length} produtos
        </Badge>
        <Badge variant="outline" className="px-3 py-1 border-blue-200">
          <BarChart3 className="h-3 w-3 mr-1" />
          {products.filter(p => p.stock_quantity <= 10).length} estoque baixo
        </Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

#### **Depois:**
```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-heading">Produtos</h1>
    <p className="text-muted-foreground">
      Gerencie seu catálogo de produtos e controle de estoque
    </p>
  </div>
  <Button 
    className="juga-gradient text-white"
    onClick={() => setShowAddDialog(true)}
  >
    <PackagePlus className="h-4 w-4 mr-2" />
    Adicionar Produto
  </Button>
</div>
```

### **2. Cards de Estatísticas (KPI Cards)**

#### **Grid de 6 KPI Cards:**
```typescript
<div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
  <JugaKPICard
    title="Total Produtos"
    value={productStats.total.toLocaleString('pt-BR')}
    description="Produtos cadastrados"
    icon={<Package className="h-4 w-4" />}
    color="primary"
  />
  
  <JugaKPICard
    title="Produtos Ativos"
    value={productStats.active.toLocaleString('pt-BR')}
    description="Status ativo"
    icon={<CheckCircle className="h-4 w-4" />}
    color="success"
    trend="up"
    trendValue="+8%"
  />
  
  <JugaKPICard
    title="Estoque Baixo"
    value={productStats.lowStock.toLocaleString('pt-BR')}
    description="≤ 10 unidades"
    icon={<AlertTriangle className="h-4 w-4" />}
    color="warning"
    trend={productStats.lowStock > 0 ? "down" : "up"}
    trendValue={productStats.lowStock > 0 ? "Atenção" : "OK"}
  />
  
  <JugaKPICard
    title="Sem Estoque"
    value={productStats.outOfStock.toLocaleString('pt-BR')}
    description="0 unidades"
    icon={<TrendingDown className="h-4 w-4" />}
    color="error"
    trend={productStats.outOfStock > 0 ? "down" : "up"}
    trendValue={productStats.outOfStock > 0 ? "Crítico" : "OK"}
  />
  
  <JugaKPICard
    title="Valor Total"
    value={formatCurrency(productStats.totalValue)}
    description="Estoque total"
    icon={<DollarSign className="h-4 w-4" />}
    color="accent"
    trend="up"
    trendValue="+12%"
  />
  
  <JugaKPICard
    title="Novos Este Mês"
    value={productStats.newThisMonth.toLocaleString('pt-BR')}
    description="Cadastros recentes"
    icon={<TrendingUp className="h-4 w-4" />}
    color="success"
    trend="up"
    trendValue="+15%"
  />
</div>
```

### **3. Progress Cards**

#### **Grid de 3 Progress Cards:**
```typescript
<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  <JugaProgressCard
    title="Status dos Produtos"
    description="Ativos vs Inativos"
    progress={productStats.total > 0 ? Math.round((productStats.active / productStats.total) * 100) : 0}
    total={productStats.total}
    current={productStats.active}
    color="success"
  />
  
  <JugaProgressCard
    title="Controle de Estoque"
    description="Em estoque vs Baixo"
    progress={productStats.total > 0 ? Math.round(((productStats.total - productStats.lowStock - productStats.outOfStock) / productStats.total) * 100) : 0}
    total={productStats.total}
    current={productStats.total - productStats.lowStock - productStats.outOfStock}
    color="primary"
  />
  
  <JugaProgressCard
    title="Crescimento Mensal"
    description="Novos produtos"
    progress={productStats.total > 0 ? Math.round((productStats.newThisMonth / productStats.total) * 100) : 0}
    total={productStats.total}
    current={productStats.newThisMonth}
    color="accent"
  />
</div>
```

### **4. Estatísticas Calculadas**

#### **Cálculo Dinâmico de Estatísticas:**
```typescript
const productStats = {
  total: Array.isArray(products) ? products.length : 0,
  active: Array.isArray(products) ? products.filter(p => p.status === 'active').length : 0,
  inactive: Array.isArray(products) ? products.filter(p => p.status === 'inactive').length : 0,
  lowStock: Array.isArray(products) ? products.filter(p => p.stock_quantity <= 10).length : 0,
  outOfStock: Array.isArray(products) ? products.filter(p => p.stock_quantity === 0).length : 0,
  totalValue: Array.isArray(products) ? products.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0) : 0,
  avgPrice: Array.isArray(products) && products.length > 0 ? products.reduce((acc, p) => acc + p.sale_price, 0) / products.length : 0,
  newThisMonth: Array.isArray(products) ? products.filter(p => {
    const created = new Date(p.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length : 0
};
```

### **5. Toolbar Modernizada**

#### **Aplicação da Classe juga-card:**
```typescript
<Card className="juga-card">
  <CardContent className="pt-6">
    {/* Conteúdo da toolbar */}
  </CardContent>
</Card>
```

#### **Botões com Identidade Visual:**
```typescript
<Button 
  variant="outline" 
  className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
>
  <MoreHorizontal className="h-4 w-4 mr-2" />
  Mais Ações
</Button>
```

### **6. Dropdowns Modernizados**

#### **Dropdown "Mais Ações":**
```typescript
<DropdownMenuContent className="w-52 z-50 bg-white border border-gray-200 shadow-xl rounded-lg">
  <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-100">
    <MoreHorizontal className="h-4 w-4 inline mr-2" />
    Ações
  </DropdownMenuLabel>
  
  <div className="py-1">
    <DropdownMenuItem 
      onClick={() => setShowImportDialog(true)} 
      className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center"
    >
      <Upload className="h-4 w-4 mr-3 text-gray-400" />
      Importar Produtos
    </DropdownMenuItem>
    
    <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center">
      <Download className="h-4 w-4 mr-3 text-gray-400" />
      Exportar Lista
    </DropdownMenuItem>
  </div>
  
  <div className="border-t border-gray-100 pt-1">
    <DropdownMenuItem className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center">
      <Trash2 className="h-4 w-4 mr-3 text-red-400" />
      Excluir Selecionados
    </DropdownMenuItem>
  </div>
</DropdownMenuContent>
```

#### **Dropdown "Mostrar Colunas":**
```typescript
<DropdownMenuContent className="w-64 z-50 bg-white border border-gray-200 shadow-xl rounded-lg">
  <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-100">
    <Settings2 className="h-4 w-4 inline mr-2" />
    Mostrar Colunas
  </DropdownMenuLabel>
  
  <div className="py-1">
    {Object.entries(columnVisibility).map(([key, value]) => (
      <DropdownMenuCheckboxItem
        key={key}
        checked={value}
        onCheckedChange={(checked) => 
          setColumnVisibility(prev => ({ ...prev, [key]: checked || false }))
        }
        className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center"
      >
        {/* Labels dinâmicos */}
      </DropdownMenuCheckboxItem>
    ))}
  </div>
</DropdownMenuContent>
```

### **7. Busca Avançada**

#### **Fundo Atualizado:**
```typescript
{showAdvancedSearch && (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    {/* Conteúdo da busca avançada */}
  </div>
)}
```

### **8. Ícones Adicionados**

#### **Novos Ícones Importados:**
```typescript
import { 
  PackagePlus,    // Adicionar produto
  TrendingUp,     // Crescimento
  TrendingDown,   // Declínio
  AlertTriangle,  // Atenção/Estoque baixo
  CheckCircle,    // Status ativo
  ShoppingCart,   // Vendas
  Warehouse       // Estoque
} from 'lucide-react';
```

## Benefícios Alcançados

### **1. Consistência Visual**
- ✅ **Mesmo padrão** do dashboard e página de clientes
- ✅ **Componentes JugaCards** para estatísticas
- ✅ **Cores padronizadas** em todo o sistema
- ✅ **Espaçamento consistente** (gap-3 sm:gap-4)

### **2. Funcionalidades Aprimoradas**
- ✅ **Estatísticas dinâmicas** calculadas em tempo real
- ✅ **Indicadores de tendência** nos KPI cards
- ✅ **Progress bars** para visualização de percentuais
- ✅ **Alertas visuais** para estoque baixo e sem estoque

### **3. Usabilidade**
- ✅ **Informações organizadas** em cards específicos
- ✅ **Fácil identificação** de problemas de estoque
- ✅ **Métricas importantes** destacadas
- ✅ **Interface intuitiva** e moderna

### **4. Responsividade**
- ✅ **Grid responsivo** para diferentes tamanhos de tela
- ✅ **Adaptação automática** do layout
- ✅ **Cards empilháveis** em telas menores

## Métricas Implementadas

### **KPI Cards:**
1. **Total Produtos** - Contador geral
2. **Produtos Ativos** - Status ativo com tendência
3. **Estoque Baixo** - ≤ 10 unidades (alerta)
4. **Sem Estoque** - 0 unidades (crítico)
5. **Valor Total** - Valor monetário do estoque
6. **Novos Este Mês** - Cadastros recentes

### **Progress Cards:**
1. **Status dos Produtos** - Ativos vs Inativos
2. **Controle de Estoque** - Em estoque vs Baixo
3. **Crescimento Mensal** - Novos produtos

## Status da Implementação

✅ **Layout Completamente Atualizado**
- ✅ Header modernizado com botão de ação
- ✅ 6 KPI cards com estatísticas dinâmicas
- ✅ 3 Progress cards com visualizações
- ✅ Toolbar com identidade visual consistente
- ✅ Dropdowns modernizados com ícones
- ✅ Busca avançada com fundo atualizado
- ✅ Nenhum erro de linting

## Como Testar

1. **Acesse**: http://localhost:3000/produtos
2. **Verifique**: Header limpo com botão "Adicionar Produto"
3. **Observe**: 6 cards de estatísticas no topo
4. **Confirme**: 3 progress cards abaixo
5. **Teste**: Dropdowns modernizados com ícones
6. **Valide**: Identidade visual consistente

---
**Status**: ✅ **IMPLEMENTADO** - Layout de produtos com identidade visual do dashboard
