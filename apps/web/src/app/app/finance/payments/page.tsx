"use client";

import React from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Filter,
  Hand,
  Link2,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PaymentTransaction, vietQRService } from "@/services/vietqr.service";

const STATUS_META: Record<PaymentTransaction["status"], { label: string; className: string; icon: React.ReactNode }> = {
  matched: {
    label: "Khớp đơn",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  manual: {
    label: "Xác nhận tay",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    icon: <Hand className="h-3 w-3" />,
  },
  unmatched: {
    label: "Chưa khớp",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  duplicate: {
    label: "Trùng",
    className: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  ignored: {
    label: "Bỏ qua",
    className: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    label: "Lỗi",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function formatVND(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v || 0);
}

function formatTime(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", { hour12: false });
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PaymentTransaction["status"] | "all">("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await vietQRService.listTransactions({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 200,
      });
      setTransactions(rows);
    } catch (e: any) {
      toast.error(`Không tải được lịch sử: ${e?.message || "Lỗi"}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.reference_code?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.counterparty_name?.toLowerCase().includes(q) ||
        t.counterparty_account?.toLowerCase().includes(q) ||
        t.external_id?.toLowerCase().includes(q),
    );
  }, [transactions, query]);

  const stats = React.useMemo(() => {
    const sumMatched = transactions
      .filter((t) => t.status === "matched" || t.status === "manual")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const sumUnmatched = transactions
      .filter((t) => t.status === "unmatched")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const matchedCount = transactions.filter((t) => t.status === "matched" || t.status === "manual").length;
    const unmatchedCount = transactions.filter((t) => t.status === "unmatched").length;
    return { sumMatched, sumUnmatched, matchedCount, unmatchedCount };
  }, [transactions]);

  function exportCSV() {
    const headers = [
      "Thời gian",
      "Mã GD",
      "Số tiền",
      "Nội dung",
      "Người chuyển",
      "STK đối ứng",
      "Mã đơn",
      "Trạng thái",
      "Provider",
    ];
    const rows = filtered.map((t) => [
      formatTime(t.received_at),
      t.external_id || "",
      String(t.amount),
      t.description || "",
      t.counterparty_name || "",
      t.counterparty_account || "",
      t.reference_code || "",
      STATUS_META[t.status]?.label || t.status,
      t.provider,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-violet-600" />
            Giao dịch VietQR
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi tất cả biến động số dư nhận về qua webhook ngân hàng & đối soát thủ công với đơn hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Làm mới
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã khớp đơn</CardDescription>
            <CardTitle className="text-2xl">{formatVND(stats.sumMatched)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 font-bold">{stats.matchedCount} giao dịch</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chưa khớp</CardDescription>
            <CardTitle className="text-2xl">{formatVND(stats.sumUnmatched)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-600 font-bold">
            {stats.unmatchedCount} giao dịch — cần đối soát
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng giao dịch</CardDescription>
            <CardTitle className="text-2xl">{transactions.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Trong 200 GD gần nhất</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tỷ lệ khớp tự động</CardDescription>
            <CardTitle className="text-2xl">
              {transactions.length === 0 ? "—" : Math.round((stats.matchedCount / transactions.length) * 100) + "%"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Khớp qua mã CK</CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã CK, số tiền, người chuyển..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="matched">Đã khớp đơn</option>
                <option value="manual">Xác nhận thủ công</option>
                <option value="unmatched">Chưa khớp</option>
                <option value="duplicate">Trùng</option>
                <option value="failed">Lỗi</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <QrCode className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold">Chưa có giao dịch</p>
              <p className="text-sm text-muted-foreground">
                Khi khách chuyển khoản, biến động số dư sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Mã CK</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Người chuyển</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const meta = STATUS_META[t.status] || STATUS_META.failed;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{formatTime(t.received_at)}</TableCell>
                      <TableCell className="font-mono text-xs font-bold text-violet-700 dark:text-violet-400">
                        {t.reference_code || "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {t.transfer_type === "out" ? "-" : "+"}
                        {formatVND(Number(t.amount))}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-bold">{t.counterparty_name || "—"}</div>
                        <div className="text-muted-foreground font-mono">{t.counterparty_account || ""}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{t.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 font-bold ${meta.className}`}>
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs uppercase font-bold text-muted-foreground">{t.provider}</TableCell>
                      <TableCell>
                        {t.order_id ? (
                          <a
                            href={`/orders/${t.order_id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:underline"
                          >
                            <Link2 className="h-3 w-3" />
                            Xem đơn
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
