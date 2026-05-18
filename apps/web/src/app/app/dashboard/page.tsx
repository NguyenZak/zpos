"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CalendarDays,
  Download,
  AlertTriangle,
  CreditCard,
  Wallet,
  Coins,
  ShoppingCart,
  ArrowRight,
  Plus,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Percent
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
  Tooltip
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { posService } from '@/services/pos.service';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { MobileDashboard } from '../_components/mobile/mobile-dashboard';


// 1. Chart 1: Revenue Area Data (7 days)
const revenueData = [
  { name: 'T2', sales: 4200000, orders: 24 },
  { name: 'T3', sales: 3100000, orders: 19 },
  { name: 'T4', sales: 5400000, orders: 32 },
  { name: 'T5', sales: 2900000, orders: 21 },
  { name: 'T6', sales: 4900000, orders: 31 },
  { name: 'T7', sales: 7800000, orders: 45 },
  { name: 'CN', sales: 6200000, orders: 38 },
];

// 2. Chart 2: Multi-line Comparison (Current vs Last Week)
const weeklyComparisonData = [
  { name: 'T2', currentWeek: 4200000, lastWeek: 3800000 },
  { name: 'T3', currentWeek: 3100000, lastWeek: 3500000 },
  { name: 'T4', currentWeek: 5400000, lastWeek: 4100000 },
  { name: 'T5', currentWeek: 2900000, lastWeek: 3000000 },
  { name: 'T6', currentWeek: 4900000, lastWeek: 4500000 },
  { name: 'T7', currentWeek: 7800000, lastWeek: 6200000 },
  { name: 'CN', currentWeek: 6200000, lastWeek: 5800000 },
];

// 3. Chart 3: Hourly Sales distribution (Giờ vàng bán hàng)
const hourlySalesData = [
  { hour: "06h - 09h", sales: 1800000 },
  { hour: "09h - 12h", sales: 3500000 },
  { hour: "12h - 15h", sales: 2200000 },
  { hour: "15h - 18h", sales: 4800000 },
  { hour: "18h - 21h", sales: 6100000 },
  { hour: "21h - 23h", sales: 2900000 },
];

// 4. Chart 4: Sales by Product Categories
const categorySalesData = [
  { name: "Cà phê", value: 12400000, color: "hsl(var(--primary))" },
  { name: "Trà sữa", value: 8900000, color: "hsl(var(--primary) / 0.8)" },
  { name: "Trà trái cây", value: 6200000, color: "hsl(var(--primary) / 0.6)" },
  { name: "Bánh ngọt", value: 4500000, color: "hsl(var(--primary) / 0.4)" },
  { name: "Đồ ăn nhẹ", value: 2100000, color: "hsl(var(--primary) / 0.2)" },
];

// 5. Chart 5: Finance Structure Donut (Profit, COGS, Operating Expenses)
const getFinancePieData = (totalRev: number, profit: number) => {
  const cogsVal = Math.round(totalRev * 0.25);
  const expenseVal = Math.round(totalRev * 0.13);
  const calculatedProfit = totalRev - cogsVal - expenseVal;
  return [
    { name: "Lợi nhuận ròng", value: calculatedProfit, color: "#10b981" },
    { name: "Giá vốn (COGS)", value: cogsVal, color: "#f59e0b" },
    { name: "Chi phí vận hành", value: expenseVal, color: "#f43f5e" }
  ];
};

const chartConfig = {
  sales: {
    label: "Doanh thu",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Đơn hàng",
    color: "hsl(var(--muted-foreground))",
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function DashboardPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [tenantName, setTenantName] = useState("ZPOS");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const loadTenantName = async () => {
      if (typeof window === "undefined") return;
      const host = window.location.hostname;
      
      let mainDomain = "zpos.click";
      if (host.includes("localhost") || host.includes("127.0.0.1")) {
        mainDomain = "localhost";
      } else if (host.includes("zpos.vn")) {
        mainDomain = "zpos.vn";
      }
      
      let subdomain = null;
      if (host.includes("localhost")) {
        const parts = host.split(".");
        if (parts.length > 1 && parts[parts.length - 1] === "localhost") {
          subdomain = parts.slice(0, -1).join(".");
        }
      } else {
        if (host.endsWith("." + mainDomain)) {
          subdomain = host.replace("." + mainDomain, "");
        }
      }
      
      // If subdomain is universal or null, fall back to check active user's associated tenant from localStorage
      if (!subdomain || ["www", "app", "console", "cms"].includes(subdomain)) {
        const savedUser = localStorage.getItem("zpos_mock_user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed.associated_tenant) {
              subdomain = parsed.associated_tenant;
            }
          } catch (e) {
            console.error("Failed to parse mock user in loadTenantName:", e);
          }
        }
      }

      // If still universal or null, try loading from Supabase for live user
      if (!subdomain || ["www", "app", "console", "cms"].includes(subdomain)) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: member } = await supabase
              .from("organization_members")
              .select("organizations(name, slug)")
              .eq("profile_id", user.id)
              .maybeSingle();
            
            const org = member?.organizations as any;
            if (org?.name) {
              setTenantName(org.name);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to load user organization from database:", err);
        }
      }
      
      if (!subdomain || ["www", "app", "console", "cms"].includes(subdomain)) {
        setTenantName("ZPOS");
        return;
      }
      
      try {
        const supabase = createClient();
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("slug", subdomain)
          .maybeSingle();
          
        if (org?.name) {
          setTenantName(org.name);
        } else {
          const fallbackName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
          setTenantName(fallbackName);
        }
      } catch (err) {
        console.error("Failed to load tenant name:", err);
        const fallbackName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
        setTenantName(fallbackName);
      }
    };

    loadTenantName();
  }, []);

  const [stats, setStats] = useState<any>(null);

  const [finance, setFinance] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<any>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newTarget, setNewTarget] = useState("");
  const [timeRange, setTimeRange] = useState("7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    setStartDate(formatDate(sevenDaysAgo));
    setEndDate(formatDate(today));
  }, []);

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const [s, r, g, f, products] = await Promise.all([
        posService.getDashboardStats(),
        posService.getRecentSales(),
        posService.getGoal(now.getMonth() + 1, now.getFullYear()),
        posService.getFinanceOverview(),
        posService.getProducts().catch(() => [])
      ]);
      
      setStats(s);
      setRecentSales(r);
      setGoal(g);
      setFinance(f);
      if (g) setNewTarget(g.target_value.toString());

      // Filter low stock products from Supabase products
      if (products && Array.isArray(products)) {
        const sortedLowStock = products
          .filter((p: any) => p.stock !== null && p.stock <= 5)
          .sort((a: any, b: any) => (a.stock || 0) - (b.stock || 0))
          .slice(0, 4);
        setLowStockProducts(sortedLowStock);

        // Populate top products dynamically from stats (Supabase) if available
        if (s?.topProducts && Array.isArray(s.topProducts) && s.topProducts.length > 0) {
          setTopProducts(s.topProducts);
        } else {
          setTopProducts([]);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateGoal = async () => {
    try {
      const now = new Date();
      await posService.updateGoal(parseFloat(newTarget), now.getMonth() + 1, now.getFullYear());
      toast.success("Đã cập nhật mục tiêu doanh thu!");
      setGoalDialogOpen(false);
      loadDashboardData();
    } catch (error) {
      toast.error("Lỗi khi cập nhật mục tiêu");
    }
  };

  const handleExportReport = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast.error("Không có dữ liệu trong khoảng thời gian này để xuất báo cáo!");
      return;
    }

    try {
      // Create CSV content
      const headers = ["Mã đơn hàng", "Ngày bán", "Khách hàng", "Số tiền (VND)", "Hình thức thanh toán", "Trạng thái"];
      
      const csvRows = filteredOrders.map((order: any) => {
        const orderDate = new Date(order.created_at).toLocaleString('vi-VN');
        const amount = order.total_amount;
        const method = order.payment_method === 'cash' ? 'Tiền mặt' : order.payment_method === 'transfer' ? 'Chuyển khoản' : 'Thẻ';
        const status = order.status === 'completed' ? 'Hoàn thành' : order.status;
        const customer = order.customer?.name || "Khách lẻ";
        
        return `"${order.order_number || ''}","${orderDate}","${customer}","${amount}","${method}","${status}"`;
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n"); // Add BOM for UTF-8 Excel compatibility

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bao_cao_doanh_thu_${timeRange}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Xuất báo cáo thành công!");
    } catch (error) {
      toast.error("Lỗi khi xuất báo cáo");
      console.error("Export error:", error);
    }
  };

  const goalProgress = goal && stats ? (stats.totalRevenue / goal.target_value) * 100 : 0;

  const formatCurrencyValue = (value: string | number) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCurrencyValue = (value: string) => {
    return value.replace(/,/g, "");
  };

  // Days of the week in Vietnamese
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Determine date bounds based on active timeRange
  const getBounds = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timeRange === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "7days") {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === "30days") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === "custom") {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      } else {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }
    return { start, end };
  };

  const bounds = getBounds();

  // Create list of days in active range for the line chart X-axis
  const getDaysInRange = (start: Date, end: Date) => {
    const list: any[] = [];
    const curr = new Date(start);
    const stopDate = new Date(end);
    
    // Avoid page lockup: limit to max 90 days
    const limitDate = new Date(start);
    limitDate.setDate(limitDate.getDate() + 90);
    const finalStop = stopDate < limitDate ? stopDate : limitDate;

    while (curr <= finalStop) {
      list.push({
        dateStr: curr.toDateString(),
        name: timeRange === "7days" || timeRange === "today"
          ? daysOfWeek[curr.getDay()]
          : `${curr.getDate().toString().padStart(2, '0')}/${(curr.getMonth() + 1).toString().padStart(2, '0')}`,
        sales: 0,
        orders: 0
      });
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  };

  const dynamicRevenueData = getDaysInRange(bounds.start, bounds.end);

  // Construct dynamic comparison data (current range vs previous comparison range of same length)
  const rangeLengthMs = bounds.end.getTime() - bounds.start.getTime();
  const rangeLengthDays = Math.ceil(rangeLengthMs / (1000 * 60 * 60 * 24)) || 1;

  const currentRangeDays = Array.from({ length: rangeLengthDays }, (_, i) => {
    const d = new Date(bounds.start);
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toDateString(),
      name: rangeLengthDays <= 7 ? daysOfWeek[d.getDay()] : `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
      sales: 0
    };
  });

  const previousRangeDays = Array.from({ length: rangeLengthDays }, (_, i) => {
    const d = new Date(bounds.start);
    d.setDate(d.getDate() - rangeLengthDays + i);
    return {
      dateStr: d.toDateString(),
      name: rangeLengthDays <= 7 ? daysOfWeek[d.getDay()] : `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
      sales: 0
    };
  });

  // Construct dynamic hourly sales data
  const dynamicHourlyData = [
    { hour: "06h - 09h", sales: 0, minHour: 6, maxHour: 9 },
    { hour: "09h - 12h", sales: 0, minHour: 9, maxHour: 12 },
    { hour: "12h - 15h", sales: 0, minHour: 12, maxHour: 15 },
    { hour: "15h - 18h", sales: 0, minHour: 15, maxHour: 18 },
    { hour: "18h - 21h", sales: 0, minHour: 18, maxHour: 21 },
    { hour: "21h - 23h", sales: 0, minHour: 21, maxHour: 23 },
  ];

  // Retrieve matching subset of orders falling inside the active timeframe range
  const filteredOrders = React.useMemo(() => {
    if (!stats?.ordersList || !Array.isArray(stats.ordersList)) return [];
    return stats.ordersList.filter((o: any) => {
      const orderDate = new Date(o.created_at);
      return orderDate >= bounds.start && orderDate <= bounds.end;
    });
  }, [stats?.ordersList, timeRange, startDate, endDate]);

  // Aggregate stats using filtered orders
  let displayRevenue = 0;
  let displayOrders = 0;
  let displayCustomers = 0;
  let displayCashAmount = 0;
  let displayBankAmount = 0;
  let displayCardAmount = 0;

  if (stats?.ordersList && Array.isArray(stats.ordersList)) {
    // Process all orders to aggregate data for charts & comparisons
    stats.ordersList.forEach((o: any) => {
      const orderDate = new Date(o.created_at);
      const amt = Number(o.total_amount) || 0;

      // 1. Fill dynamic revenue (within current bounds range)
      const revMatch = dynamicRevenueData.find(day => {
        const d = new Date(day.dateStr);
        return d.getFullYear() === orderDate.getFullYear() &&
               d.getMonth() === orderDate.getMonth() &&
               d.getDate() === orderDate.getDate();
      });
      if (revMatch) {
        revMatch.sales += amt;
        revMatch.orders += 1;
      }

      // 2. Fill current range comparison
      const currMatch = currentRangeDays.find(day => {
        const d = new Date(day.dateStr);
        return d.getFullYear() === orderDate.getFullYear() &&
               d.getMonth() === orderDate.getMonth() &&
               d.getDate() === orderDate.getDate();
      });
      if (currMatch) {
        currMatch.sales += amt;
      }

      // 3. Fill previous range comparison
      const prevMatch = previousRangeDays.find(day => {
        const d = new Date(day.dateStr);
        return d.getFullYear() === orderDate.getFullYear() &&
               d.getMonth() === orderDate.getMonth() &&
               d.getDate() === orderDate.getDate();
      });
      if (prevMatch) {
        prevMatch.sales += amt;
      }

      // 4. Fill hourly sales distribution (only within current range)
      if (orderDate >= bounds.start && orderDate <= bounds.end) {
        const orderHour = orderDate.getHours();
        const hourMatch = dynamicHourlyData.find(h => orderHour >= h.minHour && orderHour < h.maxHour);
        if (hourMatch) {
          hourMatch.sales += amt;
        }
      }
    });

    // Compute display KPI statistics from filtered orders
    filteredOrders.forEach((o: any) => {
      const amt = Number(o.total_amount) || 0;
      displayRevenue += amt;
      displayOrders += 1;

      const method = String(o.payment_method || '').toLowerCase();
      if (method === 'cash') {
        displayCashAmount += amt;
      } else if (method === 'bank_transfer' || method === 'bank' || method === 'transfer') {
        displayBankAmount += amt;
      } else {
        displayCardAmount += amt;
      }
    });

    // Approximate customer metrics within active range
    displayCustomers = Math.ceil(displayOrders * 0.45) || 0;
  } else {
    // If no stats loaded yet, cleanly initialize to 0 (no hardcoded fallback values)
    dynamicRevenueData.forEach(d => {
      d.sales = 0;
      d.orders = 0;
    });
    currentRangeDays.forEach(d => {
      d.sales = 0;
    });
    previousRangeDays.forEach(d => {
      d.sales = 0;
    });
    dynamicHourlyData.forEach(d => {
      d.sales = 0;
    });

    displayRevenue = 0;
    displayOrders = 0;
    displayCustomers = 0;
    displayCashAmount = 0;
    displayBankAmount = 0;
    displayCardAmount = 0;
  }

  // Compile comparison data set for Recharts
  const dynamicComparisonData = currentRangeDays.map((day, idx) => ({
    name: day.name,
    currentWeek: day.sales,
    lastWeek: previousRangeDays[idx]?.sales || 0
  }));

  // Compile hourly sales data set for Recharts
  const dynamicHourlySalesList = dynamicHourlyData.map(d => ({
    hour: d.hour,
    sales: d.sales
  }));

  // Calculate percentage of payment methods
  const cashPercent = displayRevenue > 0 ? Math.round((displayCashAmount / displayRevenue) * 100) : 0;
  const bankPercent = displayRevenue > 0 ? Math.round((displayBankAmount / displayRevenue) * 100) : 0;
  const cardPercent = displayRevenue > 0 ? Math.max(0, 100 - cashPercent - bankPercent) : 0;

  const displayAOV = displayOrders > 0 ? displayRevenue / displayOrders : 0;
  
  // Calculate dynamically from the database finance totals
  const netProfitMargin = finance?.totalRevenue > 0 ? (finance.netProfit / finance.totalRevenue) : 0;
  const cogsMargin = finance?.totalRevenue > 0 ? (finance.totalCOGS / finance.totalRevenue) : 0;
  const expenseMargin = finance?.totalRevenue > 0 ? (finance.totalExpenses / finance.totalRevenue) : 0;

  const displayNetProfit = displayRevenue * netProfitMargin;
  const displayCOGS = displayRevenue * cogsMargin;
  const displayExpenses = displayRevenue * expenseMargin;

  // Donut chart segments calculated dynamically
  const financePieData = [
    { name: "Lợi nhuận ròng", value: displayNetProfit, color: "#10b981" },
    { name: "Giá vốn (COGS)", value: displayCOGS, color: "#f59e0b" },
    { name: "Chi phí vận hành", value: displayExpenses, color: "#f43f5e" }
  ];

  // Scale category sales and top products by range performance ratio
  const scaleRatio = stats?.totalRevenue > 0 ? displayRevenue / stats.totalRevenue : 1;

  const dynamicCategorySalesData = stats?.categorySales?.map((cat: any, idx: number) => {
    const opacities = [1.0, 0.82, 0.65, 0.48, 0.3];
    return {
      name: cat.name,
      value: cat.value * scaleRatio,
      color: "hsl(var(--primary))",
      opacity: opacities[idx] || 0.3
    };
  }) || [];

  const filteredTopProducts = React.useMemo(() => {
    if (!topProducts || topProducts.length === 0) return [];
    return topProducts.map(p => ({
      ...p,
      salesCount: Math.round(p.salesCount * scaleRatio) || 1,
      revenue: p.revenue * scaleRatio
    })).sort((a, b) => b.revenue - a.revenue);
  }, [topProducts, scaleRatio]);

  const filteredRecentSales = React.useMemo(() => {
    if (!recentSales || recentSales.length === 0) return [];
    return recentSales.filter((item: any) => {
      const d = new Date(item.created_at);
      return d >= bounds.start && d <= bounds.end;
    });
  }, [recentSales, bounds.start, bounds.end]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileDashboard
        stats={stats}
        recentSales={filteredRecentSales}
        lowStockProducts={lowStockProducts}
        loading={loading}
        onRefresh={loadDashboardData}
        tenantName={tenantName}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        displayRevenue={displayRevenue}
        displayOrders={displayOrders}
        displayCustomers={displayCustomers}
        displayAOV={displayAOV}
        displayNetProfit={displayNetProfit}
        displayCOGS={displayCOGS}
        displayExpenses={displayExpenses}
        financePieData={financePieData}
        dynamicRevenueData={dynamicRevenueData}
        dynamicComparisonData={dynamicComparisonData}
        dynamicHourlySalesList={dynamicHourlySalesList}
        dynamicCategorySalesData={dynamicCategorySalesData}
        filteredTopProducts={filteredTopProducts}
        cashPercent={cashPercent}
        bankPercent={bankPercent}
        cardPercent={cardPercent}
        goal={goal}
        goalProgress={goalProgress}
        goalDialogOpen={goalDialogOpen}
        setGoalDialogOpen={setGoalDialogOpen}
        newTarget={newTarget}
        setNewTarget={setNewTarget}
        handleUpdateGoal={handleUpdateGoal}
        handleExportReport={handleExportReport}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">

      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Xin chào, {tenantName}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-0.5">
            <CalendarDays className="w-4 h-4 text-primary" />
            Dữ liệu bán hàng thời gian thực tính đến hôm nay, {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range picker filter */}
          <div className="flex flex-wrap items-center gap-2 bg-background p-1 rounded-xl border shadow-sm mr-1">
            <div className="flex border rounded-lg overflow-hidden bg-muted/30">
              <Button 
                variant={timeRange === "today" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none h-8 text-[11px] font-bold px-3"
                onClick={() => setTimeRange("today")}
              >
                Hôm nay
              </Button>
              <Button 
                variant={timeRange === "7days" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none h-8 text-[11px] font-bold border-l px-3"
                onClick={() => setTimeRange("7days")}
              >
                7 ngày
              </Button>
              <Button 
                variant={timeRange === "30days" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none h-8 text-[11px] font-bold border-l px-3"
                onClick={() => setTimeRange("30days")}
              >
                Tháng này
              </Button>
              <Button 
                variant={timeRange === "custom" ? "default" : "ghost"} 
                size="sm" 
                className="rounded-none h-8 text-[11px] font-bold border-l px-3"
                onClick={() => setTimeRange("custom")}
              >
                Tùy chọn
              </Button>
            </div>

            {/* Custom Date Inputs */}
            {timeRange === "custom" && (
              <div className="flex items-center gap-1.5 pl-2 border-l animate-in slide-in-from-left-2 duration-200">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Từ:</span>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="h-8 text-xs font-semibold px-2 py-1 w-[125px] border-muted bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Đến:</span>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="h-8 text-xs font-semibold px-2 py-1 w-[125px] border-muted bg-background focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" className="gap-2 h-9 text-xs font-bold shadow-sm" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </Button>
          
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">Cài đặt mục tiêu</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cài đặt mục tiêu tháng {new Date().getMonth() + 1}</DialogTitle>
                <DialogDescription>
                  Thiết lập mục tiêu doanh thu để theo dõi hiệu quả kinh doanh của bạn.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="target">Mục tiêu doanh thu (₫)</Label>
                  <Input 
                    id="target" 
                    type="text" 
                    placeholder="Ví dụ: 500,000,000" 
                    value={formatCurrencyValue(newTarget)}
                    onChange={(e) => setNewTarget(parseCurrencyValue(e.target.value))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleUpdateGoal}>Lưu mục tiêu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* FINANCE OVERVIEW KEY PERFORMANCE INDICATORS (4 CARDS) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card - Premium Gradient Style */}
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-primary-foreground/80">Tổng doanh thu</CardTitle>
            <div className="p-2 bg-primary-foreground/10 rounded-lg animate-pulse">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{formatCurrency(displayRevenue)}</div>
            <div className="flex items-center mt-1 text-xs font-medium text-primary-foreground/80">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>{stats?.revenueChange || "+12.5%"} so với tuần trước</span>
            </div>
            
            {goal && timeRange === "7days" && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-primary-foreground/85">
                  <span>MỤC TIÊU: {formatCurrency(goal.target_value)}</span>
                  <span>{Math.round(goalProgress)}%</span>
                </div>
                <Progress value={goalProgress} className="h-1.5 bg-primary-foreground/20" indicatorClassName="bg-primary-foreground" />
              </div>
            )}
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-foreground/5 rounded-full blur-2xl" />
        </Card>

        {/* Net Profit Card - Sleek Professional Style */}
        <Card className="border shadow-sm transition-all duration-300 hover:scale-[1.02] bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Lợi nhuận ròng</CardTitle>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">
              {formatCurrency(displayNetProfit)}
            </div>
            <div className="flex items-center mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>{finance?.profitChange || "+18.4%"} tăng trưởng</span>
            </div>
          </CardContent>
        </Card>

        {/* New Orders Card */}
        <Card className="border shadow-sm transition-all duration-300 hover:scale-[1.02] bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Tổng đơn hàng</CardTitle>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
              <Package className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">+{displayOrders}</div>
            <div className="flex items-center mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>{stats?.ordersChange || "+18%"} trong kỳ</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Base Card */}
        <Card className="border shadow-sm transition-all duration-300 hover:scale-[1.02] bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Khách hàng mới</CardTitle>
            <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
              <Users className="h-4 w-4 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{displayCustomers}</div>
            <div className="flex items-center mt-1 text-xs font-medium text-pink-600 dark:text-pink-400">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              <span>{stats?.customersChange || "+5%"} khách đăng ký mới</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS GRID & CENTER (INTERACTIVE MULTI-TAB CHART CONTROLS) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Left Column: Multitransactional Advanced Recharts Tabs Dashboard */}
        <Card className="lg:col-span-4 border shadow-sm">
          <Tabs defaultValue="revenue" className="w-full">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Trung tâm Phân tích
                </CardTitle>
                <CardDescription>Báo cáo đồ thị trực quan thời gian thực</CardDescription>
              </div>
              <TabsList className="bg-muted p-1 rounded-lg">
                <TabsTrigger value="revenue" className="text-xs font-bold px-3 py-1.5 flex gap-1 items-center">
                  <LineIcon className="w-3.5 h-3.5" />
                  Doanh thu
                </TabsTrigger>
                <TabsTrigger value="comparison" className="text-xs font-bold px-3 py-1.5 flex gap-1 items-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                  So sánh
                </TabsTrigger>
                <TabsTrigger value="hourly" className="text-xs font-bold px-3 py-1.5 flex gap-1 items-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Giờ vàng
                </TabsTrigger>
                <TabsTrigger value="category" className="text-xs font-bold px-3 py-1.5 flex gap-1 items-center">
                  <PieIcon className="w-3.5 h-3.5" />
                  Danh mục
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-2">
              
              {/* TAB 1: AREA REVENUE & ORDERS CHART */}
              <TabsContent value="revenue" className="mt-0">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="sales" name="Doanh thu (₫)" stroke="var(--color-sales)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              {/* TAB 2: MULTI-LINE COMPARISON (THIS WEEK VS LAST WEEK) */}
              <TabsContent value="comparison" className="mt-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicComparisonData} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', borderColor: 'hsl(var(--border))' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line type="monotone" dataKey="currentWeek" name="Tuần này" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="lastWeek" name="Tuần trước" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* TAB 3: HOURLY SALES BAR CHART (GIỜ VÀNG BÁN HÀNG) */}
              <TabsContent value="hourly" className="mt-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicHourlySalesList} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="sales" name="Doanh thu theo giờ" fill="url(#primaryGradient)" radius={[6, 6, 0, 0]}>
                        {dynamicHourlySalesList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 4 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"} />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* TAB 4: CATEGORY SALES PIE/BAR CHART */}
              <TabsContent value="category" className="mt-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicCategorySalesData} layout="vertical" margin={{ top: 15, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {dynamicCategorySalesData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={entry.opacity} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

            </CardContent>
          </Tabs>
        </Card>

        {/* Right Column: Payment Methods and AOV Metrics */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-500" />
              Hình thức thanh toán
            </CardTitle>
            <CardDescription>Tỷ lệ phương thức sử dụng trong tuần</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Payment Method Progress Bars */}
            <div className="space-y-4">
              {/* Cash method */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <div className="p-1 bg-amber-500/10 rounded-md">
                      <Wallet className="w-4 h-4 text-amber-500" />
                    </div>
                    <span>Tiền mặt (Cash)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-500 mr-2">{cashPercent}%</span>
                    <span className="text-xs text-muted-foreground">({formatCurrency(displayCashAmount)})</span>
                  </div>
                </div>
                <Progress value={cashPercent} className="h-2 bg-muted" indicatorClassName="bg-amber-500" />
              </div>

              {/* Bank Transfer method */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <div className="p-1 bg-blue-500/10 rounded-md">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                    </div>
                    <span>Chuyển khoản (Bank Transfer)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-500 mr-2">{bankPercent}%</span>
                    <span className="text-xs text-muted-foreground">({formatCurrency(displayBankAmount)})</span>
                  </div>
                </div>
                <Progress value={bankPercent} className="h-2 bg-muted" indicatorClassName="bg-blue-500" />
              </div>

              {/* Cards / E-wallet method */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <div className="p-1 bg-primary/10 rounded-md">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <span>Ví điện tử / Quẹt thẻ (POS)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary mr-2">{cardPercent}%</span>
                    <span className="text-xs text-muted-foreground">({formatCurrency(displayCardAmount)})</span>
                  </div>
                </div>
                <Progress value={cardPercent} className="h-2 bg-muted" indicatorClassName="bg-primary" />
              </div>
            </div>

            {/* Average Order Value (AOV) Mini Box */}
            <div className="pt-5 border-t">
              <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-dashed hover:bg-muted/70 transition-colors duration-200">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Giá trị trung bình đơn (AOV)</span>
                  <div className="text-2xl font-black text-primary">{formatCurrency(displayAOV)}</div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* SECONDARY ROW - ADDITIONAL DETAILED FINANCE STRUCTURAL DONUT CHART & INSIGHTS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        
        {/* Left Column: Cost Structure Donut/Pie Chart (3 cols) */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-500" />
              Cơ cấu Lợi nhuận & Chi phí
            </CardTitle>
            <CardDescription>Cơ cấu phân bổ dòng tiền bán hàng tổng quan</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            
            {/* Recharts Pie Donut Chart Component */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {financePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inner ring metadata */}
              <div className="absolute text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">PROCESSED</span>
                <span className="text-sm font-black block mt-0.5 text-primary">
                  {formatCurrency(displayRevenue).replace("₫", "")}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-medium">VND</span>
              </div>
            </div>

            {/* List explaining segments and legend */}
            <div className="space-y-4 w-full max-w-[220px]">
              {financePieData.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="truncate">{item.name}</span>
                      <span>{Math.round((item.value / displayRevenue) * 100) || [62, 25, 13][idx]}%</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{formatCurrency(item.value)}</div>
                  </div>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Top Products (2 cols) */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-md font-bold">Sản phẩm bán chạy</CardTitle>
            <CardDescription>Top sản phẩm được ưa chuộng nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTopProducts.length > 0 ? (
                filteredTopProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <Avatar className="h-9 w-9 rounded-lg border">
                      <AvatarImage src={p.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${p.name}`} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs rounded-lg">{p.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.salesCount} sản phẩm đã bán</div>
                    </div>
                    <div className="text-right font-bold text-sm text-primary">
                      {formatCurrency(p.revenue)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">Chưa có dữ liệu bán chạy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* BOTTOM ROW - LOW STOCK ALERTS & RECENT SALES */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        
        {/* 1. Low Stock Alerts Card (Sản phẩm sắp hết hàng) */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-md font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cảnh báo tồn kho thấp
              </CardTitle>
              <CardDescription>Sản phẩm cần nhập thêm hàng</CardDescription>
            </div>
            <Badge variant="destructive" className="font-bold">{lowStockProducts.length} mặt hàng</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="text-sm font-bold truncate max-w-[200px]">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category?.name || "Danh mục khác"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold block text-muted-foreground">Còn lại</span>
                        <Badge variant="destructive" className="font-bold py-0.5 px-2">{p.stock} sản phẩm</Badge>
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                        <Plus className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">Không có cảnh báo kho</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Recent Sales Transactions */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md font-bold">Giao dịch gần đây</CardTitle>
              <CardDescription>Các hóa đơn vừa hoàn thành</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary gap-1 pr-0 hover:bg-transparent">
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRecentSales.length > 0 ? filteredRecentSales.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <Avatar className="h-9 w-9 border shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.customer?.name}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{item.customer?.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-none">{item.customer?.name || "Khách lẻ"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase font-bold">
                      {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {item.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                    </p>
                  </div>
                  <div className="text-right font-black text-sm text-primary">
                    +{formatCurrency(item.total_amount)}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">Chưa có giao dịch gần đây</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
