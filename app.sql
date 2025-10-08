
-- Perfis de usuário (extensão da tabela users)
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('admin', 'vendedor', 'financeiro', 'entregador')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorias de produtos (compartilhada, sem RLS)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#2c3e50',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Produtos (bebidas)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id BIGINT,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),image.png
    description TEXT,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'UN',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clientes
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20),
    address TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zipcode VARCHAR(10),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entregadores
CREATE TABLE delivery_drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_plate VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendas
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    customer_id BIGINT,
    sale_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'fiado')),
    sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('balcao', 'entrega')),
    status VARCHAR(20) DEFAULT 'finalizada' CHECK (status IN ('finalizada', 'cancelada')),
    notes TEXT,
    sold_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Itens da venda
CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entregas
CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sale_id BIGINT,
    driver_id BIGINT,
    customer_name VARCHAR(200) NOT NULL,
    delivery_address TEXT NOT NULL,
    neighborhood VARCHAR(100),
    phone VARCHAR(20),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_rota', 'entregue', 'cancelada')),
    notes TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance em entregas
CREATE INDEX idx_deliveries_tenant_id ON deliveries(tenant_id);
CREATE INDEX idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at DESC);

-- Movimentações de estoque
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id BIGINT NOT NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type VARCHAR(20) CHECK (reference_type IN ('venda', 'compra', 'ajuste', 'devolucao')),
    reference_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Controle financeiro - Receitas e Despesas
CREATE TABLE financial_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('receita', 'despesa')),
    category VARCHAR(100) NOT NULL,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20),
    reference_type VARCHAR(20) CHECK (reference_type IN ('venda', 'compra', 'despesa_operacional', 'outras')),
    reference_id BIGINT,
    due_date DATE,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS nas tabelas de usuário
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY user_profiles_select_policy ON user_profiles
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_profiles_insert_policy ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profiles_update_policy ON user_profiles
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profiles_delete_policy ON user_profiles
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para products
CREATE POLICY products_select_policy ON products
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY products_insert_policy ON products
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY products_update_policy ON products
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY products_delete_policy ON products
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para customers
CREATE POLICY customers_select_policy ON customers
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY customers_insert_policy ON customers
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY customers_update_policy ON customers
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY customers_delete_policy ON customers
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para delivery_drivers
CREATE POLICY delivery_drivers_select_policy ON delivery_drivers
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY delivery_drivers_insert_policy ON delivery_drivers
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY delivery_drivers_update_policy ON delivery_drivers
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY delivery_drivers_delete_policy ON delivery_drivers
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para sales
CREATE POLICY sales_select_policy ON sales
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sales_insert_policy ON sales
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY sales_update_policy ON sales
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY sales_delete_policy ON sales
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para sale_items
CREATE POLICY sale_items_select_policy ON sale_items
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sale_items_insert_policy ON sale_items
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY sale_items_update_policy ON sale_items
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY sale_items_delete_policy ON sale_items
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para deliveries
CREATE POLICY deliveries_select_policy ON deliveries
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY deliveries_insert_policy ON deliveries
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY deliveries_update_policy ON deliveries
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY deliveries_delete_policy ON deliveries
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para stock_movements
CREATE POLICY stock_movements_select_policy ON stock_movements
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY stock_movements_insert_policy ON stock_movements
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY stock_movements_update_policy ON stock_movements
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY stock_movements_delete_policy ON stock_movements
    FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para financial_transactions
CREATE POLICY financial_transactions_select_policy ON financial_transactions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY financial_transactions_insert_policy ON financial_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY financial_transactions_update_policy ON financial_transactions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY financial_transactions_delete_policy ON financial_transactions
    FOR DELETE USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_delivery_drivers_user_id ON delivery_drivers(user_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_sold_at ON sales(sold_at);
CREATE INDEX idx_sale_items_user_id ON sale_items(user_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX idx_deliveries_sale_id ON deliveries(sale_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_due_date ON financial_transactions(due_date);

-- Inserir perfil padrão para o admin (será criado quando o usuário se registrar)
-- INSERT INTO user_profiles (user_id, name, role_type) VALUES ('00000000-0000-0000-0000-000000000000', 'Administrador', 'admin');

-- Inserir categorias padrão de bebidas
INSERT INTO categories (name, description, color) VALUES 
('Refrigerantes', 'Bebidas gaseificadas e sucos', '#e74c3c'),
('Cervejas', 'Cervejas nacionais e importadas', '#f39c12'),
('Águas', 'Águas minerais e com gás', '#3498db'),
('Energéticos', 'Bebidas energéticas', '#9b59b6'),
('Sucos', 'Sucos naturais e industrializados', '#27ae60'),
('Destilados', 'Cachaças, vodkas e whisky', '#34495e'),
('Vinhos', 'Vinhos nacionais e importados', '#8e44ad'),
('Isotônicos', 'Bebidas isotônicas', '#16a085');

-- Caixa (PDV)
CREATE TABLE cash_registers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    register_id BIGINT NOT NULL REFERENCES cash_registers(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('open','closed')) DEFAULT 'open',
    opened_by UUID NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    opening_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    closed_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    closing_amount_cash DECIMAL(10,2),
    closing_amount_card DECIMAL(10,2),
    closing_amount_pix DECIMAL(10,2),
    difference_amount DECIMAL(10,2),
    difference_reason TEXT
);

CREATE TABLE cash_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id BIGINT NOT NULL REFERENCES cash_sessions(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('opening','sale','supply','withdrawal','expense','refund','adjustment','closing')),
    method VARCHAR(20) CHECK (method IN ('cash','card','pix','other')),
    amount DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(30),
    reference_id BIGINT,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS para tabelas de caixa
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cash_registers_select ON cash_registers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cash_registers_insert ON cash_registers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cash_registers_update ON cash_registers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY cash_sessions_select ON cash_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cash_sessions_insert ON cash_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cash_sessions_update ON cash_sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY cash_transactions_select ON cash_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cash_transactions_insert ON cash_transactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX idx_cash_registers_user ON cash_registers(user_id);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(register_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX idx_cash_transactions_session ON cash_transactions(session_id);
CREATE INDEX idx_cash_transactions_type ON cash_transactions(type);