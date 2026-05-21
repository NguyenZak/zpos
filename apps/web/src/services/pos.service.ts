import { createClient } from "@/utils/supabase/client";
import { loyaltyService } from "@/services/loyalty.service";

const UNIVERSAL_TENANTS = new Set(["www", "app", "console", "cms"]);
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

// Dynamic tenant resolution from current hostname
export function getTenantSlug(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname; // e.g. bibomart.localhost
    const mainDomain = (process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000").split(":")[0];

    if (hostname === mainDomain || hostname === `www.${mainDomain}`) {
      return "app";
    }

    const parts = hostname.split('.');
    if (parts.length > 1) {
      const subdomain = parts[0];
      if (subdomain && !UNIVERSAL_TENANTS.has(subdomain) && subdomain !== 'localhost') {
        return subdomain;
      }
    }
    return "app";
  } else {
    // Server-side dynamic resolution using global request context variable
    if (typeof global !== "undefined" && (global as any).activeTenantSlug) {
      return (global as any).activeTenantSlug;
    }
    return "app";
  }
}

export function isValidUUID(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

let cachedOrgId: string | null = null;
let cachedTenantSlug: string | null = null;
let cachedSessionKey: string | null = null;

function getTenantStorageKey(key: string) {
  return `${key}_${getTenantSlug()}`;
}

async function ensureWritableOrderSession(supabase: ReturnType<typeof createClient>, orgId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const { data: member, error } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", orgId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (member || error) return { hasLiveUser: true };

    throw new Error(
      "Tài khoản Supabase hiện tại chưa được gán vào doanh nghiệp này. Hãy vào Console > Quản Lý Nhân Viên & Phân Quyền để gán tenant trước khi bán hàng.",
    );
  }

  throw new Error("Chưa có phiên đăng nhập Supabase hợp lệ để ghi đơn hàng.");
}

export async function getActiveOrganizationId(): Promise<string> {
  const tenantSlug = getTenantSlug();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionKey = `${tenantSlug}:${user?.id || "anonymous"}`;

  if (cachedOrgId && cachedTenantSlug === tenantSlug && cachedSessionKey === sessionKey) {
    return cachedOrgId;
  }

  try {
    // Tenant subdomains are the strongest source of truth.
    if (tenantSlug !== "app") {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', tenantSlug)
        .maybeSingle();

      if (org?.id) {
        cachedOrgId = org.id;
        cachedTenantSlug = tenantSlug;
        cachedSessionKey = sessionKey;
        return org.id;
      }

      console.warn(`No organization found for tenant slug "${tenantSlug}".`);
      return EMPTY_UUID;
    }

    // On the universal /app host, resolve from the current authenticated user.
    if (user?.id) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (member?.organization_id) {
        cachedOrgId = member.organization_id;
        cachedTenantSlug = tenantSlug;
        cachedSessionKey = sessionKey;
        return member.organization_id;
      }
    }

  } catch (e) {
    console.error("Error resolving active organization for slug:", tenantSlug, e);
  }

  return EMPTY_UUID;
}

export const posService = {
  async getActiveOrganizationId() {
    return getActiveOrganizationId();
  },

  async getProducts() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Supabase environment variables are missing");
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        variants:product_variants(*)
      `)
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (error) {
      console.error("Supabase error (getProducts):", error.message, error.details);
      throw error;
    }

    let filteredData = data || [];

    // Clean up description prefix before returning
    filteredData = filteredData.map((p: any) => {
      let cleanDesc = p.description;
      let costPrice = 0;
      if (p.description && p.description.includes('::')) {
        const parts = p.description.split('::');
        const descWithoutTenant = parts.slice(1).join('::');

        const costMatch = descWithoutTenant.match(/^\[cost_price:(\d+(\.\d+)?)\]/);
        if (costMatch) {
          costPrice = parseFloat(costMatch[1]);
          cleanDesc = descWithoutTenant.replace(/^\[cost_price:(\d+(\.\d+)?)\]/, '');
        } else {
          cleanDesc = descWithoutTenant;
        }
      }
      return {
        ...p,
        cost_price: costPrice,
        description: cleanDesc
      };
    });

    // Merge min_stock from local storage fallback if any
    if (filteredData && typeof window !== 'undefined') {
      try {
        const localMinStocks = localStorage.getItem(getTenantStorageKey('zpos_products_min_stock'));
        if (localMinStocks) {
          const minStockMap = JSON.parse(localMinStocks);
          filteredData.forEach((p: any) => {
            if (minStockMap[p.id] !== undefined) {
              p.min_stock = minStockMap[p.id];
            }
          });
        }
      } catch (e) {
        console.warn("Error parsing local min stocks:", e);
      }
    }

    return filteredData;
  },

  async getCategories() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description')
      .eq('organization_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error("Supabase error (getCategories):", error.message);
      throw error;
    }

    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>();
    const unique = (data || []).filter(cat => {
      const key = cat.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique;
  },

  async createProduct(productData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const tenantSlug = getTenantSlug();

    const costPart = productData.cost_price !== undefined ? `[cost_price:${productData.cost_price}]` : '';
    const { cost_price, ...restProductData } = productData;

    const preparedData = {
      ...restProductData,
      organization_id: orgId,
      description: `${tenantSlug}::${costPart}${productData.description || ''}`
    };
    if (preparedData.barcode === '') preparedData.barcode = null;
    if (preparedData.sku === '') preparedData.sku = null;

    const { data, error } = await supabase
      .from('products')
      .insert([preparedData])
      .select()
      .single();

    if (error) throw error;

    // Clean up description for UI
    let costPrice = 0;
    if (data && data.description && data.description.includes('::')) {
      const parts = data.description.split('::');
      const descWithoutTenant = parts.slice(1).join('::');
      const costMatch = descWithoutTenant.match(/^\[cost_price:(\d+(\.\d+)?)\]/);
      if (costMatch) {
        costPrice = parseFloat(costMatch[1]);
        data.description = descWithoutTenant.replace(/^\[cost_price:(\d+(\.\d+)?)\]/, '');
      } else {
        data.description = descWithoutTenant;
      }
    }
    return {
      ...data,
      cost_price: costPrice
    };
  },

  async updateProduct(id: string, productData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const tenantSlug = getTenantSlug();

    // Persist min_stock in local storage as a robust fallback first
    if (productData.min_stock !== undefined && typeof window !== 'undefined') {
      try {
        const localMinStocks = localStorage.getItem(getTenantStorageKey('zpos_products_min_stock'));
        const minStockMap = localMinStocks ? JSON.parse(localMinStocks) : {};
        minStockMap[id] = productData.min_stock;
        localStorage.setItem(getTenantStorageKey('zpos_products_min_stock'), JSON.stringify(minStockMap));
      } catch (e) {
        console.warn("Error saving local min stock:", e);
      }
    }

    try {
      const costPart = productData.cost_price !== undefined ? `[cost_price:${productData.cost_price}]` : '';
      const { cost_price, ...restProductData } = productData;

      const preparedData = { ...restProductData };
      preparedData.organization_id = orgId;
      if (productData.description !== undefined || productData.cost_price !== undefined) {
        preparedData.description = `${tenantSlug}::${costPart}${productData.description || ''}`;
      }
      if (preparedData.barcode === '') preparedData.barcode = null;
      if (preparedData.sku === '') preparedData.sku = null;

      const { data, error } = await supabase
        .from('products')
        .update(preparedData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (!error && data) {
        if (productData.min_stock !== undefined) {
          data.min_stock = productData.min_stock;
        }
        let costPrice = 0;
        if (data.description && data.description.includes('::')) {
          const parts = data.description.split('::');
          const descWithoutTenant = parts.slice(1).join('::');
          const costMatch = descWithoutTenant.match(/^\[cost_price:(\d+(\.\d+)?)\]/);
          if (costMatch) {
            costPrice = parseFloat(costMatch[1]);
            data.description = descWithoutTenant.replace(/^\[cost_price:(\d+(\.\d+)?)\]/, '');
          } else {
            data.description = descWithoutTenant;
          }
        }
        return {
          ...data,
          cost_price: costPrice
        };
      }
      console.warn("Supabase products update warning:", error?.message);
    } catch (e) {
      console.warn("Supabase products update exception, using local storage fallback:", e);
    }

    // Fallback path: fetch current product info and overlay min_stock details
    try {
      const { data: currentProduct } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          variants:product_variants(*)
        `)
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();

      if (currentProduct) {
        if (productData.min_stock !== undefined) {
          currentProduct.min_stock = productData.min_stock;
        }
        if (currentProduct.description && currentProduct.description.includes('::')) {
          currentProduct.description = currentProduct.description.split('::').slice(1).join('::');
        }
        return currentProduct;
      }
    } catch (err) {
      console.error("Error loading product fallback:", err);
    }

    return { id, ...productData };
  },

  async deleteProduct(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { error } = await supabase
      .from('products')
      .update({ is_active: false }) // Soft delete
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async getCustomers(query: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let data: any[] = [];
    // Track whether the DB query actually succeeded — used to decide if we
    // should merge stale localStorage customers (only if the DB is truly
    // empty, not when the request failed). This prevents phantom UUIDs
    // from localStorage leaking into orderData.customer_id and triggering
    // orders_customer_id_fkey violations.
    let dbQueryOk = false;

    try {
      // Pull the credit account alongside the customer so the UI can show
      // debt without a second round-trip. PostgREST infers the FK on
      // customer_credit_accounts.customer_id; unique(tenant_id, customer_id)
      // guarantees at most one row, so we take [0] in the mapper below.
      let dbQuery = supabase
        .from('customers')
        .select(`
          *,
          credit_account:customer_credit_accounts(
            current_balance,
            overdue_amount,
            credit_limit,
            due_amount
          )
        `)
        .eq('organization_id', orgId);

      if (query.trim()) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
      }
      const { data: dbData, error } = await dbQuery.limit(100);
      if (error) {
        // Surface the actual error so we can debug 400/RLS/schema issues.
        console.error('customers SELECT failed:', error.message, error.code, error.details, error.hint);
      } else {
        dbQueryOk = true;
        if (dbData) data = dbData;
      }

    } catch (e) {
      console.error('Supabase customers query threw:', (e as any)?.message || e);
    }

    let filteredData = data || [];

    // Clean up address and map fields for UI compatibility (points, debt).
    // Debt comes from customer_credit_accounts (joined above), not from the
    // customers table — that table has no `debt` column. Falling back to
    // c.debt only for legacy localStorage records.
    filteredData = filteredData.map((c: any) => {
      let cleanAddress = c.address;
      if (c.address && c.address.includes('::')) {
        cleanAddress = c.address.split('::').slice(1).join('::');
      }
      const account = Array.isArray(c.credit_account) ? c.credit_account[0] : c.credit_account;
      return {
        ...c,
        points: c.loyalty_points ?? c.points ?? 0,
        debt: Number(account?.current_balance ?? c.debt ?? 0),
        overdue_amount: Number(account?.overdue_amount ?? 0),
        credit_limit: Number(account?.credit_limit ?? 0),
        due_amount: Number(account?.due_amount ?? 0),
        address: cleanAddress
      };
    });

    // Merge from local storage fallback — ONLY when the DB query failed
    // outright (network down / RLS broken). If the DB returned successfully
    // with zero rows, we trust that the tenant actually has no customers,
    // and we MUST NOT inject phantom UUIDs that will break the orders FK.
    if (!dbQueryOk && typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(getTenantStorageKey('zpos_customers'));
        if (local) {
          const localList = JSON.parse(local);
          const filteredLocal = (localList || []).filter((c: any) => {
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
          });
          const dbIds = new Set(filteredData.map(c => c.id));
          filteredLocal.forEach((c: any) => {
            if (!dbIds.has(c.id)) {
              // Mark as offline-only so the UI can show a badge if it wants.
              filteredData.push({ ...c, _offline_only: true });
            }
          });
        }
      } catch (e) {
        console.warn('Error reading local customers:', e);
      }
    }

    return filteredData;
  },

  async saveTelegramSettings(settings: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // 1. Fetch current organization branding
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('branding')
      .eq('id', orgId)
      .single();

    if (fetchError) throw fetchError;

    const currentBranding = org?.branding || {};
    const updatedBranding = {
      ...currentBranding,
      telegram: settings
    };

    // 2. Update branding in DB
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ branding: updatedBranding })
      .eq('id', orgId);

    if (updateError) throw updateError;
  },

  async sendTelegramNotification(message: string) {
    if (typeof window === 'undefined') return;
    const enabled = localStorage.getItem('zpos_telegram_enabled') === 'true';
    const token = localStorage.getItem('zpos_telegram_token');
    const chatId = localStorage.getItem('zpos_telegram_chat_id');

    if (!enabled || !token || !chatId) return;

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } catch (e) {
      console.warn("Failed to send Telegram notification:", e);
    }
  },

  async createOrder(orderData: any, items: any[]) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const sessionState = await ensureWritableOrderSession(supabase, orgId);

    const requestedByProductId = new Map<string, { quantity: number; name: string }>();
    for (const item of items) {
      const productId = item.id;
      if (!isValidUUID(productId)) continue;
      const quantity = Math.max(0, Number(item.quantity || 0));
      const existing = requestedByProductId.get(productId);
      requestedByProductId.set(productId, {
        quantity: (existing?.quantity || 0) + quantity,
        name: item.name || existing?.name || "Sản phẩm",
      });
    }

    if (requestedByProductId.size > 0) {
      const productIds = Array.from(requestedByProductId.keys());
      const { data: stockRows, error: stockError } = await supabase
        .from("products")
        .select("id, name, stock")
        .eq("organization_id", orgId)
        .in("id", productIds);

      if (stockError) throw stockError;

      const stockById = new Map((stockRows || []).map((product: any) => [product.id, product]));
      for (const [productId, requested] of requestedByProductId) {
        const product = stockById.get(productId);
        const stock = Number(product?.stock ?? 0);
        if (!product || stock <= 0 || requested.quantity > stock) {
          const productName = product?.name || requested.name;
          const error = new Error(
            stock <= 0
              ? `${productName} đã hết hàng, không thể bán tiếp.`
              : `${productName} chỉ còn ${stock} sản phẩm, không đủ để bán ${requested.quantity}.`,
          );
          (error as any).code = "OUT_OF_STOCK";
          throw error;
        }
      }
    }

    // Validate branch_id or auto-create main branch
    let branchId = orderData.branch_id;
    if (!branchId || !isValidUUID(branchId) || branchId === '00000000-0000-0000-0000-000000000000') {
      // 1. Try to read from localStorage first (currently selected branch by switcher or saved branches fallback)
      if (typeof window !== 'undefined') {
        try {
          const selected = localStorage.getItem(`zpos_selected_branch_id_${getTenantSlug()}`);
          if (selected && isValidUUID(selected)) {
            branchId = selected;
          } else {
            const local = localStorage.getItem(getTenantStorageKey('zpos_branches'));
            if (local) {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const mainBranch = parsed.find((b: any) => b.status === "Chính" || b.is_main_branch);
                const localBranch = mainBranch || parsed[0];
                if (localBranch?.id && isValidUUID(localBranch.id)) {
                  branchId = localBranch.id;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Failed to resolve branchId from localStorage:", e);
        }
      }

      // 2. Query Supabase database to verify or resolve branch if needed
      if (!branchId || !isValidUUID(branchId) || branchId === '00000000-0000-0000-0000-000000000000') {
        try {
          const { data: branches, error: selectErr } = await supabase
            .from('branches')
            .select('id')
            .eq('organization_id', orgId)
            .limit(1);

          if (!selectErr && branches && branches.length > 0) {
            branchId = branches[0].id;
          } else {
            // Self-healing: If database is empty but we have local branches in localStorage, sync them!
            let syncedBranchId = null;
            if (typeof window !== 'undefined') {
              try {
                const local = localStorage.getItem(getTenantStorageKey('zpos_branches'));
                if (local) {
                  const parsed = JSON.parse(local);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const branchesToSync = parsed.map((b: any) => {
                      const { status, ...dbB } = b;
                      return {
                        ...dbB,
                        organization_id: orgId,
                        is_main_branch: status === "Chính" || b.is_main_branch || false
                      };
                    });
                    const { data: inserted, error: syncError } = await supabase
                      .from('branches')
                      .insert(branchesToSync)
                      .select('id');
                    if (!syncError && inserted && inserted.length > 0) {
                      syncedBranchId = inserted[0].id;
                    }
                  }
                }
              } catch (syncErr) {
                console.warn("Error during self-healing branches sync:", syncErr);
              }
            }

            if (syncedBranchId && isValidUUID(syncedBranchId)) {
              branchId = syncedBranchId;
            } else if (getTenantSlug() === 'app') {
              // Auto-create a main branch if missing (demo only)
              const { data: newBranch, error: insertErr } = await supabase
                .from('branches')
                .insert([{
                  organization_id: orgId,
                  name: 'Chi nhánh chính',
                  is_main_branch: true,
                  address: 'Trụ sở chính'
                }])
                .select('id')
                .single();

              if (!insertErr && newBranch?.id) {
                branchId = newBranch.id;
              } else {
                console.warn("Branches insertion failed or table does not exist, using fallback UUID");
                branchId = '00000000-0000-0000-0000-000000000000';
              }
            } else {
              throw new Error("Không tìm thấy chi nhánh hoạt động. Vui lòng thiết lập chi nhánh trong phần Cài đặt trước khi tạo đơn hàng.");
            }
          }
        } catch (e: any) {
          console.warn("Branches table not available or error occurred:", e);
          if (getTenantSlug() === 'app') {
            branchId = '00000000-0000-0000-0000-000000000000';
          } else {
            throw new Error(e?.message || "Không tìm thấy chi nhánh hoạt động. Vui lòng thiết lập chi nhánh trong phần Cài đặt trước khi tạo đơn hàng.");
          }
        }
      }
    }

    // Validate customer_id: must be a real UUID AND must exist in DB, otherwise
    // the FK orders_customer_id_fkey will reject the insert. Stale UUIDs from
    // localStorage are a common cause of this — defensively null them out.
    let customerId = orderData.customer_id;
    if (customerId && !isValidUUID(customerId)) {
      customerId = null;
    }
    if (customerId) {
      try {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('id', customerId)
          .eq('organization_id', orgId)
          .maybeSingle();
        if (!existing) {
          console.warn(
            `Customer ${customerId} not found in DB — order will be created without a customer link.`,
          );
          customerId = null;
          // Best-effort: clean the phantom from localStorage so the user
          // doesn't keep selecting the same broken record.
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem(getTenantStorageKey('zpos_customers'));
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const cleaned = list.filter((c: any) => c?.id !== orderData.customer_id);
                  if (cleaned.length !== list.length) {
                    localStorage.setItem(getTenantStorageKey('zpos_customers'), JSON.stringify(cleaned));
                  }
                }
              }
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Could not verify customer_id existence:', (e as any)?.message);
      }
    }

    // Ensure active tenant organization and valid branch/customer are linked
    const {
      loyalty_points_redeemed = 0,
      loyalty_discount_applied = 0,
      loyalty_points_earned = 0,
      ...rawOrderData
    } = orderData;

    const preparedOrderData = {
      ...rawOrderData,
      organization_id: orgId,
      branch_id: branchId,
      customer_id: customerId
    };

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([preparedOrderData])
      .select()
      .single();

    if (orderError) {
      // Supabase PostgrestError has non-enumerable fields, so a single
      // console.error(obj) renders as `{}` in devtools. Log each field as
      // its own argument and dump the raw error via getOwnPropertyNames so
      // we always see *something*, even when the error isn't a PostgrestError.
      const rawDump = (() => {
        try {
          return JSON.stringify(orderError, Object.getOwnPropertyNames(orderError ?? {}));
        } catch {
          return String(orderError);
        }
      })();
      console.error(
        'Order insertion failed →',
        'message:', orderError?.message,
        '| code:', orderError?.code,
        '| details:', orderError?.details,
        '| hint:', orderError?.hint,
        '| raw:', rawDump,
        '| payload:', preparedOrderData,
      );
      const wrapped = new Error(
        orderError?.message ||
          orderError?.details ||
          orderError?.hint ||
          `Không thể tạo đơn hàng (${rawDump})`,
      );
      (wrapped as any).code = orderError?.code;
      (wrapped as any).details = orderError?.details;
      (wrapped as any).hint = orderError?.hint;
      (wrapped as any).pg = orderError;
      throw wrapped;
    }

    // Fetch a fallback variant ID from DB to ensure the order_items.variant_id
    // foreign key is satisfied if mock/cart items carry product IDs.
    let fallbackVariantId: string | null = null;
    try {
      const { data: firstVariant } = await supabase
        .from('product_variants')
        .select('id, products!inner(organization_id)')
        .eq('products.organization_id', orgId)
        .limit(1);
      if (firstVariant && firstVariant.length > 0) {
        fallbackVariantId = firstVariant[0].id;
      }
    } catch (e) {
      console.warn("Could not fetch fallback variant ID for order_items:", e);
    }

    // 2. Create order items
    const orderItems = items.map(item => {
      let itemId = item.variant_id || item.id;
      if (!isValidUUID(itemId)) {
        itemId = fallbackVariantId || '00000000-0000-0000-0000-000000000000';
      }
      return {
        order_id: order.id,
        variant_id: itemId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        discount_amount: 0
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      const wrapped = new Error(
        itemsError.message || itemsError.details || itemsError.hint || 'Không thể lưu chi tiết đơn',
      );
      (wrapped as any).code = itemsError.code;
      (wrapped as any).details = itemsError.details;
      (wrapped as any).hint = itemsError.hint;
      (wrapped as any).pg = itemsError;
      console.error('Order items insertion failed:', {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
        sample: orderItems[0],
      });
      throw wrapped;
    }

    // Process Loyalty points if customer is linked
    if (customerId) {
      try {
        if (loyalty_points_redeemed > 0) {
          await loyaltyService.applyRedemption(customerId, order.id, loyalty_points_redeemed, loyalty_discount_applied);
        }
        if (loyalty_points_earned > 0) {
          await loyaltyService.applyEarning(customerId, order.id, loyalty_points_earned, order.total_amount);
        }
      } catch (loyaltyErr) {
        console.warn("Failed to apply loyalty points updates:", loyaltyErr);
      }
    }

    // 3. Deduct stock from products (actual inventory update)
    for (const item of items) {
      // Use original item.id since that corresponds to the product.id
      const productId = item.id;
      if (!isValidUUID(productId)) continue;

      try {
      const { data: productData } = await supabase
          .from('products')
          .select('name, stock')
          .eq('id', productId)
          .eq('organization_id', orgId)
          .single();

        if (productData) {
          const newStock = Math.max(0, (productData.stock || 0) - (item.quantity || 1));
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId)
            .eq('organization_id', orgId);

          // Telegram Notification: Low Stock Check
          const notifyStock = localStorage.getItem('zpos_telegram_notify_stock') === 'true';
          if (notifyStock && newStock <= 5) {
            const warningMsg = `⚠️ <b>CẢNH BÁO TỒN KHO THẤP</b>\n\nSản phẩm <b>${productData.name}</b> chỉ còn <b>${newStock}</b> sản phẩm trong kho (mức tối thiểu: 5). Vui lòng nhập thêm hàng!`;
            posService.sendTelegramNotification(warningMsg);
          }
        }
      } catch (err) {
        console.warn(`Failed to deduct stock for product ${productId}:`, err);
      }
    }

    // Telegram Notification: New Order Completed Check
    const notifyOrder = localStorage.getItem('zpos_telegram_notify_order') === 'true';
    if (notifyOrder) {
      try {
        const orderNum = order.order_number || `DH-${order.id.slice(0, 8)}`;
        const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);
        const paymentMethod = order.payment_method === 'cash' ? '💵 Tiền mặt' : (order.payment_method === 'qr' || order.payment_method === 'bank' ? '💳 Chuyển khoản (VietQR)' : '💰 Khác');

        let itemsList = '';
        items.forEach((item, index) => {
          itemsList += `${index + 1}. <b>${item.name}</b> x${item.quantity} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}\n`;
        });

        const telegramMsg = `🎉 <b>ĐƠN HÀNG MỚI ĐÃ HOÀN TẤT!</b>\n\n` +
          `🔹 Mã đơn: <b>#${orderNum}</b>\n` +
          `🔹 Thanh toán: <b>${paymentMethod}</b>\n` +
          `🔹 Tổng tiền: <b>${totalFormatted}</b>\n\n` +
          `📋 <b>Chi tiết sản phẩm:</b>\n${itemsList}\n` +
          `⚡️ <i>Cảm ơn quý khách đã mua sắm tại ZPOS!</i>`;

        posService.sendTelegramNotification(telegramMsg);
      } catch (telErr) {
        console.warn("Failed to compose and send order Telegram message:", telErr);
      }
    }

    return order;
  },

  async getOrders() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // 1. Fetch orders with customer details and basic order items details
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(name, address, phone),
        order_items(
          quantity,
          unit_price,
          total_price,
          variant_id
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders || orders.length === 0) return [];

    // 2. Fetch all products and their variants to map names in memory
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, variants:product_variants(id, name)')
      .eq('organization_id', orgId);

    const variantMap = new Map<string, { productName: string, variantName: string | null }>();

    products?.forEach((p: any) => {
      variantMap.set(p.id, { productName: p.name, variantName: null });

      p.variants?.forEach((v: any) => {
        variantMap.set(v.id, { productName: p.name, variantName: v.name });
      });
    });

    // 3. Perform memory-mapped join to populate UI expectations
    const ordersWithProducts = orders.map((o: any) => {
      const orderItemsMapped = (o.order_items || []).map((item: any) => {
        const mapped = variantMap.get(item.variant_id);
        return {
          ...item,
          product_name: mapped?.productName || "Sản phẩm",
          variant_name: mapped?.variantName || null,
          variant: {
            name: mapped?.variantName || null,
            product: {
              name: mapped?.productName || "Sản phẩm"
            }
          }
        };
      });

      return {
        ...o,
        order_items: orderItemsMapped
      };
    });

    return ordersWithProducts;
  },

  async getOrderItems(orderId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw error;
    return data;
  },

  async updateOrder(id: string, orderData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('orders')
      .update({
        ...orderData,
        organization_id: orgId
      })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderItems(orderId: string, items: any[]) {
    const supabase = createClient();

    // 1. Get existing items from the database
    const { data: existingItems, error: fetchError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId);

    if (fetchError) throw fetchError;

    const existingIds = existingItems?.map((i: any) => i.id) || [];
    const currentIds = items.filter((i: any) => i.id).map((i: any) => i.id);

    // 2. Identify items to delete
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));
    if (idsToDelete.length > 0) {
      const { error: delError } = await supabase
        .from('order_items')
        .delete()
        .in('id', idsToDelete);
      if (delError) throw delError;
    }

    // 3. Insert new items and update existing ones
    for (const item of items) {
      if (item.id && existingIds.includes(item.id)) {
        // Update existing item
        const { error: updError } = await supabase
          .from('order_items')
          .update({
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          })
          .eq('id', item.id);
        if (updError) throw updError;
      } else {
        // Insert new item
        const { error: insError } = await supabase
          .from('order_items')
          .insert([{
            order_id: orderId,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }]);
        if (insError) throw insError;
      }
    }
  },

  async cancelOrder(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async deleteOrder(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // Delete associated order_items first
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    // Delete the order itself
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (orderError) throw orderError;
  },

  async getOrderDetails(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(
          id,
          variant_id,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error) throw error;
    if (!order) return null;

    // Fetch all products to map names in memory
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, variants:product_variants(id, name)')
      .eq('organization_id', orgId);

    const variantMap = new Map<string, { productName: string, variantName: string | null }>();

    products?.forEach((p: any) => {
      variantMap.set(p.id, { productName: p.name, variantName: null });

      p.variants?.forEach((v: any) => {
        variantMap.set(v.id, { productName: p.name, variantName: v.name });
      });
    });

    const orderItemsMapped = (order.order_items || []).map((item: any) => {
      const mapped = variantMap.get(item.variant_id);
      return {
        ...item,
        product_name: mapped?.productName || "Sản phẩm",
        variant_name: mapped?.variantName || null
      };
    });

    return {
      ...order,
      order_items: orderItemsMapped
    };
  },

  async createCustomer(customerData: any) {
    const supabase = createClient();
    const tenantSlug = getTenantSlug();
    const orgId = await getActiveOrganizationId();

    if (customerData.phone) {
      const { data: existingPhone } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('phone', customerData.phone)
        .limit(1);
        
      if (Array.isArray(existingPhone) && existingPhone.length > 0) {
        throw new Error(`Số điện thoại đã được sử dụng cho khách hàng "${existingPhone[0].name}". Vui lòng sử dụng số điện thoại khác.`);
      }
    }

    const newId = customerData.id || crypto.randomUUID();
    const finalData = {
      id: newId,
      points: 0,
      debt: 0,
      created_at: new Date().toISOString(),
      ...customerData,
      organization_id: orgId,
      address: `${tenantSlug}::${customerData.address || ''}`
    };

    // 1. Persist to LocalStorage overlay
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(getTenantStorageKey('zpos_customers'));
        const list = local ? JSON.parse(local) : [];
        list.push(finalData);
        localStorage.setItem(getTenantStorageKey('zpos_customers'), JSON.stringify(list));
      } catch (e) {
        console.warn("Error writing local customer:", e);
      }
    }

    try {
      // Filter out non-existent columns (points, debt, etc.) before inserting into Supabase
      const dbPayload = {
        id: finalData.id,
        organization_id: finalData.organization_id,
        name: finalData.name,
        email: finalData.email || null,
        phone: finalData.phone || null,
        address: finalData.address || null,
        loyalty_points: finalData.points || 0
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([dbPayload])
        .select()
        .single();

      if (!error && data) {
        if (data.address && data.address.includes('::')) {
          data.address = data.address.split('::').slice(1).join('::');
        }
        return {
          ...data,
          points: data.loyalty_points ?? 0,
          debt: 0
        };
      }
      console.warn("Supabase customer insert warning:", error?.message);
    } catch (e) {
      console.warn("Supabase customer insert exception, using local fallback:", e);
    }

    const cleanData = { ...finalData };
    if (cleanData.address && cleanData.address.includes('::')) {
      cleanData.address = cleanData.address.split('::').slice(1).join('::');
    }
    return cleanData;
  },

  async updateCustomer(id: string, customerData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const tenantSlug = getTenantSlug();

    if (customerData.phone) {
      const { data: existingPhone } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('phone', customerData.phone)
        .neq('id', id)
        .limit(1);
        
      if (Array.isArray(existingPhone) && existingPhone.length > 0) {
        throw new Error(`Số điện thoại đã được sử dụng cho khách hàng "${existingPhone[0].name}". Vui lòng sử dụng số điện thoại khác.`);
      }
    }

    // If address is provided, add tenantSlug prefix if not already present
    let address = customerData.address;
    if (address !== undefined && !address.startsWith(`${tenantSlug}::`)) {
      address = `${tenantSlug}::${address}`;
    }

    const preparedData = {
      ...customerData,
      ...(address !== undefined ? { address } : {})
    };

    const { data, error } = await supabase
      .from('customers')
      .update(preparedData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSuppliers(query: string = "") {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    let q = supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', orgId);

    if (query) {
      q = q.or(`name.ilike.%${query}%,contact_name.ilike.%${query}%`);
    }
    const { data, error } = await q.limit(50);
    if (error) throw error;
    return data;
  },

  async createSupplier(supplierData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        ...supplierData,
        organization_id: orgId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPurchaseOrders() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createPurchaseOrder(purchaseData: any, items: any[]) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // 1. Create purchase order record
    const { data: purchase, error: pError } = await supabase
      .from('purchase_orders')
      .insert([{
        ...purchaseData,
        organization_id: orgId
      }])
      .select()
      .single();

    if (pError) throw pError;

    // 2. Create purchase order items
    const pItems = items.map(item => ({
      purchase_order_id: purchase.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      sku: item.sku || null,
      quantity: item.quantity || 1,
      unit_cost: item.unit_cost || 0,
      total_amount: (item.unit_cost || 0) * (item.quantity || 1),
      batch_number: item.batch_number || null,
      lot_number: item.lot_number || null,
      manufactured_at: item.manufactured_at || null,
      expired_at: item.expired_at || null
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(pItems);

    if (itemsError) {
      await supabase.from('purchase_orders').delete().eq('id', purchase.id);
      throw itemsError;
    }

    return purchase;
  },

  async getPurchaseOrderDetail(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(
          *,
          product:products(name, image)
        )
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error) throw error;
    return data;
  },

  async receiveStock(purchaseOrderId: string, items: { itemId: string, receivedQty: number }[]) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    for (const item of items) {
      // 1. Update received quantity in purchase_order_items
      const { data: orderItem } = await supabase
        .from('purchase_order_items')
        .select('received_quantity, product_id, variant_id, quantity, purchase_orders!inner(organization_id)')
        .eq('id', item.itemId)
        .eq('purchase_orders.organization_id', orgId)
        .single();

      if (orderItem) {
        const newReceivedQty = (orderItem.received_quantity || 0) + item.receivedQty;
        await supabase
          .from('purchase_order_items')
          .update({ received_quantity: newReceivedQty })
          .eq('id', item.itemId);

        // 2. Increase stock in products or product_variants
        if (orderItem.variant_id) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock, products!inner(organization_id)')
            .eq('id', orderItem.variant_id)
            .eq('products.organization_id', orgId)
            .single();
          await supabase.from('product_variants').update({ stock: (variant?.stock || 0) + item.receivedQty }).eq('id', orderItem.variant_id);
        } else {
          const { data: product } = await supabase.from('products').select('stock').eq('id', orderItem.product_id).eq('organization_id', orgId).single();
          await supabase.from('products').update({ stock: (product?.stock || 0) + item.receivedQty }).eq('id', orderItem.product_id).eq('organization_id', orgId);
        }
      }
    }

    // 3. Update PO status if fully received
    const { data: allItems } = await supabase
      .from('purchase_order_items')
      .select('quantity, received_quantity, purchase_orders!inner(organization_id)')
      .eq('purchase_order_id', purchaseOrderId)
      .eq('purchase_orders.organization_id', orgId);
    const fullyReceived = allItems?.every(i => i.received_quantity >= i.quantity);

    await supabase
      .from('purchase_orders')
      .update({ status: fullyReceived ? 'received' : 'receiving' })
      .eq('id', purchaseOrderId)
      .eq('organization_id', orgId);
  },

  async updateStock(productId: string, delta: number) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .eq('organization_id', orgId)
      .single();

    if (product) {
      const newStock = (product.stock || 0) + delta;
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)
        .eq('organization_id', orgId);
    }
  },

  async getEmployees() {
    const supabase = createClient();
    const tenantSlug = getTenantSlug();

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let filteredData = data || [];
    if (tenantSlug === 'app') {
      filteredData = filteredData.filter((e: any) => !e.name || !e.name.includes('::') || e.name.startsWith('app::'));
    } else {
      filteredData = filteredData.filter((e: any) => e.name && e.name.startsWith(`${tenantSlug}::`));
    }

    return filteredData.map((e: any) => {
      let cleanName = e.name;
      if (e.name && e.name.includes('::')) {
        cleanName = e.name.split('::').slice(1).join('::');
      }
      return {
        ...e,
        name: cleanName
      };
    });
  },

  async createEmployee(employeeData: any) {
    const supabase = createClient();
    const tenantSlug = getTenantSlug();

    const preparedData = {
      ...employeeData,
      name: `${tenantSlug}::${employeeData.name}`
    };

    const { data, error } = await supabase
      .from('employees')
      .insert([preparedData])
      .select()
      .single();

    if (error) throw error;

    if (data && data.name && data.name.includes('::')) {
      data.name = data.name.split('::').slice(1).join('::');
    }
    return data;
  },

  async getDashboardStats() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data: allProducts } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);
    const products = allProducts || [];
    const productsCount = products.length;

    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).neq('status', 'cancelled');

    const { data: allCustomers } = await supabase.from('customers').select('id, created_at').eq('organization_id', orgId);
    let customers = allCustomers || [];
    const customersCount = customers.length;

    const { data: orders } = await supabase
      .from('orders')
      .select('id, created_at, total_amount, payment_method, payment_status, payment_amount_received, debt_amount')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');

    const { data: debtPayments } = await supabase
      .from('debt_payments')
      .select('id, amount, method, payment_date, created_at, status')
      .eq('tenant_id', orgId)
      .eq('status', 'completed');

    const getOrderRealizedRevenue = (order: any) => {
      const method = String(order.payment_method || '').toLowerCase();
      const status = String(order.payment_status || '').toLowerCase();
      if (method === 'debt' || status === 'debt' || status === 'partial_debt') return 0;
      if (status && status !== 'paid') return 0;
      const received = Number(order.payment_amount_received || 0);
      return received > 0 ? received : Number(order.total_amount || 0);
    };
    const totalDebtPaymentRevenue = debtPayments?.reduce((acc, payment: any) => acc + Number(payment.amount || 0), 0) || 0;
    const totalRevenue = (orders?.reduce((acc, curr) => acc + getOrderRealizedRevenue(curr), 0) || 0) + totalDebtPaymentRevenue;
    const debtInvoices = (orders || []).filter((order: any) => {
      const method = String(order.payment_method || '').toLowerCase();
      const status = String(order.payment_status || '').toLowerCase();
      return method === 'debt' || status === 'debt' || status === 'partial_debt' || Number(order.debt_amount || 0) > 0;
    });
    const debtInvoiceCount = debtInvoices.length;
    const debtOutstandingAmount = debtInvoices.reduce((acc: number, order: any) => acc + Number(order.debt_amount || 0), 0);
    const debtInvoiceTotalAmount = debtInvoices.reduce((acc: number, order: any) => acc + Number(order.total_amount || 0), 0);

    // Calculate real payment method percentages dynamically from orders
    let cashAmount = 0;
    let bankAmount = 0;
    let cardAmount = 0;

    orders?.forEach((o: any) => {
      const amt = getOrderRealizedRevenue(o);
      if (amt <= 0) return;
      const method = String(o.payment_method || '').toLowerCase();
      if (method === 'cash') {
        cashAmount += amt;
      } else if (method === 'bank_transfer' || method === 'transfer') {
        bankAmount += amt;
      } else {
        cardAmount += amt;
      }
    });
    debtPayments?.forEach((payment: any) => {
      const amt = Number(payment.amount || 0);
      const method = String(payment.method || '').toLowerCase();
      if (method === 'cash') {
        cashAmount += amt;
      } else if (method === 'bank_transfer' || method === 'bank' || method === 'transfer' || method === 'vietqr') {
        bankAmount += amt;
      } else {
        cardAmount += amt;
      }
    });

    const totalCalculated = cashAmount + bankAmount + cardAmount;
    let cashPercent = 60;
    let bankPercent = 25;
    let cardPercent = 15;

    if (totalCalculated > 0) {
      cashPercent = Math.round((cashAmount / totalCalculated) * 100);
      bankPercent = Math.round((bankAmount / totalCalculated) * 100);
      cardPercent = 100 - cashPercent - bankPercent;
      if (cardPercent < 0) cardPercent = 0;
    }

    // Calculate actual weekly metrics
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);

    let thisWeekRevenue = 0;
    let lastWeekRevenue = 0;
    let thisWeekOrders = 0;
    let lastWeekOrders = 0;

    orders?.forEach((o: any) => {
      const date = new Date(o.created_at);
      const amt = getOrderRealizedRevenue(o);
      if (amt <= 0) return;
      if (date >= oneWeekAgo && date <= now) {
        thisWeekRevenue += amt;
        thisWeekOrders += 1;
      } else if (date >= twoWeeksAgo && date < oneWeekAgo) {
        lastWeekRevenue += amt;
        lastWeekOrders += 1;
      }
    });
    debtPayments?.forEach((payment: any) => {
      const date = new Date(payment.payment_date || payment.created_at);
      const amt = Number(payment.amount || 0);
      if (date >= oneWeekAgo && date <= now) {
        thisWeekRevenue += amt;
      } else if (date >= twoWeeksAgo && date < oneWeekAgo) {
        lastWeekRevenue += amt;
      }
    });

    let revenueChange = "+0.0%";
    if (lastWeekRevenue > 0) {
      const changePct = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
      revenueChange = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`;
    } else if (thisWeekRevenue > 0) {
      revenueChange = "+100%";
    }

    let ordersChange = "+0.0%";
    if (lastWeekOrders > 0) {
      const changePct = ((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100;
      ordersChange = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`;
    } else if (thisWeekOrders > 0) {
      ordersChange = "+100%";
    }

    // Compute customersChange from real customer.created_at timestamps.
    // "This week" = last 7 days; "last week" = the 7 days before that.
    let thisWeekCustomers = 0;
    let lastWeekCustomers = 0;
    customers.forEach((c: any) => {
      if (!c?.created_at) return;
      const d = new Date(c.created_at);
      if (d >= oneWeekAgo && d <= now) thisWeekCustomers += 1;
      else if (d >= twoWeeksAgo && d < oneWeekAgo) lastWeekCustomers += 1;
    });

    let customersChange = "+0.0%";
    if (lastWeekCustomers > 0) {
      const changePct = ((thisWeekCustomers - lastWeekCustomers) / lastWeekCustomers) * 100;
      customersChange = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`;
    } else if (thisWeekCustomers > 0) {
      customersChange = "+100%";
    }

    // Fetch dynamic category sales and best-selling products
    let dynamicCategorySales: { name: string, value: number }[] = [];
    let dynamicTopProducts: any[] = [];
    try {
      const orderIds = orders?.filter((o: any) => getOrderRealizedRevenue(o) > 0).map((o: any) => o.id) || [];
      if (orderIds.length > 0) {
        const { data: orderItems, error: itemsErr } = await supabase
          .from('order_items')
          .select('order_id, total_price, quantity, variant_id')
          .in('order_id', orderIds);

        if (!itemsErr && orderItems && orderItems.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, price, image, description, category:categories(name), variants:product_variants(id)')
            .eq('organization_id', orgId);

          const finalProds = products || [];

        const productMap = new Map<string, any>();
        const variantProductMap = new Map<string, string>();

        finalProds.forEach((p: any) => {
          const catName = p.category?.name || "Khác";
          productMap.set(p.id, {
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            categoryName: catName
          });
          p.variants?.forEach((v: any) => {
            variantProductMap.set(v.id, p.id);
          });
        });

        const catMap = new Map<string, number>();
        const productSalesMap = new Map<string, { salesCount: number, revenue: number }>();

        orderItems.forEach((item: any) => {
          const id = item.variant_id;
          let productId = variantProductMap.get(id);
          if (!productId) {
            productId = id;
          }

          const prod = productId ? productMap.get(productId) : null;
          const categoryName = prod?.categoryName || "Khác";
          const qty = Number(item.quantity) || 0;
          const price = Number(item.total_price) || 0;

          catMap.set(categoryName, (catMap.get(categoryName) || 0) + price);

          if (productId) {
            const current = productSalesMap.get(productId) || { salesCount: 0, revenue: 0 };
            productSalesMap.set(productId, {
              salesCount: current.salesCount + qty,
              revenue: current.revenue + price
            });
          }
        });

        dynamicCategorySales = Array.from(catMap.entries()).map(([name, value]) => ({
          name,
          value
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        dynamicTopProducts = Array.from(productSalesMap.entries()).map(([productId, sales]) => {
          const prod = productMap.get(productId);
          return {
            id: productId,
            name: prod?.name || "Sản phẩm",
            image: prod?.image || null,
            price: prod?.price || 0,
            salesCount: sales.salesCount,
            revenue: sales.revenue
          };
        }).sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
        }
      }
    } catch (e) {
      console.error("Error calculating dynamic categories and top products:", e);
    }

    if (dynamicCategorySales.length === 0) {
      const { data: dbCats } = await supabase
        .from('categories')
        .select('name, description')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      let filteredCats = dbCats || [];

      filteredCats = filteredCats.slice(0, 5);

      if (filteredCats.length > 0) {
        dynamicCategorySales = filteredCats.map((c: any) => {
          let cleanName = c.name;
          if (c.name && c.name.includes('::')) {
            cleanName = c.name.split('::').slice(1).join('::');
          }
          return {
            name: cleanName,
            value: 0
          };
        });
      } else {
        dynamicCategorySales = [
          { name: "Chưa phân loại", value: 0 }
        ];
      }
    }

    return {
      totalRevenue,
      ordersCount: ordersCount || 0,
      customersCount: customersCount || 0,
      productsCount: productsCount || 0,
      revenueChange,
      ordersChange,
      customersChange,
      thisWeekCustomers,
      lastWeekCustomers,
      ordersList: orders || [],
      debtPayments: debtPayments || [],
      debtInvoiceCount,
      debtOutstandingAmount,
      debtInvoiceTotalAmount,
      debtSettledAmount: totalDebtPaymentRevenue,
      categorySales: dynamicCategorySales,
      topProducts: dynamicTopProducts,
      paymentStats: {
        cash: cashPercent,
        bank: bankPercent,
        card: cardPercent,
        cashAmount,
        bankAmount,
        cardAmount
      }
    };
  },

  async getRecentSales() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(name, email)
      `)
      .eq('organization_id', orgId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data;
  },

  async updateCustomerPoints(id: string, points: number) {
    const supabase = createClient();

    const { data: customer } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', id)
      .single();

    if (customer) {
      const newPoints = (customer.loyalty_points || 0) + points;
      await supabase
        .from('customers')
        .update({ loyalty_points: newPoints })
        .eq('id', id);
    }
  },

  async getCustomerDetail(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:orders(id, order_number, total_amount, created_at, status, payment_method, payment_status, debt_amount, due_date),
        credit_account:customer_credit_accounts(
          current_balance,
          overdue_amount,
          credit_limit,
          due_amount
        )
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error) throw error;

    if (data?.orders) {
      data.orders = data.orders.filter((o: any) => o.status !== 'cancelled');
    }

    if (data && data.address && data.address.includes('::')) {
      data.address = data.address.split('::').slice(1).join('::');
    }

    // Flatten the credit account so the UI can read selectedCustomer.debt
    // directly — mirrors the shape returned by getCustomers().
    if (data) {
      const account = Array.isArray((data as any).credit_account)
        ? (data as any).credit_account[0]
        : (data as any).credit_account;
      (data as any).debt = Number(account?.current_balance ?? 0);
      (data as any).overdue_amount = Number(account?.overdue_amount ?? 0);
      (data as any).credit_limit = Number(account?.credit_limit ?? 0);
      (data as any).due_amount = Number(account?.due_amount ?? 0);
      (data as any).points = (data as any).loyalty_points ?? (data as any).points ?? 0;
    }

    return data;
  },

  async getCategoryList() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('categories')
      .select('*, products(id)')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (error) throw error;

    const filteredData = data || [];

    return filteredData.map(cat => {
      let cleanDesc = cat.description;
      if (cat.description && cat.description.includes('::')) {
        cleanDesc = cat.description.split('::').slice(1).join('::');
      }
      return {
        ...cat,
        description: cleanDesc,
        product_count: cat.products?.length || 0
      };
    });
  },

  async createCategory(categoryData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const tenantSlug = getTenantSlug();

    const preparedData = {
      ...categoryData,
      organization_id: orgId,
      description: `${tenantSlug}::${categoryData.description || ''}`
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([preparedData])
      .select()
      .single();

    if (error) throw error;

    if (data && data.description && data.description.includes('::')) {
      data.description = data.description.split('::').slice(1).join('::');
    }
    return data;
  },

  async updateCategory(id: string, categoryData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const tenantSlug = getTenantSlug();

    const preparedData = { ...categoryData };
    if (categoryData.description !== undefined) {
      preparedData.description = `${tenantSlug}::${categoryData.description || ''}`;
    }

    const { data, error } = await supabase
      .from('categories')
      .update(preparedData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;

    if (data && data.description && data.description.includes('::')) {
      data.description = data.description.split('::').slice(1).join('::');
    }
    return data;
  },

  async deleteCategory(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async deleteCustomer(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(getTenantStorageKey('zpos_customers'));
        if (local) {
          const list = JSON.parse(local);
          const updated = list.filter((c: any) => c.id !== id);
          localStorage.setItem(getTenantStorageKey('zpos_customers'), JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("Error deleting local customer:", e);
      }
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);
      if (!error) return;
    } catch (e) {
      console.warn("Supabase customer delete warning:", e);
    }
  },

  async updateSupplier(id: string, data: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({
        ...data,
        organization_id: orgId
      })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return supplier;
  },

  async deleteSupplier(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async deleteEmployee(id: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getGoal(month: number, year: number) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('organization_goals')
      .select('*')
      .eq('organization_id', orgId)
      .eq('period_month', month)
      .eq('period_year', year)
      .eq('goal_type', 'revenue')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateGoal(targetValue: number, month: number, year: number) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('organization_goals')
      .upsert({
        organization_id: orgId,
        goal_type: 'revenue',
        target_value: targetValue,
        period_month: month,
        period_year: year,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,goal_type,period_month,period_year'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getExpenseCategories() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .or(`organization_id.eq.${orgId},organization_id.is.null`)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getExpenses(filters?: { categoryId?: string; search?: string }) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    let query = supabase
      .from('expenses')
      .select('*, category:expense_categories(name)')
      .eq('organization_id', orgId);

    if (filters?.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query.order('expense_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    let branchId = expense.branch_id;
    if (!branchId || branchId === '00000000-0000-0000-0000-000000000000') {
      const { data: branches } = await supabase.from('branches').select('id').eq('organization_id', orgId).limit(1);
      if (branches && branches.length > 0) {
        branchId = branches[0].id;
      } else {
        branchId = null;
      }
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...expense,
        organization_id: orgId,
        branch_id: branchId
      }])
      .select()
      .single();

    if (error) throw error;

    if (expense.status === 'paid') {
      await supabase.from('cashflow_transactions').insert([{
        organization_id: orgId,
        branch_id: branchId,
        type: 'outflow',
        category: 'expense',
        reference_type: 'expense',
        reference_id: data.id,
        amount: expense.amount,
        transaction_date: expense.expense_date ? new Date(expense.expense_date).toISOString() : new Date().toISOString(),
        note: expense.title
      }]);
    }

    return data;
  },

  async getFinanceOverview() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // Pull full rows with timestamps so we can split current vs prior period.
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at, payment_method, payment_status, payment_amount_received')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');
    if (ordersError) throw ordersError;

    const { data: debtPayments, error: debtPaymentsError } = await supabase
      .from('debt_payments')
      .select('amount, payment_date, created_at, status')
      .eq('tenant_id', orgId)
      .eq('status', 'completed');
    if (debtPaymentsError) throw debtPaymentsError;

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchase_orders')
      .select('total_amount, paid_amount, created_at')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');
    if (purchasesError) throw purchasesError;

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, created_at, expense_date')
      .eq('organization_id', orgId)
      .eq('status', 'paid');
    if (expensesError) throw expensesError;

    // Total (all-time) figures shown in the big numbers.
    const orderAmt = (o: any) => {
      const method = String(o.payment_method || '').toLowerCase();
      const status = String(o.payment_status || '').toLowerCase();
      if (method === 'debt' || status === 'debt' || status === 'partial_debt') return 0;
      if (status && status !== 'paid') return 0;
      const received = Number(o.payment_amount_received || 0);
      return received > 0 ? received : Number(o.total_amount || 0);
    };
    const debtPaymentAmt = (p: any) => Number(p.amount || 0);
    const totalRevenue =
      (orders?.reduce((s, o: any) => s + orderAmt(o), 0) || 0) +
      (debtPayments?.reduce((s, p: any) => s + debtPaymentAmt(p), 0) || 0);
    const totalCOGS = purchases?.reduce((s, p: any) => s + Number(p.total_amount || 0), 0) || 0;
    const totalExpenses = expenses?.reduce((s, e: any) => s + Number(e.amount || 0), 0) || 0;
    const netProfit = totalRevenue - totalCOGS - totalExpenses;

    // Period-over-period: last 30 days vs the 30 days before that.
    const now = new Date();
    const d30 = new Date(); d30.setDate(now.getDate() - 30);
    const d60 = new Date(); d60.setDate(now.getDate() - 60);

    const sumWindow = (rows: any[] | null, getDate: (r: any) => any, getAmount: (r: any) => number,
                       from: Date, to: Date) => {
      if (!rows) return 0;
      let s = 0;
      for (const r of rows) {
        const raw = getDate(r);
        if (!raw) continue;
        const d = new Date(raw);
        if (d >= from && d < to) s += Number(getAmount(r) || 0);
      }
      return s;
    };

    const orderDate = (o: any) => o.created_at;
    const debtPaymentDate = (p: any) => p.payment_date || p.created_at;
    const purchaseAmt = (p: any) => p.total_amount;
    const purchaseDate = (p: any) => p.created_at;
    const expenseAmt = (e: any) => e.amount;
    const expenseDate = (e: any) => e.expense_date || e.created_at;

    const revCur = sumWindow(orders, orderDate, orderAmt, d30, now) + sumWindow(debtPayments, debtPaymentDate, debtPaymentAmt, d30, now);
    const revPrev = sumWindow(orders, orderDate, orderAmt, d60, d30) + sumWindow(debtPayments, debtPaymentDate, debtPaymentAmt, d60, d30);
    const cogsCur = sumWindow(purchases, purchaseDate, purchaseAmt, d30, now);
    const cogsPrev = sumWindow(purchases, purchaseDate, purchaseAmt, d60, d30);
    const expCur = sumWindow(expenses, expenseDate, expenseAmt, d30, now);
    const expPrev = sumWindow(expenses, expenseDate, expenseAmt, d60, d30);

    const profitCur = revCur - cogsCur - expCur;
    const profitPrev = revPrev - cogsPrev - expPrev;

    const pct = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? '+100%' : '+0.0%';
      const change = ((cur - prev) / Math.abs(prev)) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      netProfit,
      // Real period-over-period deltas
      revenueChange: pct(revCur, revPrev),
      expenseChange: pct(expCur, expPrev),
      profitChange: pct(profitCur, profitPrev),
      // Expose the underlying period numbers so the UI can show context
      period: {
        currentRevenue: revCur,
        previousRevenue: revPrev,
        currentProfit: profitCur,
        previousProfit: profitPrev,
        currentExpenses: expCur,
        previousExpenses: expPrev,
        windowDays: 30,
      },
    };
  },

  async getCashflowTransactions() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('cashflow_transactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProfitLossReport() {
    return this.getFinanceOverview();
  },

  async getRecurringExpenses() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*, category:expense_categories(name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createRecurringExpense(recurring: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    let branchId = recurring.branch_id;
    if (!branchId || branchId === '00000000-0000-0000-0000-000000000000') {
      const { data: branches } = await supabase.from('branches').select('id').eq('organization_id', orgId).limit(1);
      if (branches && branches.length > 0) {
        branchId = branches[0].id;
      } else {
        branchId = null;
      }
    }

    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert([{
        ...recurring,
        organization_id: orgId,
        branch_id: branchId,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleRecurringExpenseStatus(id: string, currentStatus: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    const { error } = await supabase
      .from('recurring_expenses')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async getPayroll() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const { data, error } = await supabase
      .from('payroll')
      .select('*, employee:employees(*)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPayroll(payrollData: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    let branchId = payrollData.branch_id;
    if (!branchId || branchId === '00000000-0000-0000-0000-000000000000') {
      const { data: branches } = await supabase.from('branches').select('id').eq('organization_id', orgId).limit(1);
      if (branches && branches.length > 0) {
        branchId = branches[0].id;
      } else {
        branchId = null;
      }
    }

    const { data, error } = await supabase
      .from('payroll')
      .insert([{
        ...payrollData,
        organization_id: orgId,
        branch_id: branchId
      }])
      .select('*, employee:employees(*)')
      .single();

    if (error) throw error;

    if (payrollData.payment_status === 'paid') {
      await supabase.from('cashflow_transactions').insert([{
        organization_id: orgId,
        branch_id: branchId,
        type: 'outflow',
        category: 'salary',
        reference_type: 'payroll',
        reference_id: data.id,
        amount: data.final_salary,
        transaction_date: payrollData.payment_date ? new Date(payrollData.payment_date).toISOString() : new Date().toISOString(),
        note: `Trả lương cho nhân viên ${data.employee?.name || ''}`
      }]);
    }

    return data;
  },

  async updatePayrollStatus(id: string, status: string, paymentDate?: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const updateData: any = { payment_status: status };
    if (status === 'paid') {
      updateData.payment_date = paymentDate || new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('payroll')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*, employee:employees(*)')
      .single();

    if (error) throw error;

    if (status === 'paid') {
      await supabase.from('cashflow_transactions').insert([{
        organization_id: orgId,
        branch_id: data.branch_id || null,
        type: 'outflow',
        category: 'salary',
        reference_type: 'payroll',
        reference_id: data.id,
        amount: data.final_salary,
        transaction_date: new Date(updateData.payment_date).toISOString(),
        note: `Trả lương cho nhân viên ${data.employee?.name || ''}`
      }]);
    }
    return data;
  },

  async getBranches() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', orgId);

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          ...b,
          status: b.is_main_branch ? "Chính" : "Phụ"
        }));
      }
    } catch (e) {
      console.warn("Supabase branches table error, using local storage fallback", e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(getTenantStorageKey('zpos_branches'));
      if (!local) {
        return [];
      }
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          // If it contains the mock branches, let's filter them out/clear it
          const hasMock = parsed.some((b: any) => b.name === "Chi nhánh Quận 1" || b.name === "Chi nhánh Ba Đình");
          if (hasMock) {
            localStorage.removeItem(getTenantStorageKey('zpos_branches'));
            return [];
          }
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse local branches", e);
      }
      return [];
    }

    return [];
  },

  async saveBranch(branch: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // Map UI "status" to DB "is_main_branch" and omit status from DB payload to prevent bad request
    const { status, ...dbBranch } = branch;
    const isMainBranch = status === "Chính" || branch.is_main_branch || false;

    const preparedBranchForDB = {
      ...dbBranch,
      is_main_branch: isMainBranch,
      organization_id: orgId
    };

    const preparedBranchForUI = {
      ...branch,
      is_main_branch: isMainBranch,
      organization_id: orgId
    };

    try {
      const { data, error } = await supabase
        .from('branches')
        .upsert(preparedBranchForDB)
        .select()
        .single();

      if (!error && data) {
        return {
          ...data,
          status: data.is_main_branch ? "Chính" : "Phụ"
        };
      }
      if (error) {
        console.error("Supabase branches upsert error details:", error.message, error.details, error.hint);
      }
    } catch (e) {
      console.warn("Supabase branches table upsert exception, using local storage fallback", e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(getTenantStorageKey('zpos_branches'));
      let branches = local ? JSON.parse(local) : [];

      if (branch.id) {
        branches = branches.map((b: any) => b.id === branch.id ? preparedBranchForUI : b);
      } else {
        const newBranch = {
          ...preparedBranchForUI,
          id: crypto.randomUUID(),
          status: branches.length === 0 ? "Chính" : "Phụ"
        };
        branches.push(newBranch);
      }

      localStorage.setItem(getTenantStorageKey('zpos_branches'), JSON.stringify(branches));
      return preparedBranchForUI;
    }
    return preparedBranchForUI;
  },

  async deleteBranch(id: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    try {
      await supabase
        .from('branches')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);
    } catch (e) {
      console.warn("Supabase branches table delete error, using local storage fallback", e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(getTenantStorageKey('zpos_branches'));
      if (local) {
        let branches = JSON.parse(local);
        branches = branches.filter((b: any) => b.id !== id);
        localStorage.setItem(getTenantStorageKey('zpos_branches'), JSON.stringify(branches));
      }
    }
  },

  async checkBarcodeExists(barcode: string, organizationId: string): Promise<boolean> {
    const supabase = createClient();
    
    // Check in products
    const { data: pData } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('barcode', barcode)
      .limit(1);
      
    if (pData && pData.length > 0) return true;

    // Check in product_variants
    const { data: pvData } = await supabase
      .from('product_variants')
      .select('id, products!inner(organization_id)')
      .eq('barcode', barcode)
      .eq('products.organization_id', organizationId)
      .limit(1);

    if (pvData && pvData.length > 0) return true;

    return false;
  },

  async assignBarcodeToProduct(productId: string, barcode: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    
    if (barcode) {
      const exists = await this.checkBarcodeExists(barcode, orgId);
      if (exists) {
        throw new Error("Mã vạch đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.");
      }
    }

    const { error } = await supabase
      .from('products')
      .update({ barcode })
      .eq('id', productId)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async assignBarcodeToVariant(variantId: string, barcode: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    if (barcode) {
      const exists = await this.checkBarcodeExists(barcode, orgId);
      if (exists) {
        throw new Error("Mã vạch đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.");
      }
    }

    // Need to verify variant belongs to organization
    const { data: verifyData } = await supabase
      .from('product_variants')
      .select('id, products!inner(organization_id)')
      .eq('id', variantId)
      .eq('products.organization_id', orgId)
      .single();

    if (!verifyData) {
      throw new Error("Phiên bản không hợp lệ hoặc không thuộc về tổ chức này.");
    }

    const { error } = await supabase
      .from('product_variants')
      .update({ barcode })
      .eq('id', variantId);

    if (error) throw error;
  }
};
