"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CircleAlert, Clock3, Coins, Users } from "lucide-react";
import type { DashboardStats } from "@/services/debt.service";

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

export function DebtKPIStrip({ stats, loading }: { stats: DashboardStats | null; loading?: boolean }) {
  const items = [
    {
      label: "Tổng phải thu",
      value: formatVND(stats?.totalReceivable ?? 0),
      icon: Coins,
      tone: "text-primary",
      bg: "bg-primary/5 border-primary/10",
    },
    {
      label: "Sắp đến hạn (≤7 ngày)",
      value: formatVND(stats?.dueWithin7Days ?? 0),
      icon: Clock3,
      tone: "text-amber-600",
      bg: "bg-amber-500/5 border-amber-500/10",
    },
    {
      label: "Đã quá hạn",
      value: formatVND(stats?.overdue ?? 0),
      icon: CircleAlert,
      tone: "text-red-600",
      bg: "bg-red-500/5 border-red-500/10",
    },
    {
      label: "Số khách đang nợ",
      value: String(stats?.debtorCount ?? 0),
      icon: Users,
      tone: "text-violet-600",
      bg: "bg-violet-500/5 border-violet-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className={`border ${it.bg}`}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{it.label}</p>
                <p className={`text-2xl font-black mt-1 ${it.tone}`}>{loading ? "—" : it.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-background/60 ${it.tone}`}>
                <Icon className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
