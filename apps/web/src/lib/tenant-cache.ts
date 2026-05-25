/**
 * Tenant Cache Layer — KHÔNG chạm Postgres trong middleware.
 *
 * Strategy ($0 stack):
 *   - Cache trong-memory module-level (Edge Runtime sống lâu giữa request)
 *   - Fallback: query Supabase + populate cache
 *   - TTL 1 giờ — đủ ngắn để invalidate hợp lý, đủ dài để giảm 99% query
 *   - Invalidate qua API route khi admin thay đổi storefront settings
 *
 * Khi có ngân sách:
 *   - Thay in-memory bằng Upstash Redis (REST) hoặc Cloudflare Workers KV
 *   - Multi-region cache shared giữa các edge node
 */

import { createServerClient } from "@supabase/ssr";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

type TenantCacheEntry = {
  tenantId: string;
  tenantSlug: string;
  storefrontEnabled: boolean;
  contactInfo?: string;
  socialLinks?: string;
  expiresAt: number;
};

// Module-level cache (Edge Runtime giữ giữa các request trên cùng instance)
const slugCache = new Map<string, TenantCacheEntry>();
const domainCache = new Map<string, TenantCacheEntry>();

function isExpired(entry: TenantCacheEntry): boolean {
  return Date.now() > entry.expiresAt;
}

function makeAnonClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/**
 * Lookup tenant bằng slug (subdomain `{slug}.zshop.click` hoặc `{slug}.zpos.click`).
 */
export async function getTenantBySlug(slug: string): Promise<TenantCacheEntry | null> {
  const cached = slugCache.get(slug);
  if (cached && !isExpired(cached)) return cached;

  const supabase = makeAnonClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, slug, storefront_enabled, contact_info, social_links")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    // Cache negative result ngắn hơn (5 phút) để tránh DDoS subdomain không tồn tại
    slugCache.set(slug, {
      tenantId: "",
      tenantSlug: slug,
      storefrontEnabled: false,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return null;
  }

  const entry: TenantCacheEntry = {
    tenantId: data.id,
    tenantSlug: data.slug,
    storefrontEnabled: data.storefront_enabled ?? false,
    contactInfo: data.contact_info,
    socialLinks: data.social_links,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  slugCache.set(slug, entry);
  return entry;
}

/**
 * Lookup tenant bằng custom domain (vd `bibomart.com` → tenant `bibomart`).
 */
export async function getTenantByCustomDomain(hostname: string): Promise<TenantCacheEntry | null> {
  const cached = domainCache.get(hostname);
  if (cached && !isExpired(cached)) return cached;

  const supabase = makeAnonClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, slug, storefront_enabled, custom_domain_status, contact_info, social_links")
    .eq("storefront_custom_domain", hostname)
    .eq("custom_domain_verified", true)
    .eq("custom_domain_status", "active")
    .maybeSingle();

  if (!data) {
    domainCache.set(hostname, {
      tenantId: "",
      tenantSlug: "",
      storefrontEnabled: false,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    return null;
  }

  const entry: TenantCacheEntry = {
    tenantId: data.id,
    tenantSlug: data.slug,
    storefrontEnabled: data.storefront_enabled ?? false,
    contactInfo: data.contact_info,
    socialLinks: data.social_links,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  domainCache.set(hostname, entry);
  return entry;
}

/**
 * Gọi từ admin khi tenant đổi storefront settings hoặc domain.
 * Tốt nhất expose qua API route `/api/internal/tenant-cache/invalidate`.
 */
export function invalidateTenantBySlug(slug: string) {
  slugCache.delete(slug);
}

export function invalidateTenantByDomain(hostname: string) {
  domainCache.delete(hostname);
}

/**
 * Resolve storefront request từ hostname.
 * Trả về tenant slug nếu là storefront, null nếu không phải.
 */
export async function resolveStorefrontHost(
  hostname: string,
  storefrontMainDomain: string,
): Promise<{ tenantSlug: string; tenantId: string; isCustomDomain: boolean } | null> {
  // 1. Custom domain — ưu tiên cao nhất
  if (!hostname.endsWith(storefrontMainDomain)) {
    const tenant = await getTenantByCustomDomain(hostname);
    if (tenant?.tenantId && tenant.storefrontEnabled) {
      return {
        tenantSlug: tenant.tenantSlug,
        tenantId: tenant.tenantId,
        isCustomDomain: true,
      };
    }
    return null;
  }

  // 2. Subdomain `{slug}.zshop.click`
  const slug = hostname.replace(`.${storefrontMainDomain}`, "");
  if (!slug || slug === "www") return null;

  const tenant = await getTenantBySlug(slug);
  if (tenant?.tenantId && tenant.storefrontEnabled) {
    return {
      tenantSlug: tenant.tenantSlug,
      tenantId: tenant.tenantId,
      isCustomDomain: false,
    };
  }

  return null;
}
