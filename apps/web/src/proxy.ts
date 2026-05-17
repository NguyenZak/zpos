import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

// Helper: create a lightweight Supabase client for auth checks in proxy
function createProxySupabase(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const hostname = request.headers.get('host') || '';
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';
  
  let cookieDomain = undefined;
  if (!isDev) {
    if (hostname.endsWith(mainDomain)) {
      cookieDomain = `.${mainDomain}`;
    } else {
      cookieDomain = ".zpos.vn";
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
      cookieOptions: isDev 
        ? { path: "/" }
        : { domain: cookieDomain, path: "/" },
    }
  );
}

export async function proxy(request: NextRequest) {
  // 1. Update Supabase Session — refreshes cookies
  let response = await updateSession(request);

  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';
  
  // Extract subdomain
  const subdomain = hostname.endsWith(`.${mainDomain}`)
    ? hostname.replace(`.${mainDomain}`, '')
    : null;

  // Auth route detection
  const isAuthRoute = 
    url.pathname.startsWith('/v1') || 
    url.pathname.startsWith('/v2') || 
    url.pathname === '/login' || 
    url.pathname === '/register';

  // --- Auth Session Check (Live + Mock Fallback) ---
  const supabase = createProxySupabase(request);
  let { data: { user } } = await supabase.auth.getUser();

  // Check for local mock session cookie (enables sandbox logins across subdomains)
  if (!user) {
    const mockSession = request.cookies.get('zpos_mock_session');
    if (mockSession?.value) {
      try {
        const mockUser = JSON.parse(decodeURIComponent(mockSession.value));
        user = {
          id: mockUser.email,
          email: mockUser.email,
          user_metadata: { full_name: mockUser.full_name, role: mockUser.global_role }
        } as any;
      } catch (e) {
        console.error("Failed to parse mock session cookie in proxy:", e);
      }
    }
  }

  // Helper: rewrite + preserve session cookies & clean up trailing slashes
  const rewriteWithSession = (path: string) => {
    let cleanPath = path;
    try {
      const urlObj = new URL(path, request.url);
      if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
        cleanPath = `${urlObj.pathname}${urlObj.search}`;
      }
    } catch (e) {
      if (cleanPath.includes('?')) {
        const [parts, query] = cleanPath.split('?');
        if (parts.endsWith('/') && parts !== '/') {
          cleanPath = `${parts.slice(0, -1)}?${query}`;
        }
      } else if (cleanPath.endsWith('/') && cleanPath !== '/') {
        cleanPath = cleanPath.slice(0, -1);
      }
    }

    const newResponse = NextResponse.rewrite(new URL(cleanPath, request.url));
    response.cookies.getAll().forEach(cookie => {
      newResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return newResponse;
  };

  // Development Fallback: Allow path-based access on localhost
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  if (!subdomain && isLocal) {
    // 1. Pass-through known routes to avoid rewriting console/cms/api
    if (
      url.pathname.startsWith('/console') ||
      url.pathname.startsWith('/cms') ||
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/_next') ||
      isAuthRoute
    ) {
      return response;
    }

    // 2. Main landing page maps to marketing
    if (url.pathname === '/') {
      return response;
    }

    // 3. Auto-rewrite root-relative paths like /dashboard, /pos to /app/*
    if (!url.pathname.startsWith('/app')) {
      if (!user) {
        const loginUrl = new URL('/v2/login', request.url);
        loginUrl.searchParams.set('redirectTo', url.pathname);
        return NextResponse.redirect(loginUrl);
      }

      return rewriteWithSession(`/app${url.pathname}${url.search}`);
    }

    // 4. Auth guard for existing /app/* paths
    if (url.pathname.startsWith('/app')) {
      if (!user) {
        const loginUrl = new URL('/v2/login', request.url);
        loginUrl.searchParams.set('redirectTo', url.pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }
  }

  // --- Subdomain Routing ---

  // app.zpos.vn → /app/*
  if (subdomain === 'app') {
    // Allow auth routes to pass through
    if (isAuthRoute) return response;

    // Auth guard: unauthenticated → redirect to /v2/login
    if (!user) {
      // Root → /v2/login
      if (url.pathname === '/') {
        return NextResponse.redirect(new URL('/v2/login', request.url));
      }
      const loginUrl = new URL('/v2/login', request.url);
      loginUrl.searchParams.set('redirectTo', url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user on /login or /register → redirect to /app
    if (url.pathname === '/login' || url.pathname === '/register') {
      return rewriteWithSession('/app');
    }

    const targetPath = url.pathname.startsWith('/app') ? url.pathname : `/app${url.pathname}`;
    return rewriteWithSession(`${targetPath}${url.search}`);
  }

  // console.zpos.vn → /console/*
  if (subdomain === 'console') {
    // Allow auth routes to pass through
    if (isAuthRoute) return response;

    // 1. Auth Guard: Check if user is logged in
    if (!user) {
      const loginUrl = new URL('/v2/login', request.url);
      loginUrl.searchParams.set('redirectTo', url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role Guard: Check if the user is a super_admin
    let isSuperAdmin = 
      user.email?.toLowerCase().endsWith('@zpos.vn') || 
      user.user_metadata?.role === 'super_admin';

    // Development Fallback: allow zpos_mock_session cookie to override role guard locally
    if (!isSuperAdmin && isLocal) {
      const mockSession = request.cookies.get('zpos_mock_session');
      if (mockSession?.value) {
        try {
          const mockUser = JSON.parse(decodeURIComponent(mockSession.value));
          if (mockUser.global_role === 'super_admin') {
            isSuperAdmin = true;
          }
        } catch (e) {
          console.error("Failed to parse mock session for role guard bypass:", e);
        }
      }
    }

    if (!isSuperAdmin) {
      // Redirect unauthorized users to login with an error message
      const loginUrl = new URL('/v2/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized_console_access');
      return NextResponse.redirect(loginUrl);
    }

    // Preserve tenants/new page routing
    if (url.pathname === '/tenants/new' || url.pathname === '/console/tenants/new') {
      return rewriteWithSession(`/console/tenants/new${url.search}`);
    }
    // All other paths (like /dashboard, /users) map to the single-page Super Admin console
    return rewriteWithSession(`/console${url.search}`);
  }

  // cms.zpos.vn → /cms/*
  if (subdomain === 'cms') {
    // All paths rewrite to the main CMS page
    return rewriteWithSession(`/cms${url.search}`);
  }

  // --- Tenant Subdomain Routing (bibomart.zpos.vn, juno.zpos.vn …) ---
  if (subdomain && !['www', 'app', 'console', 'cms'].includes(subdomain)) {
    // Validate tenant exists
    const { data: tenant } = await supabase
      .from('organizations')
      .select('slug')
      .eq('slug', subdomain)
      .single();

    if (!tenant) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      return NextResponse.redirect(new URL(`${protocol}://${mainDomain}/`));
    }

    // Root path → send to /login or /app
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL(user ? '/app' : '/login', request.url));
    }

    // Auth guard: unauthenticated attempting /app/* → redirect to /login
    if (!user && !isAuthRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Auth guard: authenticated attempting /login → redirect to /app
    if (user && (url.pathname === '/login' || url.pathname === '/register')) {
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // Auth pages pass through (they serve /v2/login via next.config redirects)
    if (isAuthRoute) {
      return response;
    }

    // Rewrite to /app/* and attach tenant header
    const targetPath = url.pathname.startsWith('/app') ? url.pathname : `/app${url.pathname}`;
    const tenantResponse = rewriteWithSession(`${targetPath}${url.search}`);
    tenantResponse.headers.set('x-zpos-tenant', subdomain);
    return tenantResponse;
  }

  // --- Main domain / marketing ---
  return response;
}

export default proxy;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
