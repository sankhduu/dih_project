import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Protect /admin and /lmo routes with statutory RBAC authentication
  if (pathname.startsWith('/admin') || pathname.startsWith('/lmo')) {
    const allCookies = req.cookies.getAll();
    const authCookie = allCookies.find(
      (c) =>
        c.name.includes('-auth-token') ||
        c.name.startsWith('sb-') ||
        c.name.includes('supabase') ||
        c.name.includes('emaap_auth')
    );

    // 1. If not authenticated at all, redirect to login page
    if (!authCookie || !authCookie.value) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. If authenticated, verify authorized role
    try {
      let rawContent = decodeURIComponent(authCookie.value);

      if (rawContent.startsWith('base64-')) {
        try {
          rawContent = Buffer.from(rawContent.slice(7), 'base64').toString('utf-8');
        } catch {
          // ignore parsing error
        }
      }

      // Restrict Traders and Applicants from accessing officer/admin operations
      const isTrader =
        rawContent.includes('"role":"APPLICANT"') ||
        rawContent.includes('"role":"Trader"') ||
        rawContent.includes('"role":"trader"');

      if (isTrader) {
        const unauthorizedUrl = new URL('/trader', req.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
    } catch (err) {
      console.warn('Middleware authentication inspection warning:', err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/lmo/:path*'],
};

