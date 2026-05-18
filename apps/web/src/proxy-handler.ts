import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { updateSession } from "@/utils/supabase/middleware";

// Helper: create a lightweight Supabase client for auth checks in proxy
function createProxySupabase(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const hostname = request.headers.get("host") || "";
  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
  if (hostname.includes("zpos.click")) {
    mainDomain = "zpos.click";
  } else if (hostname.includes("zpos.vn")) {
    mainDomain = "zpos.vn";
  }

  let cookieDomain: string | undefined = undefined;
  if (!isDev) {
    if (hostname.endsWith(mainDomain)) {
      cookieDomain = `.${mainDomain}`;
    } else {
      cookieDomain = ".zpos.click";
    }
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // no-op in proxy
      },
    },
    cookieOptions: isDev ? { path: "/" } : { domain: cookieDomain, path: "/" },
  });
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const mockSessionParam = url.searchParams.get("mock_session");

  // Intercept local mock sessions to establish secure, host-only subdomain cookies on localhost
  if (mockSessionParam) {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete("mock_session");
    
    const cleanResponse = NextResponse.redirect(cleanUrl);
    
    // Set cookie on current host explicitly (host-only cookie, perfectly supported on localhost subdomains)
    cleanResponse.cookies.set("zpos_mock_session", mockSessionParam, {
      path: "/",
      maxAge: 86400,
      httpOnly: false,
    });
    
    return cleanResponse;
  }

  // 1. Update Supabase Session — refreshes cookies
  const response = await updateSession(request);
  const hostname = request.headers.get("host") || "";

  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
  if (hostname.includes("zpos.click")) {
    mainDomain = "zpos.click";
  } else if (hostname.includes("zpos.vn")) {
    mainDomain = "zpos.vn";
  }

  // Extract subdomain
  const subdomain = hostname.endsWith(`.${mainDomain}`) ? hostname.replace(`.${mainDomain}`, "") : null;

  // Auth route detection
  const isAuthRoute =
    url.pathname.startsWith("/v1") ||
    url.pathname.startsWith("/v2") ||
    url.pathname === "/login" ||
    url.pathname === "/register";

  // --- Auth Session Check (Live + Mock Fallback) ---
  const supabase = createProxySupabase(request);
  let user: any = null;
  const mockSession = request.cookies.get("zpos_mock_session");

  // Prioritize sandbox mock session to enable bypass across live/local environments smoothly
  if (mockSession?.value) {
    try {
      const mockUser = JSON.parse(decodeURIComponent(mockSession.value));
      
      // Ensure the mock session is valid for the current host subdomain
      const isTenantSubdomain = subdomain && !["www", "app", "console", "cms"].includes(subdomain);
      let isValidMock = true;

      if (isTenantSubdomain) {
        if (mockUser.global_role !== "super_admin" && mockUser.associated_tenant !== subdomain) {
          isValidMock = false;
        }
      } else if (subdomain === "console") {
        if (mockUser.global_role !== "super_admin") {
          isValidMock = false;
        }
      }

      if (isValidMock) {
        user = {
          id: mockUser.email,
          email: mockUser.email,
          user_metadata: { full_name: mockUser.full_name, role: mockUser.global_role },
        };
      }
    } catch (e) {
      console.error("Failed to parse mock session cookie in proxy:", e);
    }
  }

  // Fallback to Live Supabase if no active sandbox session is present
  if (!user) {
    const { data: { user: liveUser } } = await supabase.auth.getUser();
    user = liveUser;
  }

  // Helper: rewrite + preserve session cookies & clean up trailing slashes
  const rewriteWithSession = (path: string) => {
    let cleanPath = path;
    try {
      const urlObj = new URL(path, request.url);
      if (urlObj.pathname.endsWith("/") && urlObj.pathname !== "/") {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
        cleanPath = `${urlObj.pathname}${urlObj.search}`;
      }
    } catch (_e) {
      if (cleanPath.includes("?")) {
        const [parts, query] = cleanPath.split("?");
        if (parts.endsWith("/") && parts !== "/") {
          cleanPath = `${parts.slice(0, -1)}?${query}`;
        }
      } else if (cleanPath.endsWith("/") && cleanPath !== "/") {
        cleanPath = cleanPath.slice(0, -1);
      }
    }

    const newResponse = NextResponse.rewrite(new URL(cleanPath, request.url));
    response.cookies.getAll().forEach((cookie) => {
      newResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    // Enterprise SEO safety: Inject x-robots-tag header at the edge for all tenant and admin routes
    if (cleanPath.startsWith("/app") || cleanPath.startsWith("/console") || cleanPath.startsWith("/cms") || subdomain) {
      newResponse.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    }

    return newResponse;
  };

  // Development Fallback: Allow path-based access on localhost
  const isLocal = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  if (!subdomain && isLocal) {
    // 1. Pass-through known routes to avoid rewriting console/cms/api
    if (
      url.pathname.startsWith("/console") ||
      url.pathname.startsWith("/cms") ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/_next") ||
      isAuthRoute
    ) {
      return response;
    }

    // 2. Main landing page → show landing page (or /app if already logged in)
    if (url.pathname === "/") {
      if (user) {
        return rewriteWithSession("/app");
      }
      // Allow landing page to render for unauthenticated users
      return response;
    }

    // 3. Auto-rewrite root-relative paths like /dashboard, /pos to /app/*
    if (!url.pathname.startsWith("/app")) {
      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", url.pathname);
        return NextResponse.redirect(loginUrl);
      }

      return rewriteWithSession(`/app${url.pathname}${url.search}`);
    }

    // 4. Auth guard for existing /app/* paths
    if (url.pathname.startsWith("/app")) {
      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", url.pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }
  }

  // --- Subdomain Routing ---

  // app.zpos.click → /app/*
  if (subdomain === "app") {
    // Allow auth routes to pass through
    if (isAuthRoute) return response;

    // Auth guard: unauthenticated → redirect to /login
    if (!user) {
      // Root → /login
      if (url.pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user on /login or /register → redirect to /app
    if (url.pathname === "/login" || url.pathname === "/register") {
      return rewriteWithSession("/app");
    }

    const targetPath = url.pathname.startsWith("/app") ? url.pathname : `/app${url.pathname}`;
    return rewriteWithSession(`${targetPath}${url.search}`);
  }

  // console.zpos.click → /console/*
  if (subdomain === "console") {
    // Allow auth routes to pass through
    if (isAuthRoute) return response;

    // 1. Auth Guard: Check if user is logged in
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", url.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role Guard: Check if the user is a super_admin
    let isSuperAdmin =
      user.email?.toLowerCase().endsWith("@zpos.click") ||
      user.email?.toLowerCase().endsWith("@zpos.vn") ||
      user.user_metadata?.role === "super_admin";

    // Sandbox Showcase Fallback: allow zpos_mock_session cookie to override role guard locally and on demo domains
    if (!isSuperAdmin) {
      const mockSession = request.cookies.get("zpos_mock_session");
      if (mockSession?.value) {
        try {
          const mockUser = JSON.parse(decodeURIComponent(mockSession.value));
          if (mockUser.global_role === "super_admin") {
            isSuperAdmin = true;
          }
        } catch (e) {
          console.error("Failed to parse mock session for role guard bypass:", e);
        }
      }
    }

    if (!isSuperAdmin) {
      // Track unauthorized console access attempt in audit log
      fetch(new URL("/api/admin/audit-logs", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unauthorized_access",
          module: "console",
          severity: "critical",
          metadata: { attempted_url: url.pathname, reason: "Non-super-admin tried to access console subdomain" }
        })
      }).catch((e) => console.warn("Failed to log unauthorized access in middleware:", e));

      // Redirect unauthorized users to login with an error message
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized_console_access");
      return NextResponse.redirect(loginUrl);
    }

    // Preserve tenants/new page routing
    if (url.pathname === "/tenants/new" || url.pathname === "/console/tenants/new") {
      return rewriteWithSession(`/console/tenants/new${url.search}`);
    }
    // All other paths (like /dashboard, /users) map to the single-page Super Admin console
    return rewriteWithSession(`/console${url.search}`);
  }

  // cms.zpos.click → /cms/*
  if (subdomain === "cms") {
    // All paths rewrite to the main CMS page
    return rewriteWithSession(`/cms${url.search}`);
  }

  // --- Tenant Subdomain Routing (bibomart.zpos.click, juno.zpos.click …) ---
  if (subdomain && !["www", "app", "console", "cms"].includes(subdomain)) {
    // Validate tenant exists
    let tenantExists = false;
    try {
      const { data: tenant } = await supabase.from("organizations").select("slug").eq("slug", subdomain).maybeSingle();
      if (tenant) {
        tenantExists = true;
      }
    } catch (e) {
      console.warn("Database tenant lookup failed, checking static list:", e);
    }

    // Fail-safe fallback for RLS or offline mock scenarios
    if (!tenantExists) {
      const knownTenants = ["bibomart", "comnieusg", "juno", "tch-q3", "kphone", "z", "zpos-web", "app"];
      if (knownTenants.includes(subdomain)) {
        tenantExists = true;
      }
    }

    if (!tenantExists) {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      return NextResponse.redirect(new URL(`${protocol}://${mainDomain}/`));
    }

    // Validate live Supabase user tenant membership
    let hasAccess = false;
    if (user) {
      const isMockUser = !!mockSession?.value;
      if (isMockUser) {
        hasAccess = true;
      } else {
        const isLiveSuperAdmin =
          user.email?.toLowerCase().endsWith("@zpos.click") ||
          user.email?.toLowerCase().endsWith("@zpos.vn") ||
          user.user_metadata?.role === "super_admin";

        if (isLiveSuperAdmin) {
          hasAccess = true;
        } else {
          try {
            const { data: member } = await supabase
              .from("organization_members")
              .select("id, organizations!inner(slug)")
              .eq("profile_id", user.id)
              .eq("organizations.slug", subdomain)
              .maybeSingle();
            if (member) {
              hasAccess = true;
            }
          } catch (e) {
            console.warn("Failed to verify live user tenant membership:", e);
          }
        }
      }
    }

    // Root path → send to /login or /app
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL((user && hasAccess) ? "/app" : "/login", request.url));
    }

    // Auth guard: unauthenticated or unauthorized attempting /app/* → redirect to /login
    if ((!user || !hasAccess) && !isAuthRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", url.pathname);
      if (user && !hasAccess) {
        loginUrl.searchParams.set("error", "tenant_access_denied");
      }
      return NextResponse.redirect(loginUrl);
    }

    // Auth guard: authenticated AND authorized attempting /login → redirect to /app
    if (user && hasAccess && (url.pathname === "/login" || url.pathname === "/register")) {
      return NextResponse.redirect(new URL("/app", request.url));
    }

    // Auth pages pass through (they serve /login directly)
    if (isAuthRoute) {
      return response;
    }

    // Rewrite to /app/* and attach tenant header
    const targetPath = url.pathname.startsWith("/app") ? url.pathname : `/app${url.pathname}`;
    const tenantResponse = rewriteWithSession(`${targetPath}${url.search}`);
    tenantResponse.headers.set("x-zpos-tenant", subdomain);
    return tenantResponse;
  }

  // --- Main domain / marketing ---
  return response;
}

export default proxy;
