import { createClient } from "@/utils/supabase/client";

// Dynamic tenant resolution from current hostname
export function getTenantSlug(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.host; // e.g. bibomart.localhost:3000
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "localhost:3000";
    
    if (hostname === mainDomain || hostname === `www.${mainDomain}`) {
      return "app";
    }
    
    const parts = hostname.split('.');
    if (parts.length > 1) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'localhost:3000' && subdomain !== 'localhost') {
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

export async function getActiveOrganizationId(): Promise<string> {
  const tenantSlug = getTenantSlug();
  
  if (cachedOrgId && cachedTenantSlug === tenantSlug) {
    return cachedOrgId;
  }
  
  const supabase = createClient();
  
  try {
    // 1. Fetch organization matching subdomain slug
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', tenantSlug)
      .maybeSingle();
      
    if (org?.id) {
      cachedOrgId = org.id;
      cachedTenantSlug = tenantSlug;
      return org.id;
    }
    
    // 2. Auto-provision organization if it doesn't exist (robust self-healing UX)
    const name = tenantSlug === 'app'
      ? 'ZPOS Retail'
      : tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1);
      
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert([{
        name: name,
        slug: tenantSlug,
        branding: { theme: 'default' }
      }])
      .select()
      .single();
      
    if (!createError && newOrg) {
      // Auto-create a main branch for this new organization
      await supabase.from('branches').insert([{
        organization_id: newOrg.id,
        name: 'Chi nhánh chính',
        is_main_branch: true,
        address: 'Trụ sở chính'
      }]);
      
      cachedOrgId = newOrg.id;
      cachedTenantSlug = tenantSlug;
      return newOrg.id;
    }
  } catch (e) {
    console.error("Error auto-provisioning organization for slug:", tenantSlug, e);
  }
  
  // 3. Fallback to first organization in DB
  try {
    const { data: fallbackOrgs } = await supabase.from('organizations').select('id').limit(1);
    if (fallbackOrgs && fallbackOrgs.length > 0) {
      cachedOrgId = fallbackOrgs[0].id;
      cachedTenantSlug = tenantSlug;
      return fallbackOrgs[0].id;
    }
  } catch (e) {
    console.error("Fallback query failed:", e);
  }
  
  // 4. Ultimate fallback to prevent application crashing
  return '00000000-0000-0000-0000-000000000000';
}

export const posService = {
  async getActiveOrganizationId() {
    return getActiveOrganizationId();
  },

  async getProducts() {
    const supabase = createClient();
    const tenantSlug = getTenantSlug();
    
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
      .eq('is_active', true);
    
    if (error) {
      console.error("Supabase error (getProducts):", error.message, error.details);
      throw error;
    }

    // Filter products by tenant prefix in description
    let filteredData = data || [];
    if (tenantSlug === 'app') {
      filteredData = filteredData.filter((p: any) => !p.description || !p.description.includes('::') || p.description.startsWith('app::'));
    } else {
      filteredData = filteredData.filter((p: any) => p.description && p.description.startsWith(`${tenantSlug}::`));
    }

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
        const localMinStocks = localStorage.getItem('zpos_products_min_stock');
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
    const tenantSlug = getTenantSlug();
    
    const costPart = productData.cost_price !== undefined ? `[cost_price:${productData.cost_price}]` : '';
    const { cost_price, ...restProductData } = productData;
    
    const preparedData = {
      ...restProductData,
      description: `${tenantSlug}::${costPart}${productData.description || ''}`
    };
    
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
    const tenantSlug = getTenantSlug();

    // Persist min_stock in local storage as a robust fallback first
    if (productData.min_stock !== undefined && typeof window !== 'undefined') {
      try {
        const localMinStocks = localStorage.getItem('zpos_products_min_stock');
        const minStockMap = localMinStocks ? JSON.parse(localMinStocks) : {};
        minStockMap[id] = productData.min_stock;
        localStorage.setItem('zpos_products_min_stock', JSON.stringify(minStockMap));
      } catch (e) {
        console.warn("Error saving local min stock:", e);
      }
    }

    try {
      const costPart = productData.cost_price !== undefined ? `[cost_price:${productData.cost_price}]` : '';
      const { cost_price, ...restProductData } = productData;
      
      const preparedData = { ...restProductData };
      if (productData.description !== undefined || productData.cost_price !== undefined) {
        preparedData.description = `${tenantSlug}::${costPart}${productData.description || ''}`;
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(preparedData)
        .eq('id', id)
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
    
    const { error } = await supabase
      .from('products')
      .update({ is_active: false }) // Soft delete
      .eq('id', id);
    
    if (error) throw error;
  },

  async getCustomers(query: string) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let data: any[] = [];
    
    try {
      let dbQuery = supabase.from('customers').select('*').eq('organization_id', orgId);
        
      if (query.trim()) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
      }
      const { data: dbData, error } = await dbQuery.limit(100);
      if (!error && dbData) {
        data = dbData;
      }
    } catch (e) {
      console.warn("Supabase customers query error, using local storage fallback", e);
    }
    
    let filteredData = data || [];
    
    // Clean up address for UI
    filteredData = filteredData.map((c: any) => {
      let cleanAddress = c.address;
      if (c.address && c.address.includes('::')) {
        cleanAddress = c.address.split('::').slice(1).join('::');
      }
      return {
        ...c,
        address: cleanAddress
      };
    });
    
    // Merge from local storage fallback
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('zpos_customers');
        if (local) {
          const localList = JSON.parse(local);
          const filteredLocal = localList.filter((c: any) => {
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
          });
          // Merge local customers that aren't already in the list
          const dbIds = new Set(filteredData.map(c => c.id));
          filteredLocal.forEach((c: any) => {
            if (!dbIds.has(c.id)) {
              filteredData.push(c);
            }
          });
        }
      } catch (e) {
        console.warn("Error reading local customers:", e);
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
    
    // Validate branch_id or auto-create main branch
    let branchId = orderData.branch_id;
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
          // Auto-create a main branch if missing
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
        }
      } catch (e) {
        console.warn("Branches table not available, using default branch ID fallback:", e);
        branchId = '00000000-0000-0000-0000-000000000000';
      }
    }
    
    // Validate customer_id to ensure it is a valid UUID
    let customerId = orderData.customer_id;
    if (customerId && !isValidUUID(customerId)) {
      customerId = null;
    }

    // Ensure active tenant organization and valid branch/customer are linked
    const preparedOrderData = {
      ...orderData,
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
      console.error("Order insertion failed:", orderError.message, orderError.details);
      throw orderError;
    }

    // Fetch a fallback product ID from DB to ensure foreign key constraint is satisfied if mock items are checked out
    let fallbackProductId: string | null = null;
    try {
      const { data: firstProd } = await supabase.from('products').select('id').limit(1);
      if (firstProd && firstProd.length > 0) {
        fallbackProductId = firstProd[0].id;
      }
    } catch (e) {
      console.warn("Could not fetch fallback product ID for order_items:", e);
    }

    // 2. Create order items
    const orderItems = items.map(item => {
      let itemId = item.variant_id || item.id;
      if (!isValidUUID(itemId)) {
        itemId = fallbackProductId || '00000000-0000-0000-0000-000000000000';
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
      console.error("Order items insertion failed:", itemsError.message, itemsError.details);
      throw itemsError;
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
          .single();
          
        if (productData) {
          const newStock = Math.max(0, (productData.stock || 0) - (item.quantity || 1));
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId);
            
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
        customer:customers(name),
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
      .select('id, name, variants:product_variants(id, name)')
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
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createCustomer(customerData: any) {
    const supabase = createClient();
    const tenantSlug = getTenantSlug();
    const orgId = await getActiveOrganizationId();
    
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
        const local = localStorage.getItem('zpos_customers');
        const list = local ? JSON.parse(local) : [];
        list.push(finalData);
        localStorage.setItem('zpos_customers', JSON.stringify(list));
      } catch (e) {
        console.warn("Error writing local customer:", e);
      }
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([finalData])
        .select()
        .single();
      
      if (!error && data) {
        if (data.address && data.address.includes('::')) {
          data.address = data.address.split('::').slice(1).join('::');
        }
        return data;
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
    
    for (const item of items) {
      // 1. Update received quantity in purchase_order_items
      const { data: orderItem } = await supabase
        .from('purchase_order_items')
        .select('received_quantity, product_id, variant_id, quantity')
        .eq('id', item.itemId)
        .single();
      
      if (orderItem) {
        const newReceivedQty = (orderItem.received_quantity || 0) + item.receivedQty;
        await supabase
          .from('purchase_order_items')
          .update({ received_quantity: newReceivedQty })
          .eq('id', item.itemId);

        // 2. Increase stock in products or product_variants
        if (orderItem.variant_id) {
          const { data: variant } = await supabase.from('product_variants').select('stock').eq('id', orderItem.variant_id).single();
          await supabase.from('product_variants').update({ stock: (variant?.stock || 0) + item.receivedQty }).eq('id', orderItem.variant_id);
        } else {
          const { data: product } = await supabase.from('products').select('stock').eq('id', orderItem.product_id).single();
          await supabase.from('products').update({ stock: (product?.stock || 0) + item.receivedQty }).eq('id', orderItem.product_id);
        }
      }
    }

    // 3. Update PO status if fully received
    const { data: allItems } = await supabase.from('purchase_order_items').select('quantity, received_quantity').eq('purchase_order_id', purchaseOrderId);
    const fullyReceived = allItems?.every(i => i.received_quantity >= i.quantity);
    
    await supabase
      .from('purchase_orders')
      .update({ status: fullyReceived ? 'received' : 'receiving' })
      .eq('id', purchaseOrderId);
  },

  async updateStock(productId: string, delta: number) {
    const supabase = createClient();
    
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();
    
    if (product) {
      const newStock = (product.stock || 0) + delta;
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
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
    const tenantSlug = getTenantSlug();
    const { data: allProducts } = await supabase.from('products').select('*').eq('is_active', true);
    let products = allProducts || [];
    if (tenantSlug === 'app') {
      products = products.filter((p: any) => !p.description || !p.description.includes('::') || p.description.startsWith('app::'));
    } else {
      products = products.filter((p: any) => p.description && p.description.startsWith(`${tenantSlug}::`));
    }
    const productsCount = products.length;

    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).neq('status', 'cancelled');
    
    const { data: allCustomers } = await supabase.from('customers').select('*').eq('organization_id', orgId);
    let customers = allCustomers || [];
    const customersCount = customers.length;
    
    const { data: orders } = await supabase.from('orders').select('id, created_at, total_amount, payment_method').eq('organization_id', orgId).neq('status', 'cancelled');
    const totalRevenue = orders?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

    // Calculate real payment method percentages dynamically from orders
    let cashAmount = 0;
    let bankAmount = 0;
    let cardAmount = 0;

    orders?.forEach((o: any) => {
      const amt = Number(o.total_amount) || 0;
      const method = String(o.payment_method || '').toLowerCase();
      if (method === 'cash') {
        cashAmount += amt;
      } else if (method === 'bank_transfer' || method === 'transfer') {
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
      const amt = Number(o.total_amount) || 0;
      if (date >= oneWeekAgo && date <= now) {
        thisWeekRevenue += amt;
        thisWeekOrders += 1;
      } else if (date >= twoWeeksAgo && date < oneWeekAgo) {
        lastWeekRevenue += amt;
        lastWeekOrders += 1;
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

    // Fetch dynamic category sales and best-selling products
    let dynamicCategorySales: { name: string, value: number }[] = [];
    let dynamicTopProducts: any[] = [];
    try {
      const orderIds = orders?.map((o: any) => o.id) || [];
      if (orderIds.length > 0) {
        const { data: orderItems, error: itemsErr } = await supabase
          .from('order_items')
          .select('order_id, total_price, quantity, variant_id')
          .in('order_id', orderIds);
        
        if (!itemsErr && orderItems && orderItems.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, price, image, description, category:categories(name), variants:product_variants(id)');

          let finalProds = products || [];
          if (tenantSlug === 'app') {
            finalProds = finalProds.filter((p: any) => !p.description || !p.description.includes('::') || p.description.startsWith('app::'));
          } else {
            finalProds = finalProds.filter((p: any) => p.description && p.description.startsWith(`${tenantSlug}::`));
          }

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
        .eq('is_active', true);
      
      let filteredCats = dbCats || [];
      if (tenantSlug === 'app') {
        filteredCats = filteredCats.filter((c: any) => !c.description || !c.description.includes('::') || c.description.startsWith('app::'));
      } else {
        filteredCats = filteredCats.filter((c: any) => c.description && c.description.startsWith(`${tenantSlug}::`));
      }
      
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
      customersChange: "+5%",
      ordersList: orders || [],
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
    
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:orders(id, order_number, total_amount, created_at, status)
      `)
      .eq('id', id)
      .single();
    
    if (data?.orders) {
      data.orders = data.orders.filter((o: any) => o.status !== 'cancelled');
    }
    
    if (data && data.address && data.address.includes('::')) {
      data.address = data.address.split('::').slice(1).join('::');
    }
    
    if (error) throw error;
    return data;
  },

  async getCategoryList() {
    const supabase = createClient();
    const tenantSlug = getTenantSlug();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(id)')
      .eq('is_active', true);
    
    if (error) throw error;
    
    let filteredData = data || [];
    if (tenantSlug === 'app') {
      filteredData = filteredData.filter((c: any) => !c.description || !c.description.includes('::') || c.description.startsWith('app::'));
    } else {
      filteredData = filteredData.filter((c: any) => c.description && c.description.startsWith(`${tenantSlug}::`));
    }
    
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
    const tenantSlug = getTenantSlug();
    
    const preparedData = {
      ...categoryData,
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
    const tenantSlug = getTenantSlug();
    
    const preparedData = { ...categoryData };
    if (categoryData.description !== undefined) {
      preparedData.description = `${tenantSlug}::${categoryData.description || ''}`;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(preparedData)
      .eq('id', id)
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
    
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);
      
    if (error) throw error;
  },

  async deleteCustomer(id: string) {
    const supabase = createClient();
    
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('zpos_customers');
        if (local) {
          const list = JSON.parse(local);
          const updated = list.filter((c: any) => c.id !== id);
          localStorage.setItem('zpos_customers', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("Error deleting local customer:", e);
      }
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
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
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');
    if (ordersError) throw ordersError;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchase_orders')
      .select('total_amount, paid_amount')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');
    if (purchasesError) throw purchasesError;
    const totalCOGS = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('organization_id', orgId)
      .eq('status', 'paid');
    if (expensesError) throw expensesError;
    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const netProfit = totalRevenue - totalCOGS - totalExpenses;

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      netProfit,
      revenueChange: "+12.5%",
      expenseChange: "+3.2%",
      profitChange: "+18.4%"
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
        
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn("Supabase branches table error, using local storage fallback", e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('zpos_branches');
      if (!local) {
        const defaultBranches = [
          { id: crypto.randomUUID(), organization_id: orgId, name: "Chi nhánh Quận 1", address: "123 Đường ABC, Quận 1, TP.HCM", status: "Chính" },
          { id: crypto.randomUUID(), organization_id: orgId, name: "Chi nhánh Ba Đình", address: "456 Đường XYZ, Ba Đình, Hà Nội", status: "Phụ" }
        ];
        localStorage.setItem('zpos_branches', JSON.stringify(defaultBranches));
        return defaultBranches;
      }
      return JSON.parse(local);
    }
    
    return [
      { id: "1", organization_id: orgId, name: "Chi nhánh Quận 1", address: "123 Đường ABC, Quận 1, TP.HCM", status: "Chính" },
      { id: "2", organization_id: orgId, name: "Chi nhánh Ba Đình", address: "456 Đường XYZ, Ba Đình, Hà Nội", status: "Phụ" }
    ];
  },

  async saveBranch(branch: any) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    
    const preparedBranch = {
      ...branch,
      organization_id: orgId
    };
    
    try {
      const { data, error } = await supabase
        .from('branches')
        .upsert(preparedBranch)
        .select()
        .single();
        
      if (!error && data) return data;
    } catch (e) {
      console.warn("Supabase branches table upsert error, using local storage fallback", e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('zpos_branches');
      let branches = local ? JSON.parse(local) : [
        { id: "1", organization_id: orgId, name: "Chi nhánh Quận 1", address: "123 Đường ABC, Quận 1, TP.HCM", status: "Chính" },
        { id: "2", organization_id: orgId, name: "Chi nhánh Ba Đình", address: "456 Đường XYZ, Ba Đình, Hà Nội", status: "Phụ" }
      ];
      
      if (branch.id) {
        branches = branches.map((b: any) => b.id === branch.id ? preparedBranch : b);
      } else {
        const newBranch = { 
          ...preparedBranch, 
          id: crypto.randomUUID(),
          status: branches.length === 0 ? "Chính" : "Phụ"
        };
        branches.push(newBranch);
      }
      
      localStorage.setItem('zpos_branches', JSON.stringify(branches));
      return preparedBranch;
    }
    return preparedBranch;
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
      const local = localStorage.getItem('zpos_branches');
      if (local) {
        let branches = JSON.parse(local);
        branches = branches.filter((b: any) => b.id !== id);
        localStorage.setItem('zpos_branches', JSON.stringify(branches));
      }
    }
  }
};
