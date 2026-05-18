"use client";

import React from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { einvoiceService, type Invoice, type InvoiceStatus } from "@/services/einvoice.service";

const STATUS_META: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: {
    label: "Nháp",
    className: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: "Đang xử lý",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  issued: {
    label: "Đã phát hành",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  sent: {
    label: "Đã gửi KH",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Đã huỷ",
    className: "bg-zinc-500/15 text-zinc-600 border-zinc-500/30",
    icon: <Ban className="h-3 w-3" />,
  },
  replaced: {
    label: "Đã thay thế",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    icon: <RefreshCw className="h-3 w-3" />,
  },
  adjusted: {
    label: "Đã điều chỉnh",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    icon: <RefreshCw className="h-3 w-3" />,
  },
  failed: {
    label: "Lỗi",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    icon: <XCircle className="h-3 w-3" />,
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | "all">("all");
  const [cancelTarget, setCancelTarget] = React.useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await einvoiceService.listInvoices({
        status: statusFilter,
        limit: 200,
      });
      setInvoices(rows);
    } catch (e: any) {
      toast.error(`Lỗi tải hoá đơn: ${e?.message || "Không rõ"}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (i) =>
        i.invoice_no?.toLowerCase().includes(q) ||
        i.buyer_name?.toLowerCase().includes(q) ||
        i.buyer_tax_code?.toLowerCase().includes(q) ||
        i.provider_lookup_code?.toLowerCase().includes(q),
    );
  }, [invoices, query]);

  const stats = React.useMemo(() => {
    const issued = invoices.filter((i) => i.status === "issued" || i.status === "sent");
    const issuedTotal = issued.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const issuedVat = issued.reduce((s, i) => s + Number(i.vat_amount || 0), 0);
    const failedCount = invoices.filter((i) => i.status === "failed").length;
    const cancelledCount = invoices.filter((i) => i.status === "cancelled").length;
    return {
      issuedCount: issued.length,
      issuedTotal,
      issuedVat,
      failedCount,
      cancelledCount,
    };
  }, [invoices]);

  function exportCSV() {
    const headers = [
      "Ngày phát hành",
      "Số HĐ",
      "Ký hiệu",
      "Mẫu số",
      "Khách hàng",
      "MST",
      "Tạm tính",
      "Thuế",
      "Tổng tiền",
      "Trạng thái",
      "Provider",
      "Mã tra cứu",
    ];
    const rows = filtered.map((i) => [
      formatTime(i.invoice_date || i.created_at),
      i.invoice_no || "",
      i.invoice_series || "",
      i.invoice_template_code || "",
      i.buyer_name || "",
      i.buyer_tax_code || "",
      String(i.subtotal),
      String(i.vat_amount),
      String(i.total_amount),
      STATUS_META[i.status]?.label || i.status,
      i.provider,
      i.provider_lookup_code || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do huỷ");
      return;
    }
    setCancelling(true);
    try {
      const res = await einvoiceService.cancelInvoice(cancelTarget.id, cancelReason);
      if (!res.ok) {
        toast.error(res.error || "Huỷ thất bại");
        return;
      }
      toast.success("Đã huỷ hoá đơn");
      setCancelTarget(null);
      setCancelReason("");
      await load();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-violet-600" />
            Hoá đơn điện tử
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi & quản lý tất cả HĐĐT đã phát hành. Tuân thủ TT 78/2021.
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
            <CardDescription>Đã phát hành</CardDescription>
            <CardTitle className="text-2xl">{stats.issuedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 font-bold">HĐ hợp lệ</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Doanh thu trên HĐ</CardDescription>
            <CardTitle className="text-2xl">{formatVND(stats.issuedTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Đã bao gồm thuế</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tiền thuế (VAT)</CardDescription>
            <CardTitle className="text-2xl">{formatVND(stats.issuedVat)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Tổng VAT phải nộp</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cần xử lý</CardDescription>
            <CardTitle className="text-2xl">{stats.failedCount + stats.cancelledCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-600 font-bold">
            {stats.failedCount} lỗi · {stats.cancelledCount} đã huỷ
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số HĐ, MST, tên khách..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="pending">Đang xử lý</option>
                <option value="issued">Đã phát hành</option>
                <option value="sent">Đã gửi KH</option>
                <option value="cancelled">Đã huỷ</option>
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
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold">Chưa có hoá đơn</p>
              <p className="text-sm text-muted-foreground">
                Hoá đơn sẽ xuất hiện khi bạn phát hành từ POS hoặc từ trang Đơn hàng.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Số HĐ</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>MST</TableHead>
                  <TableHead className="text-right">Tổng</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mã tra cứu</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const meta = STATUS_META[i.status] || STATUS_META.failed;
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{formatTime(i.invoice_date || i.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">
                        {i.invoice_series || "—"}/{i.invoice_no || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-bold">{i.buyer_name || "—"}</div>
                        <div className="text-muted-foreground">{i.buyer_phone || ""}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{i.buyer_tax_code || "—"}</TableCell>
                      <TableCell className="text-right font-bold">{formatVND(Number(i.total_amount))}</TableCell>
                      <TableCell className="text-right text-xs">{formatVND(Number(i.vat_amount))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 font-bold ${meta.className}`}>
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{i.provider_lookup_code || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 justify-end">
                          {i.provider_pdf_url && (
                            <a
                              href={i.provider_pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 hover:bg-muted rounded"
                              title="Mở PDF"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {(i.status === "issued" || i.status === "sent") && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(i)}
                              className="p-1.5 hover:bg-red-500/10 text-red-600 rounded"
                              title="Huỷ HĐ"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {i.status === "failed" && i.error_message && (
                            <span className="p-1.5 text-red-600" title={i.error_message}>
                              <AlertCircle className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Huỷ hoá đơn điện tử?</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  Hoá đơn{" "}
                  <b>
                    {cancelTarget.invoice_series}/{cancelTarget.invoice_no}
                  </b>{" "}
                  sẽ chuyển sang trạng thái "Đã huỷ". Theo TT 78/2021, cần khai báo lý do huỷ với Cơ quan Thuế.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Input
              placeholder="Lý do huỷ HĐ (bắt buộc)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling || !cancelReason.trim()}>
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận huỷ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
