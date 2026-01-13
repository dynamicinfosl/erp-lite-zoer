// Configuração de rotas otimizada

export const ROUTES = {
  // Páginas públicas
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Páginas protegidas
  DASHBOARD: '/dashboard',
  PRODUCTS: '/produtos',
  CUSTOMERS: '/clientes',
  SALES: '/vendas',
  PDV: '/pdv',
  STOCK: '/estoque',
  FINANCIAL: '/financeiro',
  REPORTS: '/relatorios',
  SETTINGS: '/configuracoes',
  DELIVERIES: '/entregas',
  DRIVERS: '/entregadores',
  
  // Páginas especiais
  TRIAL_EXPIRED: '/trial-expirado',
  SUBSCRIPTION: '/assinatura',
} as const;

// Rotas que precisam de autenticação
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PRODUCTS,
  ROUTES.CUSTOMERS,
  ROUTES.SALES,
  ROUTES.PDV,
  ROUTES.STOCK,
  ROUTES.FINANCIAL,
  ROUTES.REPORTS,
  ROUTES.SETTINGS,
  ROUTES.DELIVERIES,
  ROUTES.DRIVERS,
] as const;

// Rotas públicas
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.TRIAL_EXPIRED,
  ROUTES.SUBSCRIPTION,
] as const;

// Função para verificar se uma rota é protegida
export function isProtectedRoute(pathname: string): boolean {
  // Rotas especiais que não devem ser consideradas protegidas
  if (pathname.startsWith('/cupom/')) {
    return false;
  }
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// Função para verificar se uma rota é pública
export function isPublicRoute(pathname: string): boolean {
  // Adicionar rotas especiais que não precisam de autenticação
  if (pathname.startsWith('/cupom/')) {
    return true;
  }
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

// Função para obter a rota de redirecionamento após login
export function getRedirectAfterLogin(originalPath?: string): string {
  if (originalPath && isProtectedRoute(originalPath)) {
    return originalPath;
  }
  return ROUTES.DASHBOARD;
}

