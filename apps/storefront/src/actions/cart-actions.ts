"use server";

import { cookies } from "next/headers";
import { redis } from "../lib/redis";

const CART_COOKIE_NAME = "zshop_cart";
const CART_DATA_COOKIE_NAME = "zshop_cart_data";
const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type CartItem = {
  variant_id: string;
  qty: number;
  unit_price: number;
  name: string;
  image?: string;
};

export type Cart = {
  token: string;
  items: CartItem[];
};

// Gets or creates a cart token
export async function getCartToken(allowWrite = false): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!token) {
    token = crypto.randomUUID();
    if (allowWrite) {
      try {
        cookieStore.set(CART_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: CART_TTL_SECONDS,
          path: "/",
        });
      } catch (e) {
        console.warn("Failed to set cart cookie in render phase:", e);
      }
    }
  }

  return token;
}

export async function getCart(): Promise<Cart> {
  const token = await getCartToken(false);
  const cookieStore = await cookies();

  let cartStr: string | null = null;
  if (redis) {
    cartStr = (await redis.get<string>(`cart:${token}`)) as string;
  } else {
    cartStr = cookieStore.get(CART_DATA_COOKIE_NAME)?.value || null;
  }

  if (!cartStr) {
    return { token, items: [] };
  }

  try {
    const items = typeof cartStr === 'string' ? JSON.parse(decodeURIComponent(cartStr)) : cartStr;
    return { token, items: Array.isArray(items) ? items : [] };
  } catch (e) {
    return { token, items: [] };
  }
}

async function saveCart(token: string, items: CartItem[]) {
  const cookieStore = await cookies();
  const serialized = JSON.stringify(items);
  
  if (redis) {
    await redis.setex(`cart:${token}`, CART_TTL_SECONDS, serialized);
  } else {
    cookieStore.set(CART_DATA_COOKIE_NAME, encodeURIComponent(serialized), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CART_TTL_SECONDS,
      path: "/",
    });
  }
}

export async function cartAdd(item: Omit<CartItem, 'qty'> & { qty?: number }) {
  const token = await getCartToken(true);
  const quantity = item.qty || 1;

  const cart = await getCart();
  const existingItemIndex = cart.items.findIndex((i) => i.variant_id === item.variant_id);

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].qty += quantity;
  } else {
    cart.items.push({
      variant_id: item.variant_id,
      qty: quantity,
      unit_price: item.unit_price,
      name: item.name,
      image: item.image,
    });
  }

  await saveCart(token, cart.items);
  return { success: true, cart };
}

export async function cartRemove(variantId: string) {
  const token = await getCartToken(true);

  const cart = await getCart();
  cart.items = cart.items.filter((i) => i.variant_id !== variantId);

  await saveCart(token, cart.items);
  return { success: true, cart };
}

export async function cartUpdateQuantity(variantId: string, qty: number) {
  const token = await getCartToken(true);

  const cart = await getCart();
  const item = cart.items.find((i) => i.variant_id === variantId);

  if (item) {
    item.qty = Math.max(1, qty); // Prevent negative or zero
    await saveCart(token, cart.items);
  }

  return { success: true, cart };
}

export async function clearCart(token: string) {
  if (redis) {
    await redis.del(`cart:${token}`);
  }
  const cookieStore = await cookies();
  cookieStore.delete(CART_DATA_COOKIE_NAME);
  cookieStore.delete(CART_COOKIE_NAME);
}
