"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  CalendarDays,
  ChevronRight,
  Store,
  Bell,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  Download,
  BarChart3,
  LineChart as LineIcon,
  Percent,
  Coins,
  Wallet,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Bar,
  BarChart,
  Line,
  LineChart,
  Tooltip
} from "recharts";
import { cn } from "@/lib/utils";

interface MobileDashboardProps {
  stats: any;
  recentSales: any[];
  lowStockProducts?: any[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  tenantName?: string;
  timeRange: string;
  setTimeRange: (range: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  displayRevenue: number;
  displayOrders: number;
  displayCustomers: number;
  displayAOV: number;
  displayNetProfit: number;
  displayCOGS: number;
  displayExpenses: number;
  displayDebtInvoiceCount?: number;
  displayDebtOutstandingAmount?: number;
  displayDebtSettledAmount?: number;
  financePieData: any[];
  dynamicRevenueData: any[];
  dynamicComparisonData: any[];
  dynamicHourlySalesList: any[];
  dynamicCategorySalesData: any[];
  filteredTopProducts: any[];
  cashPercent: number;
  bankPercent: number;
  cardPercent: number;
  goal: any;
  goalProgress: number;
  goalDialogOpen: boolean;
  setGoalDialogOpen: (open: boolean) => void;
  newTarget: string;
  setNewTarget: (target: string) => void;
  handleUpdateGoal: () => void;
  handleExportReport: () => void;
}

export function MobileDashboard({
  stats,
  recentSales,
  lowStockProducts = [],
  loading = false,
  onRefresh,
  tenantName = "ZPOS",
  timeRange,
  setTimeRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  displayRevenue,
  displayOrders,
  displayCustomers,
  displayAOV,
  displayNetProfit,
  displayCOGS,
  displayExpenses,
  displayDebtInvoiceCount = 0,
  displayDebtOutstandingAmount = 0,
  displayDebtSettledAmount = 0,
  financePieData,
  dynamicRevenueData,
  dynamicComparisonData,
  dynamicHourlySalesList,
  dynamicCategorySalesData,
  filteredTopProducts,
  cashPercent,
  bankPercent,
  cardPercent,
  goal,
  goalProgress,
  goalDialogOpen,
  setGoalDialogOpen,
  newTarget,
  setNewTarget,
  handleUpdateGoal,
  handleExportReport
}: MobileDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyValue = (val: string) => {
    if (!val) return "";
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const parseCurrencyValue = (val: string) => {
    return val.replace(/\./g, "").replace(/,/g, "");
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300 px-1">
      
      {/* MOBILE HEADER & REFRESH ACTION */}
      <div className="flex items-center justify-between border-b pb-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-black shadow-md">
            ZP
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-foreground truncate max-w-[140px]">Xin chào, {tenantName}</h1>
              <Badge variant="secondary" className="text-[9px] h-4.5 px-1 py-0 border-none font-bold uppercase tracking-wider bg-primary/10 text-primary">PRO</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <Store className="w-3 h-3 text-primary" />
              Chi nhánh chính
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            className="w-9 h-9 bg-card border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className={cn("w-4 h-4", (refreshing || loading) && "animate-spin text-primary")} />
          </button>
          <button className="w-9 h-9 bg-card border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-xs relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background" />
          </button>
        </div>
      </div>

      {/* TIMEFRAME SELECTOR FOR MOBILE */}
      <div className="space-y-3 bg-muted/40 p-3.5 rounded-xl border border-muted/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            Bộ lọc thời gian
          </span>
          {timeRange === "custom" && (
            <Badge variant="outline" className="text-[9px] font-bold bg-background text-primary border-primary/25">Tự chọn ngày</Badge>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: "today", label: "Hôm nay" },
            { id: "7days", label: "7 ngày" },
            { id: "30days", label: "Tháng này" },
            { id: "custom", label: "Tùy chọn" }
          ].map((tab) => {
            const isSelected = timeRange === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={cn(
                  "py-2 px-1 text-center rounded-lg text-[10px] font-bold transition-all border active:scale-95 cursor-pointer",
                  isSelected 
                    ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                    : "bg-background border-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Custom Date Picker for Mobile */}
        {timeRange === "custom" && (
          <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-muted animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Từ ngày</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="h-8.5 text-[11px] font-semibold px-2 py-1 bg-background border-muted"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Đến ngày</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="h-8.5 text-[11px] font-semibold px-2 py-1 bg-background border-muted"
              />
            </div>
          </div>
        )}

        {/* Global Export Report Button */}
        <div className="flex gap-2.5 pt-1.5">
          <Button 
            onClick={handleExportReport}
            variant="outline" 
            size="sm" 
            className="w-full h-9 text-[10px] font-bold gap-1.5 shadow-sm bg-background border-muted hover:bg-muted"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất file báo cáo tài chính (.csv)
          </Button>
        </div>
      </div>

      {/* SALES TARGET & MONTHLY GOAL CARD */}
      <Card className="border border-muted/50 rounded-xl overflow-hidden shadow-xs bg-card relative">
        <CardContent className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Mục tiêu kinh doanh</h4>
                <p className="text-[9px] text-muted-foreground font-semibold">Doanh thu tháng {new Date().getMonth() + 1}</p>
              </div>
            </div>
            
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold border hover:bg-muted py-0.5 px-2">
                  {goal ? "Sửa" : "Thiết lập"}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[92vw] max-w-[400px] rounded-2xl p-5">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Cài đặt mục tiêu tháng {new Date().getMonth() + 1}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Thiết lập mục tiêu doanh thu để theo dõi hiệu quả kinh doanh của bạn trên di động.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile-target" className="text-[10px] font-bold text-muted-foreground uppercase">Mục tiêu doanh thu (₫)</Label>
                    <Input
                      id="mobile-target"
                      type="text"
                      placeholder="Ví dụ: 500,000,000"
                      value={formatCurrencyValue(newTarget)}
                      onChange={(e) => setNewTarget(parseCurrencyValue(e.target.value))}
                      className="text-xs h-9.5"
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-row gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setGoalDialogOpen(false)} className="text-xs h-9 py-1 px-3">
                    Hủy bỏ
                  </Button>
                  <Button type="button" onClick={handleUpdateGoal} className="text-xs h-9 font-bold py-1 px-4">
                    Lưu mục tiêu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <span className="text-xs text-muted-foreground font-semibold">Hoàn thành:</span>
              <span className="text-sm font-black text-primary">{goal ? `${Math.round(goalProgress)}%` : "Chưa thiết lập"}</span>
            </div>
            <Progress value={goal ? goalProgress : 0} className="h-2 bg-muted indicator-primary shadow-xs" indicatorClassName="bg-primary animate-pulse" />
            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold pt-0.5">
              <span>Hiện tại: {formatCurrency(displayRevenue)}</span>
              <span>Mục tiêu: {goal ? formatCurrency(goal.target_value) : "Chưa có"}</span>
            </div>
          </div>
        </CardContent>
        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
      </Card>

      {/* METRICS DOUBLE-GRID WIDGET */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Total Revenue Card */}
        <Card className="border border-muted/50 rounded-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-sm">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-primary-foreground/75 leading-none">Thực nhận</span>
              <div className="p-1.5 bg-primary-foreground/10 text-primary-foreground rounded-lg">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight leading-none">{formatCurrency(displayRevenue)}</h3>
              <div className="flex items-center gap-0.5 text-[9px] font-semibold text-primary-foreground/90">
                <ArrowUpRight className="w-3 h-3" />
                <span>{stats?.revenueChange || "+12.5%"} trong kỳ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card className="border border-muted/50 rounded-xl bg-card shadow-sm">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-muted-foreground leading-none">Lợi nhuận ròng</span>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-500 leading-none">{formatCurrency(displayNetProfit)}</h3>
              <div className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>Tỉ lệ ròng: {displayRevenue > 0 ? Math.round((displayNetProfit / displayRevenue) * 100) : 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders Card */}
        <Card className="border border-muted/50 rounded-xl bg-card shadow-sm">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-muted-foreground leading-none">Tổng đơn hàng</span>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight text-foreground leading-none">+{displayOrders} đơn</h3>
              <div className="flex items-center gap-0.5 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>{stats?.ordersChange || "+8%"} tăng trưởng</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debt Invoices Card */}
        <Card className="border border-muted/50 rounded-xl bg-card shadow-sm">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-muted-foreground leading-none">Hoá đơn nợ</span>
              <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight text-amber-600 dark:text-amber-500 leading-none">{displayDebtInvoiceCount} đơn</h3>
              <div className="text-[9px] font-semibold text-muted-foreground leading-tight">
                Còn nợ {formatCurrency(displayDebtOutstandingAmount)}
              </div>
              <div className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 leading-tight">
                Đã thu {formatCurrency(displayDebtSettledAmount)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Base Card */}
        <Card className="border border-muted/50 rounded-xl bg-card shadow-sm">
          <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-widest uppercase text-muted-foreground leading-none">Khách hàng mới</span>
              <div className="p-1.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight text-foreground leading-none">{displayCustomers} khách</h3>
              <div className="flex items-center gap-0.5 text-[9px] font-semibold text-pink-600 dark:text-pink-400">
                <ArrowUpRight className="w-3 h-3" />
                <span>Đăng ký mới</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ADVANCED CHARTS ANALYTICS HUB FOR MOBILE */}
      <Card className="border border-muted/50 rounded-xl overflow-hidden shadow-xs bg-card">
        <Tabs defaultValue="revenue" className="w-full">
          <CardHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4.5 h-4.5 text-primary" />
                <CardTitle className="text-xs font-bold uppercase tracking-wide">Đồ thị phân tích</CardTitle>
              </div>
              <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary animate-pulse" />
                Live
              </span>
            </div>
            <CardDescription className="text-[10px] text-muted-foreground">Chọn biểu đồ thống kê kinh doanh</CardDescription>

            <TabsList className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg mt-3 h-8.5">
              <TabsTrigger value="revenue" className="text-[9.5px] font-bold py-1 px-2.5 flex gap-1 items-center justify-center">
                <LineIcon className="w-3 h-3" />
                Thực nhận
              </TabsTrigger>
              <TabsTrigger value="comparison" className="text-[9.5px] font-bold py-1 px-2.5 flex gap-1 items-center justify-center">
                <TrendingUp className="w-3 h-3" />
                So sánh
              </TabsTrigger>
              <TabsTrigger value="hourly" className="text-[9.5px] font-bold py-1 px-2.5 flex gap-1 items-center justify-center">
                <Clock className="w-3 h-3" />
                Khung giờ
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-3 pt-4">
            {/* 1. Dynamic Revenue Chart */}
            <TabsContent value="revenue" className="outline-none focus:outline-none">
              {dynamicRevenueData && dynamicRevenueData.length > 0 ? (
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicRevenueData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#888888" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: "#888888" }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "10px" }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), "Doanh thu thực nhận"]}
                      />
                      <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 text-[10px] text-muted-foreground">Không có dữ liệu doanh thu đồ thị.</div>
              )}
            </TabsContent>

            {/* 2. Range Comparison Chart */}
            <TabsContent value="comparison" className="outline-none focus:outline-none">
              {dynamicComparisonData && dynamicComparisonData.length > 0 ? (
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicComparisonData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#888888" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: "#888888" }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "10px" }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                      />
                      <Bar dataKey="currentWeek" name="Kỳ này" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lastWeek" name="Kỳ trước" fill="rgba(148, 163, 184, 0.4)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 text-[10px] text-muted-foreground">Không có dữ liệu so sánh đồ thị.</div>
              )}
            </TabsContent>

            {/* 3. Hourly Sales Distribution */}
            <TabsContent value="hourly" className="outline-none focus:outline-none">
              {dynamicHourlySalesList && dynamicHourlySalesList.length > 0 ? (
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicHourlySalesList} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#888888" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: "#888888" }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "10px" }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), "Doanh thu thực nhận"]}
                      />
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 text-[10px] text-muted-foreground">Không có dữ liệu phân bổ khung giờ.</div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* FINANCE RATIO COST BREAKDOWN (PIE CHART METERS) */}
      <Card className="border border-muted/50 rounded-xl bg-card shadow-xs">
        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-xs font-bold uppercase tracking-wider">Phân bổ chi phí & Biên lợi nhuận</CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">Cơ cấu dòng tiền chi tiết</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          
          {/* Net profit, COGS, and Expenses bar chart representation */}
          <div className="space-y-3.5">
            {[
              { name: "Lợi nhuận ròng", amount: displayNetProfit, pct: displayRevenue > 0 ? (displayNetProfit / displayRevenue) * 100 : 45, color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
              { name: "Giá vốn hàng bán (COGS)", amount: displayCOGS, pct: displayRevenue > 0 ? (displayCOGS / displayRevenue) * 100 : 35, color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
              { name: "Chi phí vận hành", amount: displayExpenses, pct: displayRevenue > 0 ? (displayExpenses / displayRevenue) * 100 : 20, color: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
            ].map((finance) => (
              <div key={finance.name} className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-foreground">{finance.name}</span>
                  <span className={cn(finance.text)}>{formatCurrency(finance.amount)} ({Math.round(finance.pct)}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-2xs">
                  <div className={cn("h-full rounded-full", finance.color)} style={{ width: `${Math.max(5, Math.min(100, finance.pct))}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/40 p-3 rounded-lg border border-muted/50 flex justify-around text-center gap-1.5">
            <div className="space-y-0.5 flex-1 border-r border-muted last:border-none">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Biên ròng</p>
              <p className="text-xs font-black text-emerald-600">~{displayRevenue > 0 ? Math.round((displayNetProfit / displayRevenue) * 100) : 45}%</p>
            </div>
            <div className="space-y-0.5 flex-1 border-r border-muted last:border-none">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Giá vốn</p>
              <p className="text-xs font-black text-amber-600">~{displayRevenue > 0 ? Math.round((displayCOGS / displayRevenue) * 100) : 35}%</p>
            </div>
            <div className="space-y-0.5 flex-1 last:border-none">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Chi phí</p>
              <p className="text-xs font-black text-rose-600">~{displayRevenue > 0 ? Math.round((displayExpenses / displayRevenue) * 100) : 20}%</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* PAYMENT METHODS SPLIT */}
      <Card className="border border-muted/50 rounded-xl bg-card shadow-xs">
        <CardHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-primary" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider">Phương thức thanh toán</CardTitle>
          </div>
          <CardDescription className="text-[10px] text-muted-foreground">Tỷ trọng các kênh giao dịch</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3.5">
          <div className="flex h-6.5 rounded-xl overflow-hidden shadow-xs border bg-muted">
            {cashPercent > 0 && <div className="bg-emerald-500 flex items-center justify-center text-[9px] font-extrabold text-white transition-all" style={{ width: `${cashPercent}%` }} title={`Tiền mặt: ${cashPercent}%`}>{cashPercent}%</div>}
            {bankPercent > 0 && <div className="bg-indigo-500 flex items-center justify-center text-[9px] font-extrabold text-white transition-all" style={{ width: `${bankPercent}%` }} title={`Chuyển khoản: ${bankPercent}%`}>{bankPercent}%</div>}
            {cardPercent > 0 && <div className="bg-amber-500 flex items-center justify-center text-[9px] font-extrabold text-white transition-all" style={{ width: `${cardPercent}%` }} title={`Thẻ ATM: ${cardPercent}%`}>{cardPercent}%</div>}
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Tiền mặt</span>
              </div>
              <p className="text-xs font-black text-foreground">{cashPercent}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">C.Khoản</span>
              </div>
              <p className="text-xs font-black text-foreground">{bankPercent}%</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Thẻ ATM</span>
              </div>
              <p className="text-xs font-black text-foreground">{cardPercent}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LEADERBOARDS: TOP PRODUCTS & HIGHEST CATEGORIES */}
      <div className="space-y-4">
        {/* Categories breakdown */}
        <Card className="border border-muted/50 rounded-xl bg-card shadow-xs">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider">Top nhóm sản phẩm</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">Theo tỷ trọng doanh thu</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {dynamicCategorySalesData && dynamicCategorySalesData.length > 0 ? (
              dynamicCategorySalesData.slice(0, 5).map((cat: any) => {
                const totalRev = displayRevenue || 1;
                const ratio = Math.min(100, Math.round((cat.value / totalRev) * 100)) || 12;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-foreground">{cat.name}</span>
                      <span className="text-primary">{formatCurrency(cat.value)} ({ratio}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-md overflow-hidden">
                      <div className="h-full bg-primary rounded-md" style={{ width: `${ratio}%`, opacity: cat.opacity || 1.0 }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-5 text-[10px] text-muted-foreground">Không có dữ liệu nhóm sản phẩm.</div>
            )}
          </CardContent>
        </Card>

        {/* Top selling products leaderboard */}
        <Card className="border border-muted/50 rounded-xl bg-card shadow-xs">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider">Sản phẩm bán chạy nhất</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">Bảng xếp hạng hiệu suất</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            {filteredTopProducts && filteredTopProducts.length > 0 ? (
              <div className="divide-y divide-muted/40">
                {filteredTopProducts.slice(0, 5).map((prod, idx) => (
                  <div key={prod.name} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6.5 h-6.5 bg-primary/10 text-primary font-bold rounded-lg flex items-center justify-center text-[10px] shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate max-w-[170px]">{prod.name}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold">Đã bán {prod.salesCount} sản phẩm</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-primary">{formatCurrency(prod.revenue)}</p>
                      <Badge variant="outline" className="text-[8px] font-bold h-4 px-1 py-0 border-primary/20 text-primary">Tăng trưởng</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-[10px] text-muted-foreground">Không có dữ liệu mặt hàng bán chạy.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WARNING DEFICIT CRITICAL STOCK WARNING PANEL */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card className="border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/10 rounded-xl shadow-xs">
          <CardContent className="p-4 flex gap-3 items-start">
            <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Cảnh báo tồn kho sắp hết!</h4>
              <p className="text-[10px] text-amber-700 dark:text-amber-400/90 leading-relaxed font-semibold">
                Có {lowStockProducts.length} sản phẩm sắp hết hàng (dưới 5 sản phẩm). Bạn nên bổ sung sớm.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {lowStockProducts.slice(0, 4).map((prod) => (
                  <Badge 
                    key={prod.id} 
                    variant="outline" 
                    className="text-[8.5px] bg-background border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md truncate max-w-[130px]"
                  >
                    {prod.name}: Tồn {prod.stock ?? 0}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RECENT DETAILED TRANSACTIONS LIST */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
            Nhật ký giao dịch gần đây
          </p>
          <Badge variant="secondary" className="text-[9px] font-bold bg-muted text-muted-foreground border-none">Thời gian thực</Badge>
        </div>

        <div className="space-y-2.5">
          {recentSales && recentSales.length > 0 ? (
            recentSales.slice(0, 5).map((sale) => {
              const customerName = sale.customer?.name || "Khách vãng lai";
              const customerInitials = customerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              
              const method = sale.payment_method || "cash";
              const methodLabels: Record<string, string> = {
                cash: "Tiền mặt",
                transfer: "C.Khoản",
                bank: "C.Khoản",
                bank_transfer: "C.Khoản",
                card: "Thẻ ATM"
              };

              return (
                <Card 
                  key={sale.id} 
                  className="border border-muted/50 rounded-xl active:scale-[0.99] transition-all bg-card shadow-xs hover:border-primary/25"
                >
                  <CardContent className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-9.5 w-9.5 border border-muted bg-muted flex items-center justify-center shrink-0">
                        {sale.customer?.avatar_url && sale.customer.avatar_url !== "" ? (
                          <AvatarImage src={sale.customer.avatar_url} />
                        ) : (
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">{customerInitials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{customerName}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8.5px] text-muted-foreground font-mono font-semibold">{sale.order_number}</span>
                          <span className="text-[8.5px] text-muted-foreground">•</span>
                          <span className="text-[8.5px] text-muted-foreground font-semibold">{methodLabels[method] || "Tiền mặt"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-black text-primary">
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[8.5px] h-4.5 px-1 py-0 font-bold uppercase",
                          sale.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none",
                          sale.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none"
                        )}
                      >
                        {sale.status === "completed" ? "Thành công" : "Chờ"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 bg-card border border-dashed rounded-xl">
              <p className="text-xs text-muted-foreground font-semibold">Chưa phát sinh giao dịch trong kỳ.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
