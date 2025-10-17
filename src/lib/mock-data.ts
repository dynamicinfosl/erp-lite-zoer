import { Product, CartItem } from '@/types';

// Dados mockados para quando a autenticação estiver desabilitada
export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Coca-Cola 350ml',
    sku: 'COCA350',
    barcode: '7891234567890',
    description: 'Refrigerante Coca-Cola 350ml',
    cost_price: 2.5,
    sale_price: 4.5,
    stock_quantity: 50,
    min_stock: 10,
    unit: 'UN',
    is_active: true,
    category_id: 1,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Pepsi 350ml',
    sku: 'PEPSI350',
    barcode: '7891234567891',
    description: 'Refrigerante Pepsi 350ml',
    cost_price: 2.30,
    sale_price: 4.20,
    stock_quantity: 30,
    min_stock: 10,
    unit: 'UN',
    is_active: true,
    category_id: 1,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Skol 350ml',
    sku: 'SKOL350',
    barcode: '7891234567892',
    description: 'Cerveja Skol 350ml',
    cost_price: 3.20,
    sale_price: 5.50,
    stock_quantity: 25,
    min_stock: 5,
    unit: 'UN',
    is_active: true,
    category_id: 2,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Água Mineral 500ml',
    sku: 'AGUA500',
    barcode: '7891234567893',
    description: 'Água mineral natural 500ml',
    cost_price: 1.20,
    sale_price: 2.50,
    stock_quantity: 100,
    min_stock: 20,
    unit: 'UN',
    is_active: true,
    category_id: 3,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    name: 'Red Bull 250ml',
    sku: 'REDBULL250',
    barcode: '7891234567894',
    description: 'Energético Red Bull 250ml',
    cost_price: 4.50,
    sale_price: 8.00,
    stock_quantity: 15,
    min_stock: 5,
    unit: 'UN',
    is_active: true,
    category_id: 4,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockCustomers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    document: '123.456.789-00',
    address: 'Rua das Flores, 123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipcode: '01234-567',
    notes: 'Cliente preferencial',
    is_active: true,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    document: '987.654.321-00',
    address: 'Av. Paulista, 456',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipcode: '01310-100',
    notes: 'Entrega rápida',
    is_active: true,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const mockSales = [
  {
    id: '1',
    user_id: 1,
    customer_id: '1',
    sale_number: 'V001',
    total_amount: 45.5,
    discount_amount: 0,
    final_amount: 45.5,
    payment_method: 'pix',
    sale_type: 'balcao',
    status: 'finalizada',
    notes: 'Venda normal',
    sold_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 1,
    customer_id: '2',
    sale_number: 'V002',
    total_amount: 89.0,
    discount_amount: 5.0,
    final_amount: 84.0,
    payment_method: 'cartao_credito',
    sale_type: 'entrega',
    status: 'finalizada',
    notes: 'Entrega agendada',
    sold_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const mockFinancialTransactions = [
  {
    id: '1',
    user_id: 1,
    transaction_type: 'receita',
    category: 'Vendas',
    description: 'Venda de produtos',
    amount: 1250.5,
    payment_method: 'pix',
    reference_type: 'venda',
    reference_id: '1',
    due_date: new Date().toISOString().split('T')[0],
    paid_date: new Date().toISOString().split('T')[0],
    status: 'pago',
    notes: 'Receita do dia',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 1,
    transaction_type: 'despesa',
    category: 'Aluguel',
    description: 'Aluguel do depósito',
    amount: 800.0,
    payment_method: 'pix',
    reference_type: 'despesa_operacional',
    reference_id: null,
    due_date: new Date().toISOString().split('T')[0],
    paid_date: new Date().toISOString().split('T')[0],
    status: 'pago',
    notes: 'Aluguel mensal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const mockDeliveries = [
  {
    id: '1',
    user_id: 1,
    sale_id: '2',
    driver_id: '1',
    customer_name: 'Maria Santos',
    delivery_address: 'Av. Paulista, 456',
    neighborhood: 'Bela Vista',
    phone: '(11) 88888-8888',
    delivery_fee: 5.0,
    status: 'em_rota',
    notes: 'Entregar após 14h',
    delivered_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const mockDashboardData = {
  todaySales: {
    totalAmount: 1250.50,
    salesCount: 8,
    grossProfit: 450.75
  },
  todayDeliveries: {
    totalOrders: 5,
    inRoute: 2,
    completed: 3
  },
  monthlyData: [
    { month: 'Jan', amount: 15000, income: 18000, expense: 3000 },
    { month: 'Fev', amount: 18000, income: 21000, expense: 3000 },
    { month: 'Mar', amount: 22000, income: 25000, expense: 3000 },
    { month: 'Abr', amount: 19500, income: 22500, expense: 3000 },
    { month: 'Mai', amount: 28000, income: 31000, expense: 3000 },
    { month: 'Jun', amount: 32000, income: 35000, expense: 3000 }
  ],
  lowStockProducts: 3,
  alerts: {
    lowStock: true,
    pendingDeliveries: true
  }
};

// Dados mockados do usuário logado
export const mockUserProfile = {
  id: '1',
  name: 'Gabriel de Souza',
  email: 'gabrieldesouza104@gmail.com',
  role: 'vendedor',
  isAdmin: false,
  avatar: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
