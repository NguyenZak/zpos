"use server";

import { redis } from "../lib/redis";
import { getCart, clearCart } from "./cart-actions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const RESERVATION_TTL_SECONDS = 15 * 60; // 15 mins

export async function reserveStock() {
  const cart = await getCart();
  if (cart.items.length === 0) {
    return { success: false, error: "Giỏ hàng trống" };
  }

  if (!redis) {
    // Fallback: If no Redis, just return a dummy reservation.
    // Real validation will happen at RPC FOR UPDATE.
    return { success: true, reservation_ids: [crypto.randomUUID()] };
  }

  const reservationIds: string[] = [];

  try {
    for (const item of cart.items) {
      // For Phase 1, we do a simple INCR. In Phase 2, this should be a Lua script checking stock limits.
      const reservationId = crypto.randomUUID();
      const key = `inv:reserve:${item.variant_id}:${reservationId}`;
      
      await redis.setex(key, RESERVATION_TTL_SECONDS, item.qty);
      reservationIds.push(reservationId);
    }
    
    return { success: true, reservation_ids: reservationIds };
  } catch (error) {
    console.error("Failed to reserve stock", error);
    return { success: false, error: "Không thể giữ hàng tạm thời" };
  }
}

export async function placeOrder(customerInfo: any, reservationIds: string[], tenantId: string) {
  const cart = await getCart();
  if (cart.items.length === 0) {
    return { success: false, error: "Giỏ hàng trống" };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Gọi RPC create_online_order
  const { data, error } = await supabase.rpc("create_online_order", {
    p_org_id: tenantId,
    p_cart_token: cart.token,
    p_customer: customerInfo,
    p_items: cart.items.map(i => ({
      variant_id: i.variant_id,
      qty: i.qty,
      unit_price: i.unit_price
    })),
    p_payment_method: "cod"
  });

  if (error) {
    console.error("Checkout RPC error:", error);
    return { success: false, error: error.message || "Lỗi tạo đơn hàng" };
  }

  // Clear giỏ hàng và xoá reservation từ Redis
  await clearCart(cart.token);
  
  if (redis && reservationIds.length > 0) {
    // Cleanup reservations as they are now committed to Postgres ledger
    try {
      const keys = cart.items.map((item, index) => `inv:reserve:${item.variant_id}:${reservationIds[index]}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.warn("Failed to cleanup reservations", e);
    }
  }

  return { success: true, order: data };
}
