"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CalendarDays,
  Download,
  Landmark,
  Receipt,
  Wallet,
  PieChart,
  Activity
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
} from "recharts";
import { posService } from '@/services/pos.service';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";

const cashflowData = [
  { name: 'T2', income: 4000, expense: 2400 },
  { name: 'T3', income: 3000, expense: 1398 },
  { name: 'T4', income: 5000, expense: 3800 },
  { name: 'T5', income: 2780, expense: 3908 },
  { name: 'T6', income: 4890, expense: 4800 },
  { name: 'T7', income: 6390, expense: 3800 },
  { name: 'CN', income: 5490, expense: 4300 },
];

const chartConfig = {
  income: {
    label: "Thu nhập",
    color: "hsl(var(--primary))",
  },
  expense: {
    label: "Chi phí",
    color: "hsl(var(--destructive))",
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function FinanceOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await posService.getFinanceOverview();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Tài chính & Dòng tiền</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Dữ liệu tài chính tính đến hôm nay, {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Báo cáo P&L
          </Button>
          <Button size="sm">Cấu hình định kỳ</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Doanh thu thuần</CardTitle>
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="flex items-center mt-1 text-xs font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>{stats?.revenueChange} so với tháng trước</span>
            </div>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-foreground/5 rounded-full blur-2xl" />
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Giá vốn hàng bán (COGS)</CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCOGS || 0)}</div>
            <div className="flex items-center mt-1 text-xs font-medium text-amber-600">
              <Activity className="w-3 h-3 mr-1" />
              <span>Tỷ lệ: {Math.round(((stats?.totalCOGS || 0) / (stats?.totalRevenue || 1)) * 100)}% doanh thu</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chi phí vận hành</CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats?.totalExpenses || 0)}</div>
            <div className="flex items-center mt-1 text-xs font-medium text-red-600">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>{stats?.expenseChange} tăng nhẹ</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Lợi nhuận ròng</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats?.netProfit || 0)}</div>
            <div className="flex items-center mt-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              <span>{stats?.profitChange} hiệu quả cao</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Xu hướng dòng tiền</CardTitle>
              <CardDescription>So sánh thu nhập và chi phí hàng ngày</CardDescription>
            </div>
            <Badge variant="outline" className="font-bold">7 Ngày qua</Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value/1000}M`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="var(--color-income)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--color-expense)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader>
            <CardTitle>Cơ cấu chi phí</CardTitle>
            <CardDescription>Các khoản chi lớn nhất tháng này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Nhập hàng (COGS)</span>
                <span className="text-muted-foreground font-bold">60%</span>
              </div>
              <Progress value={60} className="h-2" indicatorClassName="bg-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Lương nhân viên</span>
                <span className="text-muted-foreground font-bold">20%</span>
              </div>
              <Progress value={20} className="h-2" indicatorClassName="bg-amber-500" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Mặt bằng & Điện nước</span>
                <span className="text-muted-foreground font-bold">12%</span>
              </div>
              <Progress value={12} className="h-2" indicatorClassName="bg-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Marketing</span>
                <span className="text-muted-foreground font-bold">5%</span>
              </div>
              <Progress value={5} className="h-2" indicatorClassName="bg-emerald-500" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Khác</span>
                <span className="text-muted-foreground font-bold">3%</span>
              </div>
              <Progress value={3} className="h-2" indicatorClassName="bg-slate-400" />
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full gap-2 text-primary font-bold border-primary/20 bg-primary/5">
                <PieChart className="w-4 h-4" />
                Chi tiết Báo cáo Lợi nhuận
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
