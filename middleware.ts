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

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
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

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

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
