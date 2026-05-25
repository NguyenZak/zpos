"use client";

import React from "react";
import {
  ArrowDownToLine,
  Ban,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  AlertCircle,
  Zap,
  TrendingUp,
  ReceiptText,
  XCircle,
  CheckCircle2,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { einvoiceService } from "@/services/einvoice";
import type { Invoice, InvoiceStatus } from "@/services/einvoice/types";
import { InvoiceStatusBadge, formatVND, formatTime } from "@/components/einvoice/invoice-status-badge";
import { InvoiceDetailSheet } from "@/components/einvoice/invoice-detail-sheet";

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "issued", label: "Đã phát hành" },
  { value: "sent_to_tax", label: "Đã gửi CQT" },
  { value: "pending", label: "Đang xử lý" },
  { value: "cancelled", label: "Đã huỷ" },
  { value: "adjusted", label: "Đã điều chỉnh" },
  { value: "replaced", label: "Đã thay thế" },
  { value: "failed", label: "Lỗi" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | "all">("all");

  // Detail sheet
  const [detailInvoice, setDetailInvoice] = React.useState<Invoice | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Cancel dialog
  const [cancelTarget, setCancelTarget] = React.useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);

  // Adjust dialog
  const [adjustTarget, setAdjustTarget] = React.useState<Invoice | null>(null);
  const [adjustNote, setAdjustNote] = React.useState("");
  const [adjustType, setAdjustType] = React.useState<"adjust" | "replace">("adjust");
  const [adjusting, setAdjusting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await einvoiceService.listInvoices({ status: statusFilter, limit: 300 });
      setInvoices(rows);
    } catch (e: any) {
      toast.error(`Lỗi tải hoá đơn: ${e?.message}`);
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
        (i.lookup_code || i.provider_lookup_code)?.toLowerCase().includes(q),
    );
  }, [invoices, query]);

  const stats = React.useMemo(() => {
    const issued = invoices.filter((i) => ["issued", "sent", "sent_to_tax", "synced"].includes(i.status));
    return {
      issuedCount: issued.length,
      issuedTotal: issued.reduce((s, i) => s + Number(i.total_amount || 0), 0),
      vatTotal: issued.reduce((s, i) => s + Number(i.vat_amount || 0), 0),
      failedCount: invoices.filter((i) => i.status === "failed").length,
      cancelledCount: invoices.filter((i) => i.status === "cancelled").length,
    };
  }, [invoices]);

  function exportCSV() {
    const headers = [
      "Ngày phát hành",
      "Số HĐ",
      "Ký hiệu",
      "Khách hàng",
      "MST",
      "Tạm tính",
      "VAT",
      "Tổng tiền",
      "Trạng thái",
      "Mã tra cứu",
    ];
    const rows = filtered.map((i) => [
      formatTime(i.invoice_date || i.created_at),
      i.invoice_no || "",
      i.invoice_series || "",
      i.buyer_name || "",
      i.buyer_tax_code || "",
      String(i.subtotal),
      String(i.vat_amount),
      String(i.total_amount),
      i.status,
      i.lookup_code || i.provider_lookup_code || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCancel() {
    if (!cancelTarget || !cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do huỷ");
      return;
    }
    setCancelling(true);
    const res = await einvoiceService.cancelInvoice(cancelTarget.id, cancelReason);
    setCancelling(false);
    if (res.ok) {
      toast.success("Đã huỷ hoá đơn");
      setCancelTarget(null);
      setCancelReason("");
      load();
    } else toast.error(res.error || "Huỷ thất bại");
  }

  async function handleAdjust() {
    if (!adjustTarget || !adjustNote.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }
    setAdjusting(true);
    const res =
      adjustType === "adjust"
        ? await einvoiceService.adjustInvoice(adjustTarget.id, adjustNote)
        : await einvoiceService.replaceInvoice(adjustTarget.id, {
            orderId: adjustTarget.order_id || undefined,
            buyer: {
              name: adjustTarget.buyer_name || undefined,
              tax_code: adjustTarget.buyer_tax_code || undefined,
              address: adjustTarget.buyer_address || undefined,
              email: adjustTarget.buyer_email || undefined,
            },
            items: (adjustTarget.items || []).map((it: any) => ({
              product_name: it.product_name || it.name,
              quantity: it.quantity,
              unit_price: it.unit_price,
              discount_amount: it.discount_amount || 0,
              vat_rate: it.vat_rate || adjustTarget.vat_rate,
            })),
          });
    setAdjusting(false);
    if (res.ok) {
      toast.success(adjustType === "adjust" ? "Đã tạo HĐ điều chỉnh" : "Đã tạo HĐ thay thế");
      setAdjustTarget(null);
      setAdjustNote("");
      load();
    } else toast.error(res.error || "Thao tác thất bại");
  }

  function openDetail(inv: Invoice) {
    setDetailInvoice(inv);
    setDetailOpen(true);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <ReceiptText className="w-7 h-7 text-violet-600" />
            Hoá đơn điện tử
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý HĐĐT theo TT 78/2021 — Nghị định 123/2020</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Làm mới
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <ArrowDownToLine className="mr-2 h-4 w-4" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Đã phát hành
            </CardDescription>
            <CardTitle className="text-3xl font-black">{stats.issuedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 font-bold">HĐ hợp lệ</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
              Doanh thu trên HĐ
            </CardDescription>
            <CardTitle className="text-xl font-black">{formatVND(stats.issuedTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Đã bao gồm thuế</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tiền thuế VAT</CardDescription>
            <CardTitle className="text-xl font-black">{formatVND(stats.vatTotal)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Tổng VAT phải nộp</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Cần xử lý
            </CardDescription>
            <CardTitle className="text-3xl font-black">{stats.failedCount + stats.cancelledCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-600 font-bold">
            {stats.failedCount} lỗi · {stats.cancelledCount} đã huỷ
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số HĐ, MST, tên khách, mã tra cứu..."
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
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
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
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-bold">Chưa có hoá đơn</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hoá đơn xuất hiện khi bạn phát hành từ POS hoặc Đơn hàng.
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
                {filtered.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openDetail(inv)}>
                    <TableCell className="font-mono text-xs">
                      {formatTime(inv.invoice_date || inv.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">
                      {inv.invoice_series || "—"}/{inv.invoice_no || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold">{inv.buyer_name || "Khách lẻ"}</div>
                      <div className="text-muted-foreground text-[11px]">{inv.buyer_phone || ""}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{inv.buyer_tax_code || "—"}</TableCell>
                    <TableCell className="text-right font-bold">{formatVND(Number(inv.total_amount))}</TableCell>
                    <TableCell className="text-right text-xs text-amber-600">
                      {formatVND(Number(inv.vat_amount))}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {inv.lookup_code || inv.provider_lookup_code || "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        {inv.lookup_url && (
                          <a
                            href={inv.lookup_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Tra cứu HĐ"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {["issued", "sent", "sent_to_tax", "synced"].includes(inv.status) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelTarget(inv);
                            }}
                            className="p-1.5 hover:bg-red-500/10 text-red-600 rounded"
                            title="Huỷ HĐ"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {inv.status === "failed" && (
                          <span className="p-1.5 text-red-600" title={inv.error_message || "Lỗi"}>
                            <AlertCircle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <InvoiceDetailSheet
        invoice={detailInvoice}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onCancelRequest={(inv) => {
          setDetailOpen(false);
          setCancelTarget(inv);
        }}
        onAdjustRequest={(inv) => {
          setDetailOpen(false);
          setAdjustTarget(inv);
          setAdjustType("adjust");
        }}
        onReplaceRequest={(inv) => {
          setDetailOpen(false);
          setAdjustTarget(inv);
          setAdjustType("replace");
        }}
        onRefresh={load}
      />

      {/* Cancel Dialog */}
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
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Huỷ hoá đơn điện tử
            </DialogTitle>
            <DialogDescription>
              HĐ{" "}
              <b>
                {cancelTarget?.invoice_series}/{cancelTarget?.invoice_no}
              </b>{" "}
              sẽ chuyển sang "Đã huỷ". Theo TT 78/2021, cần khai báo lý do với Cơ quan Thuế.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label className="font-bold">
              Lý do huỷ <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Ví dụ: Sai thông tin người mua, đổi trả hàng..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
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

      {/* Adjust/Replace Dialog */}
      <Dialog
        open={!!adjustTarget}
        onOpenChange={(o) => {
          if (!o) {
            setAdjustTarget(null);
            setAdjustNote("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-violet-500" />
              {adjustType === "adjust" ? "Điều chỉnh" : "Thay thế"} hoá đơn
            </DialogTitle>
            <DialogDescription>
              HĐ:{" "}
              <b>
                {adjustTarget?.invoice_series}/{adjustTarget?.invoice_no}
              </b>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["adjust", "replace"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAdjustType(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors ${adjustType === t ? "bg-violet-600 text-white border-violet-600" : "bg-muted/30 hover:bg-muted/60"}`}
                >
                  {t === "adjust" ? "Điều chỉnh" : "Thay thế"}
                </button>
              ))}
            </div>
            <div className="grid gap-1.5">
              <Label className="font-bold">
                {adjustType === "adjust" ? "Nội dung điều chỉnh" : "Lý do thay thế"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder={
                  adjustType === "adjust"
                    ? "Điều chỉnh tăng/giảm số lượng SP..."
                    : "Thay thế do sai thông tin người mua..."
                }
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustTarget(null)}>
              Huỷ
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={adjusting || !adjustNote.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {adjusting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận {adjustType === "adjust" ? "điều chỉnh" : "thay thế"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
