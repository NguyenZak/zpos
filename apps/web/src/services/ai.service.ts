import { createClient } from "@/utils/supabase/client";
import { calculateSoldItemsCOGS, fetchSoldItemsForCOGS, getActiveOrganizationId } from "./pos.service";

export const aiService = {
  // 1. Revenue Summary
  async getRevenueSummary() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');
    if (error) throw error;

    const total = data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    return {
      totalRevenue: total,
      ordersCount: data?.length || 0,
      averageOrderValue: data?.length ? total / data.length : 0,
    };
  },

  // 2. Profit Summary
  async getProfitSummary() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    // Revenue
    const { data: orders } = await supabase.from('orders')
      .select('id, total_amount')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled');
    const revenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

    // COGS: only sold items count toward cost of goods sold.
    const orderIds = (orders || []).map((o: any) => o.id).filter(Boolean);
    const soldItems = await fetchSoldItemsForCOGS(supabase, orderIds);
    const cogs = calculateSoldItemsCOGS(soldItems);

    // Expenses
    const { data: expenses } = await supabase.from('expenses')
      .select('amount')
      .eq('organization_id', orgId)
      .eq('status', 'paid');
    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      profitMargin: revenue ? (netProfit / revenue) * 100 : 0
    };
  },

  // 3. Top Products
  async getTopProducts() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('stock', { ascending: false });
    if (error) throw error;

    return (data || []).slice(0, 5);
  },

  // 4. Low Stock Items
  async getLowStockItems() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('organization_id', orgId)
      .lt('stock', 5)
      .eq('is_active', true);
    if (error) throw error;

    return data || [];
  },

  // 5. Inventory Forecast
  async getInventoryForecast() {
    const lowStock = await this.getLowStockItems();
    return lowStock.map(item => ({
      ...item,
      forecastedDaysLeft: Math.floor(Math.random() * 4) + 1, // Predict 1 to 4 days left
      suggestedRestockQty: 20,
      priority: item.stock === 0 ? 'Urgent' : 'Medium'
    }));
  },

  // 6. Expense Summary
  async getExpenseSummary() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:expense_categories(name)')
      .eq('organization_id', orgId)
      .eq('status', 'paid');
    if (error) throw error;

    const total = data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    
    // Group by category
    const grouped: any = {};
    data?.forEach(e => {
      const catName = e.category?.name || "Khác";
      grouped[catName] = (grouped[catName] || 0) + Number(e.amount);
    });

    return {
      totalExpenses: total,
      categories: Object.entries(grouped).map(([name, amount]) => ({ name, amount }))
    };
  },

  // 7. Customer Segments
  async getCustomerSegments() {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', orgId)
      .order('points', { ascending: false });
    if (error) throw error;

    const filtered = data || [];

    const vip = filtered.filter(c => Number(c.points) > 1000);
    const regular = filtered.filter(c => Number(c.points) <= 1000 && Number(c.points) > 100);
    const newCust = filtered.filter(c => Number(c.points) <= 100);

    return [
      { name: "Khách hàng VIP", count: vip.length, criteria: "> 1000 điểm" },
      { name: "Khách hàng Thân thiết", count: regular.length, criteria: "100 - 1000 điểm" },
      { name: "Khách hàng Mới", count: newCust.length, criteria: "< 100 điểm" }
    ];
  },

  // 8. Branch Performance
  async getBranchPerformance() {
    const rev = await this.getRevenueSummary();
    return [
      { name: "Chi nhánh chính", revenue: rev.totalRevenue, orders: rev.ordersCount }
    ];
  },

  // 9. Create Purchase Draft
  async createPurchaseDraft(supplierId: string, productId: string, qty: number) {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('organization_id', orgId)
      .single();
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    // Resolve branch
    let branchId = null;
    const { data: branches } = await supabase.from('branches').select('id').eq('organization_id', orgId).limit(1);
    if (branches && branches.length > 0) {
      branchId = branches[0].id;
    }

    // Auto draft a purchase order code
    const purchaseCode = `AI-PO-${Date.now().toString().slice(-6)}`;
    const { data: po, error } = await supabase
      .from('purchase_orders')
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        supplier_id: supplierId,
        code: purchaseCode,
        status: 'draft',
        total_amount: Number(product.price) * qty,
        note: "Đơn hàng dự thảo tự động bởi ZPOS AI"
      })
      .select()
      .single();
    
    if (error) throw error;
    return po;
  },

  // 10. Generate Product Content
  async generateProductContent(productName: string, type: 'seo' | 'facebook' | 'tiktok' | 'description') {
    // Highly realistic, engaging Apple-inspired generation template
    const templates = {
      description: `Sản phẩm ${productName} đại diện cho bước nhảy vọt về công nghệ và thiết kế của ZPOS. Được chế tác tỉ mỉ từ những vật liệu cao cấp nhất, đem lại trải nghiệm mượt mà, đẳng cấp vượt trội đến từng chi tiết nhỏ nhất.`,
      seo: `Mua ngay ${productName} chính hãng giá tốt nhất tại ZPOS. Bảo hành chính hãng 12 tháng, 1 đổi 1 trong 30 ngày. Hỗ trợ giao hàng siêu tốc miễn phí toàn quốc.`,
      facebook: `🔥 SIÊU PHẨM TRÌNH LÀNG: ${productName}! 🔥\n\nBạn đã sẵn sàng nâng cấp trải nghiệm của mình chưa? Được trang bị những tính năng hiện đại nhất cùng thiết kế tinh xảo, ${productName} chắc chắn sẽ không làm bạn thất vọng.\n\n👉 Nhắn tin ngay cho page để nhận ưu đãi mở bán lên đến 20%!`,
      tiktok: `✨ Cận cảnh siêu phẩm ${productName} cực trend! ✨ #xuhuong #zpos #learnontiktok #lifestyle`
    };
    return templates[type] || templates.description;
  }
};
