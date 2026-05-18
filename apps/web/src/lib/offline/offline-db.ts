// Lightweight IndexedDB wrapper for ZPOS offline POS support.
// Tree-shakable, no external dependencies. Designed for sales-floor use:
// cache the product catalog + customers, queue orders made while offline,
// and flush the queue when connectivity returns.

const DB_NAME = "zpos_offline";
const DB_VERSION = 1;

export const STORES = {
  products: "products",
  customers: "customers",
  pendingOrders: "pending_orders",
  meta: "meta",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export interface PendingOrderRecord {
  id: string; // local UUID
  tenant_id?: string | null;
  payload: any; // exact payload to be sent to posService.createOrder
  items: any[];
  status: "queued" | "syncing" | "synced" | "failed";
  attempts: number;
  last_error?: string | null;
  created_at: number; // epoch ms
  synced_at?: number | null;
  server_order_id?: string | null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.products)) {
        db.createObjectStore(STORES.products, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.customers)) {
        const s = db.createObjectStore(STORES.customers, { keyPath: "id" });
        s.createIndex("phone", "phone", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.pendingOrders)) {
        const s = db.createObjectStore(STORES.pendingOrders, { keyPath: "id" });
        s.createIndex("status", "status", { unique: false });
        s.createIndex("created_at", "created_at", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => Promise<T> | T): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        Promise.resolve(fn(s))
          .then((res) => {
            t.oncomplete = () => resolve(res);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error);
          })
          .catch(reject);
      }),
  );
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// -------- meta (tenant scope key/value) --------

export async function metaGet<T = unknown>(key: string): Promise<T | null> {
  if (!isBrowser()) return null;
  return tx(STORES.meta, "readonly", async (s) => {
    const r = await reqAsPromise(s.get(key));
    return ((r as any)?.value ?? null) as T | null;
  });
}

export async function metaSet(key: string, value: unknown): Promise<void> {
  if (!isBrowser()) return;
  return tx(STORES.meta, "readwrite", async (s) => {
    await reqAsPromise(s.put({ key, value }));
  });
}

// -------- products / customers cache --------

export async function cacheProducts(products: any[]): Promise<void> {
  if (!isBrowser() || !Array.isArray(products)) return;
  return tx(STORES.products, "readwrite", async (s) => {
    await reqAsPromise(s.clear());
    for (const p of products) {
      if (p?.id != null) await reqAsPromise(s.put(p));
    }
  });
}

export async function getCachedProducts(): Promise<any[]> {
  if (!isBrowser()) return [];
  return tx(STORES.products, "readonly", async (s) => {
    const r = await reqAsPromise(s.getAll());
    return r || [];
  });
}

export async function cacheCustomers(customers: any[]): Promise<void> {
  if (!isBrowser() || !Array.isArray(customers)) return;
  return tx(STORES.customers, "readwrite", async (s) => {
    await reqAsPromise(s.clear());
    for (const c of customers) {
      if (c?.id != null) await reqAsPromise(s.put(c));
    }
  });
}

export async function getCachedCustomers(): Promise<any[]> {
  if (!isBrowser()) return [];
  return tx(STORES.customers, "readonly", async (s) => {
    const r = await reqAsPromise(s.getAll());
    return r || [];
  });
}

// -------- pending order queue --------

export async function enqueueOrder(
  record: Omit<PendingOrderRecord, "status" | "attempts" | "created_at"> & {
    status?: PendingOrderRecord["status"];
  },
): Promise<PendingOrderRecord> {
  if (!isBrowser()) throw new Error("IndexedDB not available");
  const full: PendingOrderRecord = {
    ...record,
    status: record.status || "queued",
    attempts: 0,
    created_at: Date.now(),
  };
  await tx(STORES.pendingOrders, "readwrite", async (s) => {
    await reqAsPromise(s.put(full));
  });
  return full;
}

export async function listPendingOrders(): Promise<PendingOrderRecord[]> {
  if (!isBrowser()) return [];
  return tx(STORES.pendingOrders, "readonly", async (s) => {
    const r = (await reqAsPromise(s.getAll())) as PendingOrderRecord[];
    return (r || []).sort((a, b) => a.created_at - b.created_at);
  });
}

export async function countQueued(): Promise<number> {
  if (!isBrowser()) return 0;
  return tx(STORES.pendingOrders, "readonly", async (s) => {
    const idx = s.index("status");
    return (await reqAsPromise(idx.count(IDBKeyRange.only("queued")))) || 0;
  });
}

export async function updatePendingOrder(id: string, patch: Partial<PendingOrderRecord>): Promise<void> {
  if (!isBrowser()) return;
  return tx(STORES.pendingOrders, "readwrite", async (s) => {
    const existing = (await reqAsPromise(s.get(id))) as PendingOrderRecord | undefined;
    if (!existing) return;
    await reqAsPromise(s.put({ ...existing, ...patch }));
  });
}

export async function deletePendingOrder(id: string): Promise<void> {
  if (!isBrowser()) return;
  return tx(STORES.pendingOrders, "readwrite", async (s) => {
    await reqAsPromise(s.delete(id));
  });
}

export async function clearSyncedOrders(): Promise<number> {
  if (!isBrowser()) return 0;
  return tx(STORES.pendingOrders, "readwrite", async (s) => {
    const all = (await reqAsPromise(s.getAll())) as PendingOrderRecord[];
    let n = 0;
    for (const r of all) {
      if (r.status === "synced") {
        await reqAsPromise(s.delete(r.id));
        n++;
      }
    }
    return n;
  });
}
