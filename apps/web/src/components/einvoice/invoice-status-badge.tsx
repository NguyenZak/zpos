"use client";

import React from "react";
import { Ban, CheckCircle2, Clock, Loader2, RefreshCw, XCircle, AlertCircle, Send, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/services/einvoice/types";

export const STATUS_META: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft:       { label: "Nháp",            className: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",       icon: <Clock className="h-3 w-3" /> },
  pending:     { label: "Đang xử lý",      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",   icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  issued:      { label: "Đã phát hành",    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  sent:        { label: "Đã gửi KH",       className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",       icon: <Send className="h-3 w-3" /> },
  sent_to_tax: { label: "Đã gửi CQT",      className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",           icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled:   { label: "Đã huỷ",          className: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",                           icon: <Ban className="h-3 w-3" /> },
  replaced:    { label: "Đã thay thế",     className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",icon: <RefreshCw className="h-3 w-3" /> },
  adjusted:    { label: "Đã điều chỉnh",   className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",icon: <RefreshCw className="h-3 w-3" /> },
  failed:      { label: "Lỗi",             className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",            icon: <XCircle className="h-3 w-3" /> },
  synced:      { label: "Đã đồng bộ",      className: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30",       icon: <Zap className="h-3 w-3" /> },
  unknown:     { label: "Không xác định",  className: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",                           icon: <AlertCircle className="h-3 w-3" /> },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = STATUS_META[status] || STATUS_META.unknown;
  return (
    <Badge variant="outline" className={`gap-1 font-bold text-xs ${meta.className}`}>
      {meta.icon}
      {meta.label}
    </Badge>
  );
}

export function formatVND(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);
}

export function formatTime(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("vi-VN", { hour12: false });
}
