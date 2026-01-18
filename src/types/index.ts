
// Tipos principais do sistema
export interface Product {
  id: number;
  user_id: number;
  category_id?: number;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  // novos campos opcionais
  internal_code?: string;
  product_group?: string;
  has_variations?: boolean;
  fiscal_note?: string; // NCM/CFOP ou referência fiscal
  unit_conversion?: string; // ex.: 1 CX = 12 UN
  moves_stock?: boolean;
  width_cm?: number;
  height_cm?: number;
  length_cm?: number;
  weight_kg?: number;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface Sale {
  id: number;
  user_id: number;
  customer_id?: number;
  sale_number: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado' | 'boleto';
  sale_type: 'balcao' | 'entrega';
  sale_source?: 'pdv' | 'produtos';
  status: 'finalizada' | 'cancelada' | 'pendente' | 'paga';
  notes?: string;
  sold_at: string;
  created_at: string;
  updated_at: string;
  // Novos campos para vendas de produtos
  delivery_date?: string;
  carrier_name?: string;
  payment_condition?: string;
  delivery_address?: DeliveryAddress;
  seller_name?: string;
  customer_name?: string;
}

export interface SaleItem {
  id: number;
  user_id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  notes?: string;
  responsible_seller?: string;
  responsible_financial?: string;
  photo?: string;
  attachments?: string[];
  observations?: string;
  credit_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: number;
  user_id: number;
  sale_id: number;
  driver_id?: number;
  manifest_id?: string | null;
  customer_name: string;
  delivery_address: string;
  neighborhood?: string;
  phone?: string;
  delivery_fee: number;
  status: 'aguardando' | 'em_rota' | 'entregue' | 'cancelada';
  notes?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryDriver {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: number;
  user_id: number;
  transaction_type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  payment_method?: string;
  reference_type?: 'venda' | 'compra' | 'despesa_operacional' | 'outras';
  reference_id?: number;
  due_date?: string;
  paid_date?: string;
  status: 'pendente' | 'pago' | 'cancelado';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  user_id: number;
  product_id: number;
  movement_type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  unit_cost?: number;
  reference_type?: 'venda' | 'compra' | 'ajuste' | 'devolucao';
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  phone?: string;
  role_type: 'admin' | 'vendedor' | 'financeiro' | 'entregador';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Caixa (PDV)
export interface CashRegister {
  id: number;
  user_id: number | string;
  name: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashSession {
  id: number;
  user_id: number | string;
  register_id: number;
  status: 'open' | 'closed';
  opened_by: string;
  opened_at: string;
  opening_amount: number;
  notes?: string;
  closed_by?: string;
  closed_at?: string;
  closing_amount_cash?: number;
  closing_amount_card?: number;
  closing_amount_pix?: number;
  difference_amount?: number;
  difference_reason?: string;
}

export interface CashTransaction {
  id: number;
  user_id: number | string;
  session_id: number;
  type: 'opening' | 'sale' | 'supply' | 'withdrawal' | 'expense' | 'refund' | 'adjustment' | 'closing';
  method?: 'cash' | 'card' | 'pix' | 'other';
  amount: number;
  reference_type?: string;
  reference_id?: number;
  description?: string;
  created_by: string;
  created_at: string;
}

// Tipos para PDV
export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PDVItem {
  id: number
  name: string
  price: number
  code: string
  quantity: number
  discount: number
  variant_id?: number | null
  variant_label?: string | null
}

// Tipos para Dashboard
export interface DashboardStats {
  today_sales: {
    total_amount: number;
    sales_count: number;
    gross_profit: number;
  };
  today_deliveries: {
    total_orders: number;
    in_route: number;
    completed: number;
  };
  monthly_data: {
    sales: Array<{ month: string; amount: number }>;
    cash_flow: Array<{ month: string; income: number; expense: number }>;
  };
}

// Tipos para relatórios
export interface SalesReport {
  period: string;
  total_sales: number;
  total_amount: number;
  average_ticket: number;
  payment_methods: Array<{ method: string; count: number; amount: number }>;
  top_products: Array<{ product_name: string; quantity: number; amount: number }>;
}

export * from './nfe';