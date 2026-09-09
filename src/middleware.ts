import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    // 1. Check for session tokens or role cookies
    const allCookies = req.cookies.getAll();
    const authCookie = allCookies.find(
      (c) =>
        c.name.includes('-auth-token') ||
        c.name.startsWith('sb-') ||
        c.name.includes('supabase') ||
        c.name.includes('emaap_auth')
    );

    // If an auth cookie is present, verify role authorization
    if (authCookie && authCookie.value) {
      try {
        let rawContent = decodeURIComponent(authCookie.value);

        // Handle base64-encoded cookie chunks if present
        if (rawContent.startsWith('base64-')) {
          try {
            rawContent = Buffer.from(rawContent.slice(7), 'base64').toString('utf-8');
          } catch {
            // ignore parsing error
          }
        }

        // Restrict Traders / Applicants from admin routes
        if (
          rawContent.includes('"role":"APPLICANT"') ||
          rawContent.includes('"role":"Trader"') ||
          rawContent.includes('"role":"trader"')
        ) {
          const unauthorizedUrl = new URL('/trader/dashboard', req.url);
          return NextResponse.redirect(unauthorizedUrl);
        }
      } catch (err) {
        console.warn('Middleware cookie inspection note:', err);
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
