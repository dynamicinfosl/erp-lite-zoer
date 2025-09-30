import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que precisam de autenticação
const protectedRoutes = [
  '/dashboard',
  '/clientes',
  '/fornecedores',
  '/produtos',
  '/vendas',
  '/financeiro',
  '/relatorios',
  '/configuracoes',
  '/pdv'
];

// Rotas administrativas (precisam de autenticação + privilégios de admin)
const adminRoutes = [
  '/admin'
];

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin/login'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se a autenticação está habilitada
  const enableAuth = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';
  
  // Se a autenticação não estiver habilitada, permitir acesso a todas as rotas
  if (!enableAuth) {
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Verificar se é uma rota administrativa
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route) && pathname !== '/admin/login'
  );

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Se for uma rota administrativa, verificar autenticação e permissões
  if (isAdminRoute) {
    // Verificar se existe token de autenticação
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirecionar para login de admin
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    // Verificar se o usuário é "julga" - acesso restrito apenas para este usuário
    try {
      // Tentar decodificar o token JWT para obter informações do usuário
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userEmail = tokenData?.email || tokenData?.user_metadata?.email;
      const userRole = tokenData?.user_metadata?.role;
      
      // Se for o usuário julga, permitir acesso independente do role
      const isJulgaUser = userEmail === 'julga@julga.com' || userEmail === 'julga';
      
      if (isJulgaUser) {
        // Permitir acesso para usuário julga
        return NextResponse.next();
      }
      
      // Para outros usuários, verificar se tem role admin
      if (userRole !== 'admin') {
        // Redirecionar para página de acesso negado ou dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Se houver erro ao decodificar o token, redirecionar para login
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // Se for uma rota protegida, verificar se o usuário está autenticado
  if (isProtectedRoute) {
    // Verificar se existe token de autenticação
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      // Redirecionar para login se não estiver autenticado
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Se for uma rota pública de autenticação e o usuário já estiver logado
  if (isPublicRoute && (pathname === '/login' || pathname === '/register')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      // Redirecionar para dashboard se já estiver autenticado
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
