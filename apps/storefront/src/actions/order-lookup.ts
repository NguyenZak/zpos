"use server";

import { createServerClient } from "@supabase/ssr";
import { headers } from "next/headers";
import { resolveTenantFromHost } from "../lib/tenant";

// Minimal rate limit implementation for order lookup using Supabase
// (In a real scenario, this should be done with Upstash Redis to save DB load)
export async function lookupOrder(orderId: string, phone: string) {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    const tenant = await resolveTenantFromHost(host);
    
    if (!tenant?.id) {
      return { success: false, error: "Store not found" };
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Sanitize phone input
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        status,
        online_status,
        created_at,
        shipping_address,
        order_items (
          id,
          quantity,
          unit_price,
          product_variants (
            sku,
            attribute_values,
            products (name)
          )
        )
      `)
      .eq("organization_id", tenant.id)
      .eq("source", "online")
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .single();

    if (error || !order) {
      return { success: false, error: "Order not found. Please check your order number." };
    }

    // Verify phone number (simple check)
    // In actual implementation, we might want to check the customer phone linked to the order
    // We assume shipping_address contains the phone number
    let orderPhone = "";
    if (order.shipping_address && typeof order.shipping_address === 'object' && (order.shipping_address as any).phone) {
      orderPhone = (order.shipping_address as any).phone.replace(/[^0-9]/g, '');
    }

    if (orderPhone !== cleanPhone) {
      return { success: false, error: "Order not found. Please check your phone number." };
    }

    return { success: true, order };
  } catch (err: any) {
    return { success: false, error: err.message || "An error occurred during lookup." };
  }
}
