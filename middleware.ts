import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que NÃO exigem plano ativo (trial/premium).
const ROTAS_LIVRES = [
  '/',
  '/login',
  '/cadastro',
  '/plano',
  '/api/cakto',
  '/esqueceu-senha',
  '/redefinir-senha',
];

// Verifica se o profile tem acesso liberado (trial válido ou premium ativo).
function verificarAcesso(p: {
  plano_ativo: string | null;
  trial_expira_em: string | null;
  assinatura_expira_em: string | null;
} | null): boolean {
  if (!p) return false;
  const agora = Date.now();
  if (p.plano_ativo === 'premium') {
    return !p.assinatura_expira_em || new Date(p.assinatura_expira_em).getTime() > agora;
  }
  if (p.plano_ativo === 'trial') {
    return !!p.trial_expira_em && new Date(p.trial_expira_em).getTime() > agora;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublicRoute = ['/login', '/cadastro'].some(route => req.nextUrl.pathname.startsWith(route));
  const isFornecedorRoute = req.nextUrl.pathname.startsWith('/fornecedor');
  const isSupplier = session?.user?.user_metadata?.is_fornecedor === true;

  // Admin routes: restricted to owner email only
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session || !ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return res;
  }

  if (!session && !isPublicRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isPublicRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = isSupplier ? '/fornecedor' : '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Prevent suppliers from accessing patient routes
  if (session && isSupplier && !isFornecedorRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL('/fornecedor', req.url));
  }

  // Paywall: pacientes (não-fornecedores) precisam de plano ativo. Se o trial
  // expirou e não há assinatura, redireciona para /plano — exceto nas rotas
  // livres.
  if (session && !isSupplier && !isFornecedorRoute) {
    const onRotaLivre = ROTAS_LIVRES.some(r => req.nextUrl.pathname.startsWith(r));
    if (!onRotaLivre) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano_ativo, trial_expira_em, assinatura_expira_em')
        .eq('id', session.user.id)
        .single();

      if (!verificarAcesso(profile)) {
        return NextResponse.redirect(new URL('/plano', req.url));
      }
    }
  }

  // Supplier Portal Routing Rules
  if (session && isFornecedorRoute) {
    const isCadastro = req.nextUrl.pathname === '/fornecedor/cadastro';
    const isAguardando = req.nextUrl.pathname === '/fornecedor/aguardando';

    const { data: fornecedor } = await supabase
      .from('fornecedores')
      .select('status')
      .eq('user_id', session.user.id)
      .single();

    if (!fornecedor) {
      if (!isCadastro) {
        return NextResponse.redirect(new URL('/fornecedor/cadastro', req.url));
      }
    } else if (fornecedor.status === 'pendente') {
      if (!isAguardando && !isCadastro) { // Allows editing in /cadastro
        return NextResponse.redirect(new URL('/fornecedor/aguardando', req.url));
      }
    } else if (fornecedor.status === 'ativo') {
      if (isCadastro || isAguardando) {
        return NextResponse.redirect(new URL('/fornecedor', req.url));
      }
    } else if (fornecedor.status === 'suspenso') {
       // Could redirect to a /fornecedor/suspenso page, but let's keep it simple
       if (!isAguardando) {
          return NextResponse.redirect(new URL('/fornecedor/aguardando', req.url));
       }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - splash.gif (Splash screen)
     * - .png, .jpg, .jpeg, .gif, .svg (Images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|splash.gif|sw\\.js|push-sw\\.js|workbox-|.*\\.(?:png|jpg|jpeg|gif|svg)$|icon.*).*)',
  ],
};