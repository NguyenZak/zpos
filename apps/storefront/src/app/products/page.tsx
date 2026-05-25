import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantFromHost } from "../../lib/tenant";
import { ProductsCatalogClient } from "./ProductsCatalogClient";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) return {};

  return {
    title: `Tất Cả Sản Phẩm | ${tenant.name}`,
    description: `Khám phá bộ sưu tập đầy đủ của ${tenant.name} - Phong cách tối giản cao cấp.`,
  };
}

export default async function ProductsPage() {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) notFound();

  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Fetch all online products for this tenant, including their variants to extract sizes and colors
  const { data: products, error } = await adminSupabase
    .from("products")
    .select("*, categories(id, name), product_variants(colors(id, name), sizes(id, name))")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching all products:", error);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center uppercase tracking-widest text-xs">Đang tải...</div>}>
      <ProductsCatalogClient
        products={products || []}
      />
    </Suspense>
  );
}
