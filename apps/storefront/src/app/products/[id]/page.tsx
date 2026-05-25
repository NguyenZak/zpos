import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantFromHost } from "../../../lib/tenant";
import { ProductDetailClient } from "./ProductDetailClient";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) return {};

  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  let query = supabase
    .from("products")
    .select("name, seo_title, seo_description, online_description, description, size_guide")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true)
    .eq("is_active", true);

  if (isUuid) {
    query = query.eq("id", id);
  } else {
    query = query.eq("online_slug", id);
  }

  const { data: products } = await query.limit(1);
  const product = products?.[0];
  if (!product) return {};

  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.online_description || product.description || `Chi tiết sản phẩm ${product.name}`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) notFound();

  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  let query = supabase
    .from("products")
    .select("*, categories(id, name)")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true)
    .eq("is_active", true);

  if (isUuid) {
    query = query.eq("id", id);
  } else {
    query = query.eq("online_slug", id);
  }

  const { data: products, error } = await query.limit(1);
  const product = products?.[0];

  if (error || !product) {
    console.error("Product not found or query error:", error);
    notFound();
  }

  // Redirect to slug if accessed via ID
  if (isUuid && product.online_slug) {
    redirect(`/products/${product.online_slug}`);
  }

  // We use the service role key to fetch variants because product_variants lacks a public read RLS policy.
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: variants } = await adminSupabase
    .from("product_variants")
    .select("*, colors(id, name), sizes(id, name)")
    .eq("product_id", product.id);

  // Build variants fallback dynamically
  const resolvedVariants = (variants && variants.length > 0)
    ? variants.map(v => {
        // Inject color and size from foreign keys into attributes for compatibility with the frontend
        const injectedAttributes = { ...(v.attributes || {}) };
        if (v.colors?.name) {
          injectedAttributes["Color"] = v.colors.name;
        }
        if (v.sizes?.name) {
          injectedAttributes["Size"] = v.sizes.name;
        }

        return {
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          image_url: v.image_url,
          attributes: injectedAttributes,
          stock: v.stock ?? null,
        };
      })
    : [{
        id: product.id,
        name: product.name,
        sku: product.sku || null,
        price: Number(product.online_price || product.base_price || 0),
        image_url: product.image_url || null,
        attributes: {},
        stock: product.stock ?? null,
      }];

  let relatedQuery = supabase
    .from("products")
    .select("id, name, online_slug, online_price, base_price, online_images")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4);

  if (product.category_id) {
    relatedQuery = relatedQuery.eq("category_id", product.category_id);
  }

  const { data: relatedProducts } = await relatedQuery;

  const { data: reviews, error: reviewsError } = await supabase
    .from("product_reviews")
    .select("id, author_name, content, rating, created_at")
    .eq("product_id", product.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Reviews fetch error (table might not exist):", reviewsError);
  }

  return (
    <ProductDetailClient
      product={product}
      variants={resolvedVariants}
      relatedProducts={relatedProducts || []}
      reviews={reviews || []}
      tenantId={tenant.id}
    />
  );
}
