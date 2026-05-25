import { Redis } from "@upstash/redis";
import { createServerClient } from "@supabase/ssr";

// Assuming UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in env
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export type StorefrontTenant = {
  id: string;
  slug: string;
  name: string;
  theme: string;
  features: Record<string, boolean>;
  customCss: string | null;
  customHead: string | null;
  defaultBranchId: string | null;
  settings: Record<string, any>;
};

function makeAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function resolveTenantFromHost(host: string): Promise<StorefrontTenant | null> {
  const baseDomain = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || "zshop.click";
  const isLocalhost = host.includes("localhost");
  const isCustomDomain = !host.endsWith(baseDomain) && !isLocalhost;

  const cacheKey = isCustomDomain ? `domain:${host}` : `tenant:${host.split(".")[0]}`;

  // 1. Try KV Cache
  if (redis) {
    try {
      const cached = await redis.get<StorefrontTenant>(cacheKey);
      if (cached) return cached;
    } catch (e) {
      console.warn("Redis cache error:", e);
    }
  }

  // 2. Fallback to Postgres
  const supabase = makeAnonClient();
  let query = supabase.from("organizations").select(`
    id, slug, name, storefront_enabled,
    storefront_theme, storefront_features,
    storefront_custom_css, storefront_custom_head,
    storefront_settings,
    default_online_branch_id
  `);

  if (isCustomDomain) {
    query = query
      .eq("storefront_custom_domain", host)
      .eq("custom_domain_verified", true)
      .eq("custom_domain_status", "active");
  } else {
    query = query.eq("slug", host.split(".")[0]);
  }

  const { data } = await query.maybeSingle();

  if (!data || !data.storefront_enabled) {
    return null;
  }

  const tenant: StorefrontTenant = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    theme: data.storefront_theme || "minimal",
    features: data.storefront_features || {},
    customCss: data.storefront_custom_css,
    customHead: data.storefront_custom_head,
    defaultBranchId: data.default_online_branch_id,
    settings: data.storefront_settings || {},
  };

  // 3. Set KV Cache (1 hour TTL)
  if (redis) {
    try {
      await redis.setex(cacheKey, 3600, tenant);
    } catch (e) {
      console.warn("Failed to set Redis cache:", e);
    }
  }

  return tenant;
}
