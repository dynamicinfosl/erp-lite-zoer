import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
  '/pdv',
  '/estoque',
  '/entregas',
  '/entregador',
  '/ordem-servicos',
  '/perfil-empresa'
];

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin/login',
  '/admin', // Admin faz verificação client-side com sessionStorage
  '/admin-test', // Página de teste do admin
  '/admin/simple', // Página simplificada do admin
  '/admin/login/test-page', // Página de teste do login
  '/trial-expirado', // Página de trial expirado
  '/assinatura' // Página de assinatura (pode ser acessada mesmo com trial expirado)
];

// Rotas que precisam verificar trial (exceto assinatura)
const trialProtectedRoutes = [
  '/dashboard',
  '/clientes',
  '/fornecedores',
  '/produtos',
  '/vendas',
  '/financeiro',
  '/relatorios',
  '/configuracoes',
  '/pdv',
  '/estoque',
  '/entregas',
  '/entregador',
  '/ordem-servicos',
  '/perfil-empresa'
];

/**
 * Verifica se o trial do tenant expirou
 */
async function checkTrialExpired(tenantId: string): Promise<boolean> {
  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !subscription) {
      return false; // Se não encontrou subscription, não bloquear
    }

    // Verificar se trial expirou
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      return trialEnd < new Date();
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar trial expirado:', error);
    return false; // Em caso de erro, não bloquear
  }
}

/**
 * Extrai tenant_id dos cookies de autenticação
 */
function getTenantIdFromCookies(request: NextRequest): string | null {
  try {
    // Tentar extrair de cookies específicos do sistema
    const tenantCookie = request.cookies.get('tenant_id')?.value;
    if (tenantCookie) {
      return tenantCookie;
    }

    // Se não encontrou, retornar null (será verificado no client-side)
    return null;
  } catch (error) {
    console.error('Erro ao extrair tenant_id:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
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
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/admin' || route === '/admin-test') {
      // Para admin, verificar se é exatamente a rota ou uma subrota
      return pathname === route || pathname.startsWith(route + '/');
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Verificar se é uma rota que precisa verificar trial
  const isTrialProtectedRoute = trialProtectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Se for uma rota protegida, verificar se o usuário está autenticado
  if (isProtectedRoute) {
    // Verificar cookies do Supabase Auth
    const supabaseToken = request.cookies.get('sb-access-token')?.value;
    const supabaseAuth = request.cookies.getAll().find(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('auth-token')
    );
    
    if (!supabaseToken && !supabaseAuth) {
      // Redirecionar para login se não estiver autenticado
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se for uma rota que precisa verificar trial, verificar se expirou
    if (isTrialProtectedRoute) {
      const tenantId = getTenantIdFromCookies(request);
      
      if (tenantId) {
        try {
          const isTrialExpired = await checkTrialExpired(tenantId);
          
          if (isTrialExpired) {
            // Redirecionar para página de trial expirado
            return NextResponse.redirect(new URL('/trial-expirado', request.url));
          }
        } catch (error) {
          console.error('Erro ao verificar trial no middleware:', error);
          // Em caso de erro, deixar passar para verificação client-side
        }
      }
      // Se não conseguiu extrair tenant_id, deixar passar (será verificado no client-side)
    }
  }

  // Se for uma rota pública de autenticação e o usuário já estiver logado
  if (isPublicRoute && (pathname === '/login' || pathname === '/register')) {
    const supabaseToken = request.cookies.get('sb-access-token')?.value;
    const supabaseAuth = request.cookies.getAll().find(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('auth-token')
    );
    
    if (supabaseToken || supabaseAuth) {
      // Verificar se trial expirou antes de redirecionar
      const tenantId = getTenantIdFromCookies(request);
      
      if (tenantId) {
        const isTrialExpired = await checkTrialExpired(tenantId);
        
        if (isTrialExpired) {
          return NextResponse.redirect(new URL('/trial-expirado', request.url));
        }
      }
      
      // Redirecionar para dashboard se já estiver autenticado e trial não expirou
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
