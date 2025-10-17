import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedRoute, isPublicRoute, getRedirectAfterLogin } from '@/config/routes';

// Rotas administrativas (não incluidas na configuração principal)
const adminRoutes = [
  '/admin/login',
  '/admin',
  '/admin-test',
  '/admin/simple',
  '/admin/login/test-page'
];


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ignorar completamente a rota de cupom
  if (pathname.startsWith('/cupom/')) {
    return NextResponse.next();
  }
  
  // Verificar se a autenticação está habilitada
  const enableAuth = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';
  
  // Se a autenticação não estiver habilitada, permitir acesso a todas as rotas
  if (!enableAuth) {
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida
  const isProtected = isProtectedRoute(pathname);

  // Verificar se é uma rota pública
  const isPublic = isPublicRoute(pathname) || adminRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Se for uma rota protegida, verificar apenas autenticação básica
  if (isProtected) {
    // Verificar cookies do Supabase Auth de forma mais simples
    const hasAuthCookie = request.cookies.getAll().some(cookie => 
      cookie.name.includes('sb-') && 
      (cookie.name.includes('auth-token') || cookie.name.includes('access-token'))
    );
    
    if (!hasAuthCookie) {
      // Redirecionar para login se não estiver autenticado
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Para rotas protegidas, deixar o client-side fazer as verificações de trial
    // Isso evita delays no middleware
  }

  // Se for uma rota pública de autenticação e o usuário já estiver logado
  if (isPublic && (pathname === '/login' || pathname === '/register')) {
    const hasAuthCookie = request.cookies.getAll().some(cookie => 
      cookie.name.includes('sb-') && 
      (cookie.name.includes('auth-token') || cookie.name.includes('access-token'))
    );
    
    if (hasAuthCookie) {
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
     * - next_api (custom API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|next_api|_next/static|_next/image|favicon.ico).*)',
  ],
};
