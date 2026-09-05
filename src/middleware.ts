import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Protect /admin and root (/)
  if (pathname === '/' || pathname.startsWith('/admin')) {
    // 1. Check for Supabase Auth session tokens in cookies
    const allCookies = req.cookies.getAll();
    const authCookie = allCookies.find(
      (c) =>
        c.name.includes('-auth-token') ||
        c.name.startsWith('sb-') ||
        c.name.includes('supabase') ||
        c.name.includes('emaap_auth')
    );

    // If no auth cookie is present on protected paths, kick back to login page
    if (!authCookie || !authCookie.value) {
      const loginUrl = new URL('/login', req.url);
      if (pathname.startsWith('/admin')) {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // 2. Parse cookie value for user metadata / role if available
    try {
      let rawContent = authCookie.value;

      // Handle base64-encoded cookie chunks
      if (rawContent.startsWith('base64-')) {
        try {
          rawContent = Buffer.from(rawContent.slice(7), 'base64').toString('utf-8');
        } catch {
          // ignore parsing error
        }
      }

      // Check if session contains 'Trader' or 'APPLICANT' role on /admin routes
      if (
        pathname.startsWith('/admin') &&
        (rawContent.includes('"role":"APPLICANT"') ||
          rawContent.includes('"role":"Trader"') ||
          rawContent.includes('"role":"trader"'))
      ) {
        // Kick unauthorized Trader role back to login or trader dashboard
        const unauthorizedUrl = new URL('/login', req.url);
        unauthorizedUrl.searchParams.set('error', 'unauthorized_trader_role');
        return NextResponse.redirect(unauthorizedUrl);
      }
    } catch (err) {
      console.warn('Middleware cookie inspection notice:', err);
    }
  }

  return res;
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};
