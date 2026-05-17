"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
  icon: React.ElementType;
  className?: string;
  variant?: "primary" | "success" | "warning" | "info" | "default";
}

function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  className,
  variant = "default"
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-muted/50 shadow-sm rounded-2xl bg-card active:scale-[0.98] transition-all", className)}>
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
            {title}
          </span>
          <div className={cn(
            "p-2 rounded-xl",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            variant === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            variant === "info" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
            variant === "default" && "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight font-mono text-foreground leading-none">
            {value}
          </h3>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive shrink-0" />
            )}
            <span className={cn(
              "text-[10px] font-bold",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            )}>
              {change}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MobileMetricCardsProps {
  revenue?: number;
  orders?: number;
  aov?: number;
  customers?: number;
  revenueChange?: string;
  ordersChange?: string;
  aovChange?: string;
  customersChange?: string;
}

export function MobileMetricCards({
  revenue = 5400000,
  orders = 24,
  aov = 225000,
  customers = 18,
  revenueChange = "+12.5%",
  ordersChange = "+8%",
  aovChange = "+4.2%",
  customersChange = "+15%"
}: MobileMetricCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 gap-3.5">
      <MetricCard
        title="Doanh thu"
        value={formatCurrency(revenue)}
        change={revenueChange}
        icon={DollarSign}
        variant="primary"
      />
      <MetricCard
        title="Đơn hàng"
        value={`+${orders}`}
        change={ordersChange}
        icon={ShoppingCart}
        variant="success"
      />
      <MetricCard
        title="Giao dịch TB"
        value={formatCurrency(aov)}
        change={aovChange}
        icon={TrendingUp}
        variant="info"
      />
      <MetricCard
        title="Khách hàng"
        value={`${customers}`}
        change={customersChange}
        icon={Users}
        variant="warning"
      />
    </div>
  );
}
