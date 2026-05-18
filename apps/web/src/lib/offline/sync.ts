import {
  cacheCustomers,
  cacheProducts,
  countQueued,
  deletePendingOrder,
  enqueueOrder,
  getCachedCustomers,
  getCachedProducts,
  listPendingOrders,
  type PendingOrderRecord,
  updatePendingOrder,
} from "@/lib/offline/offline-db";
import { posService } from "@/services/pos.service";

/**
 * Pull fresh products/customers from server and write them to IndexedDB.
 * Call this opportunistically when the app is online (e.g. on POS mount,
 * or when reconnecting). Failure is tolerated — we just keep the old cache.
 */
export async function refreshCachedCatalog(): Promise<{ products: number; customers: number }> {
  try {
    const [products, customers] = await Promise.all([
      posService.getProducts ? posService.getProducts() : Promise.resolve([]),
      posService.getCustomers ? posService.getCustomers("") : Promise.resolve([]),
    ]);
    if (Array.isArray(products)) await cacheProducts(products);
    if (Array.isArray(customers)) await cacheCustomers(customers);
    return {
      products: Array.isArray(products) ? products.length : 0,
      customers: Array.isArray(customers) ? customers.length : 0,
    };
  } catch (e) {
    console.warn("refreshCachedCatalog failed:", (e as any)?.message);
    return { products: 0, customers: 0 };
  }
}

export async function loadCachedProducts(): Promise<any[]> {
  return getCachedProducts();
}

export async function loadCachedCustomers(): Promise<any[]> {
  return getCachedCustomers();
}

/**
 * Queue an order locally for later sync. Returns the local record id.
 * The caller should treat the order as completed in the UI — the user has
 * already taken cash from the customer.
 */
export async function queueOfflineOrder(opts: { orderData: any; items: any[] }): Promise<PendingOrderRecord> {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return enqueueOrder({
    id,
    payload: opts.orderData,
    items: opts.items,
  });
}

export async function pendingOrderCount(): Promise<number> {
  return countQueued();
}

/**
 * Flush queued orders to the server one-by-one. Stops at the first network
 * error so we don't burn through retries during a flaky connection. Returns
 * counts so the UI can toast accurate results.
 */
export async function flushOfflineQueue(): Promise<{
  ok: number;
  failed: number;
  remaining: number;
}> {
  const rows = await listPendingOrders();
  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.status === "synced") continue;
    await updatePendingOrder(row.id, { status: "syncing" });
    try {
      const order = await posService.createOrder(row.payload, row.items);
      await updatePendingOrder(row.id, {
        status: "synced",
        synced_at: Date.now(),
        server_order_id: (order as any)?.id || null,
      });
      // Best-effort cleanup so the queue doesn't grow unbounded
      await deletePendingOrder(row.id);
      ok++;
    } catch (e: any) {
      await updatePendingOrder(row.id, {
        status: "failed",
        attempts: (row.attempts || 0) + 1,
        last_error: e?.message || String(e),
      });
      failed++;
      // Stop on the first failure — if the network is gone or the API is
      // down, retrying everything immediately would just spam the server.
      break;
    }
  }
  const remaining = (await countQueued()) + failed;
  return { ok, failed, remaining };
}

/**
 * Convenience getter — returns true if the browser thinks we're online.
 * Always returns true on the server (where it doesn't matter).
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
