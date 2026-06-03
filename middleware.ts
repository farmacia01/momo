import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublicRoute = ['/login', '/cadastro'].some(route => req.nextUrl.pathname.startsWith(route));
  const isFornecedorRoute = req.nextUrl.pathname.startsWith('/fornecedor');
  const isSupplier = session?.user?.user_metadata?.is_fornecedor === true;

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
    '/((?!api|_next/static|_next/image|favicon.ico|icon.*|manifest.json).*)',
  ],
};