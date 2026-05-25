"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Download, Loader2, Calendar, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { posService } from "@/services/pos.service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProfitLossPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await posService.getProfitLossReport();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const grossProfit = (stats?.totalRevenue || 0) - (stats?.totalCOGS || 0);
  const grossMargin = stats?.totalRevenue ? (grossProfit / stats.totalRevenue) * 100 : 0;
  const netMargin = stats?.totalRevenue ? (stats.netProfit / stats.totalRevenue) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-primary" />
            Báo cáo Lợi nhuận & Lỗ (P&L)
          </h1>
          <p className="text-muted-foreground text-sm">Phân tích chi tiết hiệu quả kinh doanh và khả năng sinh lời.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Quý này
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Bảng báo cáo kết quả kinh doanh</CardTitle>
              <CardDescription>Dữ liệu tổng hợp từ doanh thu, giá vốn và chi phí</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-1">
                {/* DOANH THU */}
                <div className="flex justify-between items-center py-3 border-b border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">1. Tổng doanh thu bán hàng</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Tổng số tiền thu được từ tất cả các đơn hàng (trừ đơn hủy)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-black text-primary">{formatCurrency(stats?.totalRevenue || 0)}</span>
                </div>

                {/* GIÁ VỐN */}
                <div className="flex justify-between items-center py-3 border-b border-dashed">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">2. Giá vốn hàng bán (COGS)</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Tổng giá vốn của các sản phẩm đã bán</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-bold text-red-500">-{formatCurrency(stats?.totalCOGS || 0)}</span>
                </div>

                {/* LỢI NHUẬN GỘP */}
                <div className="flex justify-between items-center py-4 bg-primary/5 px-2 rounded-lg my-2">
                  <span className="font-black text-sm uppercase tracking-wider">3. Lợi nhuận gộp (1 - 2)</span>
                  <span className="font-black text-lg text-primary">{formatCurrency(grossProfit)}</span>
                </div>

                {/* CHI PHÍ VẬN HÀNH */}
                <div className="flex justify-between items-center py-3 border-b border-dashed">
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-sm font-medium text-muted-foreground">4.1 Chi phí vận hành cửa hàng</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">-{formatCurrency(stats?.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed">
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-sm font-medium text-muted-foreground">4.2 Chi phí lương & nhân sự</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">-{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dashed">
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-sm font-medium text-muted-foreground">4.3 Chi phí Marketing</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">-{formatCurrency(0)}</span>
                </div>

                {/* LỢI NHUẬN RÒNG */}
                <div className="flex justify-between items-center py-5 bg-emerald-600 text-white px-4 rounded-xl mt-6 shadow-lg shadow-emerald-600/20">
                  <span className="font-black text-base uppercase tracking-widest">Lợi nhuận ròng (Net Profit)</span>
                  <span className="font-black text-2xl">{formatCurrency(stats?.netProfit || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
                Chỉ số biên lợi nhuận
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>BIÊN LỢI NHUẬN GỘP</span>
                  <span className="text-primary">{grossMargin.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${grossMargin}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>BIÊN LỢI NHUẬN RÒNG</span>
                  <span className="text-emerald-600">{netMargin.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600" style={{ width: `${netMargin}%` }} />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Sức khỏe tài chính</p>
                    <p className="text-sm font-black">Rất tốt (Healthy)</p>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-primary/10 flex items-center gap-3">
                  <TrendingDown className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Điểm yếu</p>
                    <p className="text-sm font-black">Giá vốn còn cao</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
