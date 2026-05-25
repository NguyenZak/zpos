import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { resolveTenantFromHost } from "../../../lib/tenant";
import { CategoryListingClient } from "./CategoryListingClient";
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
    .from("categories")
    .select("name")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true);

  if (isUuid) {
    query = query.eq("id", id);
  } else {
    const nameToSearch = decodeURIComponent(id).replace(/-/g, " ");
    query = query.ilike("name", nameToSearch);
  }

  const { data: category } = await query.maybeSingle();
  if (!category) return {};

  return {
    title: `${category.name} | ${tenant.name}`,
    description: `Khám phá các sản phẩm trong bộ sưu tập ${category.name} tại ${tenant.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
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

  let categoryQuery = supabase
    .from("categories")
    .select("*")
    .eq("organization_id", tenant.id)
    .eq("is_published_online", true);

  if (isUuid) {
    categoryQuery = categoryQuery.eq("id", id);
  } else {
    const nameToSearch = decodeURIComponent(id).replace(/-/g, " ");
    categoryQuery = categoryQuery.ilike("name", nameToSearch);
  }

  const { data: category, error: catError } = await categoryQuery.maybeSingle();

  if (catError || !category) {
    console.error("Category not found or query error:", catError);
    notFound();
  }

  // Get matching products
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", tenant.id)
    .eq("category_id", category.id)
    .eq("is_published_online", true)
    .eq("is_active", true);

  if (prodError) {
    console.error("Error fetching category products:", prodError);
  }

  return (
    <CategoryListingClient
      category={category}
      products={products || []}
    />
  );
}
