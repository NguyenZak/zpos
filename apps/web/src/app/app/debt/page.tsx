"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, ChevronRight, ListChecks, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { debtService, type AgingBucket, type CreditAccount, type DashboardStats } from "@/services/debt.service";
import { DebtKPIStrip } from "./_components/debt-kpi-strip";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

export default function DebtDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topDebtors, setTopDebtors] = useState<CreditAccount[]>([]);
  const [aging, setAging] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, d, a] = await Promise.all([
        debtService.getDashboardStats().catch((e) => {
          console.error("Load stats failed:", e);
          return null;
        }),
        debtService.listDebtors({ limit: 5 }).catch(() => []),
        debtService.getAgingReport().catch(() => []),
      ]);
      setStats(s);
      setTopDebtors(d || []);
      setAging(a || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefreshOverdue = async () => {
    setRefreshing(true);
    try {
      const updated = await debtService.refreshOverdue();
      toast.success(`Đã cập nhật ${updated} đơn quá hạn`);
      load();
    } catch (e: any) {
      toast.error("Không thể refresh quá hạn", { description: e?.message });
    } finally {
      setRefreshing(false);
    }
  };

  const agingTotals = aging.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      d0_30: acc.d0_30 + r.d0_30,
      d31_60: acc.d31_60 + r.d31_60,
      d61_90: acc.d61_90 + r.d61_90,
      d90plus: acc.d90plus + r.d90plus,
    }),
    { current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 },
  );
  const agingTotal =
    agingTotals.current + agingTotals.d0_30 + agingTotals.d31_60 + agingTotals.d61_90 + agingTotals.d90plus;

  const agingBars = [
    { label: "Trong hạn", value: agingTotals.current, color: "bg-zinc-400" },
    { label: "0–30 ngày", value: agingTotals.d0_30, color: "bg-amber-400" },
    { label: "31–60 ngày", value: agingTotals.d31_60, color: "bg-amber-500" },
    { label: "61–90 ngày", value: agingTotals.d61_90, color: "bg-orange-500" },
    { label: "90+ ngày", value: agingTotals.d90plus, color: "bg-red-500" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Công nợ</h1>
          <p className="text-muted-foreground text-sm">Theo dõi khoản phải thu, nhắc nợ và báo cáo aging.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshOverdue} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Cập nhật quá hạn
          </Button>
          <Button asChild size="sm">
            <Link href="/debt/debtors">
              <ListChecks className="w-4 h-4" /> Danh sách khách nợ
            </Link>
          </Button>
        </div>
      </div>

      <DebtKPIStrip stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Top khách nợ</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/debt/debtors">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground italic">Đang tải...</p>
            ) : topDebtors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">Chưa có khách hàng nào nợ.</p>
            ) : (
              <ul className="divide-y">
                {topDebtors.map((d) => (
                  <li key={d.id} className="py-2 flex items-center justify-between gap-3">
                    <Link href={`/debt/customers/${d.customer_id}`} className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate hover:underline">
                        {d.customer?.name || `Khách #${d.customer_id.slice(0, 8)}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{d.customer?.phone || "—"}</p>
                    </Link>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">{fmt(Number(d.current_balance))}</p>
                      {Number(d.overdue_amount) > 0 && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1 mt-0.5">
                          Quá hạn {fmt(Number(d.overdue_amount))}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Phân bổ aging</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/debt/aging">
                Báo cáo chi tiết <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground italic">Đang tải...</p>
            ) : agingTotal === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-6">Chưa có dữ liệu công nợ.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {agingBars.map((b) =>
                    b.value > 0 ? (
                      <div
                        key={b.label}
                        className={b.color}
                        style={{ width: `${(b.value / agingTotal) * 100}%` }}
                        title={`${b.label}: ${fmt(b.value)}`}
                      />
                    ) : null,
                  )}
                </div>
                <ul className="space-y-1.5 text-xs">
                  {agingBars.map((b) => (
                    <li key={b.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${b.color}`} />
                        {b.label}
                      </span>
                      <span className="font-bold">{fmt(b.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="w-4 h-4" /> Hành động nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <Link href="/debt/debtors?filter=overdue">
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-sm">Khách quá hạn</span>
                <span className="text-[10px] text-muted-foreground">Lọc nhanh và gửi nhắc nợ</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <Link href="/debt/aging">
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-sm">Báo cáo aging</span>
                <span className="text-[10px] text-muted-foreground">Phân tích theo 5 buckets thời gian</span>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-3 justify-start" asChild>
            <Link href="/settings?tab=debt">
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-sm">Cài đặt công nợ</span>
                <span className="text-[10px] text-muted-foreground">Hạn mức, ngày tới hạn, nhắc nợ tự động</span>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
