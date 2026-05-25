"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function searchProducts(query: string, tenantId: string) {
  if (!query || query.trim().length === 0 || !tenantId) return [];

  console.log(`[searchProducts] Action called with query: "${query}", tenant: ${tenantId}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await supabase
    .from("products")
    .select("id, name, online_slug, online_images, price, online_price")
    .eq("organization_id", tenantId)
    .eq("is_published_online", true)
    .eq("is_active", true)
    .ilike("name", `%${query.trim()}%`)
    .limit(5);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data || [];
}
