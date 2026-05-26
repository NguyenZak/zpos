import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { getTenantBySlug, resolveStorefrontHost } from "@/lib/tenant-cache";
import { updateSession } from "@/utils/supabase/middleware";
import { isSuperAdminUser } from "@/utils/super-admin";

function resolveMainDomain(hostname: string) {
  let mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";

  if (hostname.includes("localhost")) {
    const port = hostname.includes(":") ? hostname.split(":").pop() : "";
    return port ? `localhost:${port}` : "localhost";
  }

  if (hostname.includes("zpos.click")) {
    mainDomain = "zpos.click";
  } else if (hostname.includes("zpos.vn")) {
    mainDomain = "zpos.vn";
  }

  return mainDomain;
}

function resolveStorefrontDomain(hostname: string) {
  // Domain riêng cho storefront (tách khỏi admin `*.zpos.click`)
  const configured = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN;
  if (configured) return configured;

  if (hostname.includes("localhost")) {
    const port = hostname.includes(":") ? hostname.split(":").pop() : "";
    return port ? `shop.localhost:${port}` : "shop.localhost";
  }

  return "zshop.click";
}

// Helper: create a lightweight Supabase client for auth checks in proxy
function createProxySupabase(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const hostname = request.headers.get("host") || "";
  const mainDomain = resolveMainDomain(hostname);

  let cookieDomain: string | undefined;
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

  // 1. Update Supabase Session — refreshes cookies
  const response = await updateSession(request);
  const hostname = request.headers.get("host") || "";
  const isLocal = hostname.includes("localhost") || hostname.includes("127.0.0.1");

  const mainDomain = resolveMainDomain(hostname);
  const storefrontDomain = resolveStorefrontDomain(hostname);

  // ─── STOREFRONT ROUTING (public, no auth) ─────────────────────────────
  // Phải check TRƯỚC khi chạy auth flow của admin app.
  // Match nếu: 
  //   - hostname kết thúc bằng `-shop.${mainDomain}` (Giải pháp 2: kphone-shop.zpos.click)
  //   - hostname là *.zshop.click (subdomain mặc định cũ/nếu được cấu hình)
  //   - hoặc hostname là custom domain đã verified.
  const isShopSubdomain = hostname.endsWith(`-shop.${mainDomain}`);
  const isStorefrontHost =
    isShopSubdomain ||
    hostname.endsWith(`.${storefrontDomain}`) ||
    (!hostname.endsWith(mainDomain) && !isLocal); // có thể là custom domain

  if (isStorefrontHost) {
    let storefrontTenant: { tenantSlug: string; tenantId: string; isCustomDomain: boolean } | null = null;

    if (isShopSubdomain) {
      const slug = hostname.replace(`-shop.${mainDomain}`, "");
      if (slug && slug !== "www") {
        const tenant = await getTenantBySlug(slug);
        if (tenant?.tenantId && tenant.storefrontEnabled) {
          storefrontTenant = {
            tenantSlug: tenant.tenantSlug,
            tenantId: tenant.tenantId,
            isCustomDomain: false,
          };
        }
      }
    } else {
      storefrontTenant = await resolveStorefrontHost(hostname, storefrontDomain);
    }

    if (storefrontTenant) {
      const targetPath = url.pathname.startsWith("/storefront") ? url.pathname : `/storefront${url.pathname}`;

      const storefrontResponse = NextResponse.rewrite(new URL(`${targetPath}${url.search}`, request.url));
      storefrontResponse.headers.set("x-zpos-storefront-tenant", storefrontTenant.tenantSlug);
      storefrontResponse.headers.set("x-zpos-storefront-tenant-id", storefrontTenant.tenantId);
      if (storefrontTenant.isCustomDomain) {
        storefrontResponse.headers.set("x-zpos-storefront-custom-domain", "1");
      }
      // KHÔNG set noindex — storefront cần SEO
      return storefrontResponse;
    }

    // Custom domain hoặc -shop subdomain trỏ về nhưng tenant chưa active/không tìm thấy → 404 friendly
    return NextResponse.rewrite(new URL("/storefront/not-found", request.url));
  }
  // ──────────────────────────────────────────────────────────────────────

  // Extract subdomain
  const subdomain = hostname.endsWith(`.${mainDomain}`) ? hostname.replace(`.${mainDomain}`, "") : null;

  // Auth route detection
  const isAuthRoute =
    url.pathname.startsWith("/v1") ||
    url.pathname.startsWith("/v2") ||
    url.pathname === "/login" ||
    url.pathname === "/register";

  // --- Auth Session Check (Supabase only) ---
  const supabase = createProxySupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  if (!subdomain && isLocal) {
    // 1. Pass-through known routes to avoid rewriting console/cms/api
    if (url.pathname.startsWith("/console")) {
      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", url.pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (!isSuperAdminUser(user)) {
        return rewriteWithSession("/unauthorized");
      }
      return response;
    }

    if (
      url.pathname.startsWith("/cms") ||
      url.pathname.startsWith("/storefront") ||
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
    if (
      !url.pathname.startsWith("/app") &&
      !url.pathname.startsWith("/cms") &&
      !url.pathname.startsWith("/storefront")
    ) {
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

    const targetPath =
      url.pathname.startsWith("/app") || url.pathname.startsWith("/cms") || url.pathname.startsWith("/storefront")
        ? url.pathname
        : `/app${url.pathname}`;
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

    if (!isSuperAdminUser(user)) {
      return rewriteWithSession("/unauthorized");
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
    // Validate tenant exists — dùng tenant-cache (loại bỏ DB query mỗi request)
    let tenantExists = false;
    try {
      const tenant = await getTenantBySlug(subdomain);
      if (tenant?.tenantId) {
        tenantExists = true;
      }
    } catch (e) {
      console.warn("Tenant cache lookup failed, checking static list:", e);
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
      const isLiveSuperAdmin = isSuperAdminUser(user);

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

    // Root path → send to /login or /app
    if (url.pathname === "/") {
      return NextResponse.redirect(new URL(user && hasAccess ? "/app" : "/login", request.url));
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
    const targetPath =
      url.pathname.startsWith("/app") || url.pathname.startsWith("/cms") || url.pathname.startsWith("/storefront")
        ? url.pathname
        : `/app${url.pathname}`;
    const tenantResponse = rewriteWithSession(`${targetPath}${url.search}`);
    tenantResponse.headers.set("x-zpos-tenant", subdomain);
    return tenantResponse;
  }

  // --- Main domain / marketing ---
  return response;
}

export default proxy;
