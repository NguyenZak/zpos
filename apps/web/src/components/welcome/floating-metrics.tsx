"use client";

import { Package, ReceiptText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type FloatingMetricsProps = {
  metrics?: {
    revenueToday?: number;
    ordersToday?: number;
    lowStockCount?: number;
  };
};

function compactCurrency(value?: number) {
  if (!value) return "0đ";
  if (value >= 1000000) return `${Math.round(value / 100000) / 10}tr`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return `${value}đ`;
}

export function FloatingMetrics({ metrics }: FloatingMetricsProps) {
  const items = [
    {
      label: "Doanh thu hôm nay",
      value: compactCurrency(metrics?.revenueToday),
      icon: TrendingUp,
    },
    {
      label: "Đơn hàng hôm nay",
      value: String(metrics?.ordersToday ?? 0),
      icon: ReceiptText,
    },
    {
      label: "Sắp hết hàng",
      value: String(metrics?.lowStockCount ?? 0),
      icon: Package,
    },
  ];

  return (
    <div className="mx-auto mt-8 hidden w-full max-w-3xl grid-cols-3 gap-3 sm:grid">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.06, duration: 0.32 }}
            className="rounded-2xl border border-white/60 bg-white/64 p-4 text-left shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/45"
          >
            <Icon className="h-4 w-4 text-violet-600" />
            <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{item.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
