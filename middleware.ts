import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isConviteLanding = /^\/convite\/.+/.test(req.nextUrl.pathname);
  const isPublicRoute = ['/login', '/cadastro'].some(route => req.nextUrl.pathname.startsWith(route)) || isConviteLanding;
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

  // Referral gate: non-suppliers after 7 days must have invited 3 friends
  const isConviteRoute = req.nextUrl.pathname.startsWith('/convite');
  if (session && !isSupplier && !isFornecedorRoute && !isPublicRoute && !isConviteRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, acesso_vitalicio')
      .eq('id', session.user.id)
      .single();

    if (!profile?.acesso_vitalicio && profile?.created_at) {
      const createdAt = new Date(profile.created_at);
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCreation > 7) {
        const { count } = await supabase
          .from('referral_invites')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', session.user.id);

        const daysAllowed = 7 + (count ?? 0) * 5;
        if (daysSinceCreation > daysAllowed) {
          return NextResponse.redirect(new URL('/convite', req.url));
        }
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