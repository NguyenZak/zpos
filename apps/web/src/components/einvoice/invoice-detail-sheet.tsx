"use client";

import React from "react";
import { CheckCircle2, XCircle, RefreshCw, Zap, AlertTriangle, FileText, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ExternalLink, QrCode, Ban } from "lucide-react";
import { toast } from "sonner";
import { einvoiceService } from "@/services/einvoice";
import type { Invoice, InvoiceLog } from "@/services/einvoice/types";
import { InvoiceStatusBadge, formatVND, formatTime } from "./invoice-status-badge";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  issue:           <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  issue_failed:    <XCircle className="h-4 w-4 text-red-500" />,
  cancel:          <Ban className="h-4 w-4 text-zinc-500" />,
  adjust:          <RefreshCw className="h-4 w-4 text-violet-500" />,
  replace:         <RefreshCw className="h-4 w-4 text-violet-500" />,
  sync:            <Zap className="h-4 w-4 text-teal-500" />,
  webhook_received:<Send className="h-4 w-4 text-blue-500" />,
  email_sent:      <Send className="h-4 w-4 text-sky-500" />,
};

interface InvoiceDetailSheetProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelRequest: (invoice: Invoice) => void;
  onAdjustRequest: (invoice: Invoice) => void;
  onReplaceRequest: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export function InvoiceDetailSheet({
  invoice, open, onOpenChange, onCancelRequest, onAdjustRequest, onReplaceRequest, onRefresh,
}: InvoiceDetailSheetProps) {
  const [logs, setLogs] = React.useState<InvoiceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    if (open && invoice) {
      setLoadingLogs(true);
      einvoiceService.getInvoiceLogs(invoice.id).then((data) => {
        setLogs(data);
        setLoadingLogs(false);
      });
    }
  }, [open, invoice]);

  async function handleSync() {
    if (!invoice) return;
    setSyncing(true);
    const res = await einvoiceService.syncInvoiceStatus(invoice.id);
    setSyncing(false);
    if (res.ok) { toast.success(`Đồng bộ xong — Trạng thái: ${res.status}`); onRefresh(); }
    else toast.error(res.error || "Đồng bộ thất bại");
  }

  if (!invoice) return null;

  const canCancel = ["issued", "sent", "sent_to_tax", "synced"].includes(invoice.status);
  const canAdjust = ["issued", "sent", "sent_to_tax", "synced"].includes(invoice.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            Chi tiết hoá đơn
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Header info */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-black text-lg text-violet-600">
                  {invoice.invoice_series}/{invoice.invoice_no || "——"}
                </p>
                <p className="text-xs text-muted-foreground">{formatTime(invoice.invoice_date || invoice.created_at)}</p>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Provider:</span> <span className="font-bold uppercase">{invoice.provider}</span></div>
              <div><span className="text-muted-foreground">Loại HĐ:</span> <span className="font-bold">{invoice.invoice_type || "B2C"}</span></div>
              {invoice.tax_authority_code && (
                <div className="col-span-2"><span className="text-muted-foreground">Mã CQT:</span> <span className="font-mono font-bold text-sky-600">{invoice.tax_authority_code}</span></div>
              )}
              {(invoice.lookup_code || invoice.provider_lookup_code) && (
                <div className="col-span-2"><span className="text-muted-foreground">Mã tra cứu:</span> <span className="font-mono font-bold">{invoice.lookup_code || invoice.provider_lookup_code}</span></div>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-2">
              {(invoice.lookup_url) && (
                <a href={invoice.lookup_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Tra cứu HĐ
                  </Button>
                </a>
              )}
              {invoice.provider_pdf_url && (
                <a href={invoice.provider_pdf_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Xem PDF
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* QR code */}
          {invoice.qr_code_url && (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> QR tra cứu</p>
              <img src={invoice.qr_code_url} alt="QR" className="w-28 h-28 rounded border" />
            </div>
          )}

          {/* Buyer */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-1.5 text-sm">
            <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground mb-2">Thông tin người mua</p>
            {invoice.buyer_name ? <p><span className="text-muted-foreground">Tên:</span> <b>{invoice.buyer_name}</b></p> : <p className="text-muted-foreground italic">Khách lẻ (B2C)</p>}
            {invoice.buyer_tax_code && <p><span className="text-muted-foreground">MST:</span> <span className="font-mono font-bold">{invoice.buyer_tax_code}</span></p>}
            {invoice.buyer_address && <p><span className="text-muted-foreground">Địa chỉ:</span> {invoice.buyer_address}</p>}
            {invoice.buyer_email && <p><span className="text-muted-foreground">Email:</span> {invoice.buyer_email}</p>}
          </div>

          {/* Amounts */}
          <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
            <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground mb-2">Giá trị hoá đơn</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span className="font-mono">{formatVND(invoice.subtotal)}</span></div>
            {invoice.discount_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Giảm giá</span><span className="font-mono text-red-500">-{formatVND(invoice.discount_amount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">VAT ({invoice.vat_rate}%)</span><span className="font-mono text-amber-600">{formatVND(invoice.vat_amount)}</span></div>
            <Separator />
            <div className="flex justify-between font-black text-base"><span>Tổng cộng</span><span className="font-mono text-violet-600">{formatVND(invoice.total_amount)}</span></div>
          </div>

          {/* Error info */}
          {invoice.status === "failed" && invoice.error_message && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm">
              <p className="font-bold text-red-700 flex items-center gap-1.5 mb-1"><AlertTriangle className="h-4 w-4" /> Lỗi phát hành</p>
              <p className="text-red-600 text-xs">{invoice.error_message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid gap-2">
            <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground">Thao tác</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-1.5">
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Đồng bộ
              </Button>
              {canAdjust && (
                <Button variant="outline" size="sm" onClick={() => onAdjustRequest(invoice)} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Điều chỉnh
                </Button>
              )}
              {canAdjust && (
                <Button variant="outline" size="sm" onClick={() => onReplaceRequest(invoice)} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Thay thế
                </Button>
              )}
              {canCancel && (
                <Button variant="outline" size="sm" onClick={() => onCancelRequest(invoice)} className="gap-1.5 text-red-600 hover:text-red-700">
                  <Ban className="h-3.5 w-3.5" /> Huỷ HĐ
                </Button>
              )}
            </div>
          </div>

          {/* Audit Timeline */}
          <div>
            <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground mb-3">Lịch sử thao tác</p>
            {loadingLogs ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Chưa có log</p>
            ) : (
              <div className="relative pl-5 space-y-4">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-5 flex items-center justify-center w-4 h-4 rounded-full bg-background border-2 border-border mt-0.5">
                      <span className="text-[8px]">●</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {ACTION_ICONS[log.action] || <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-bold text-sm">{log.action}</span>
                        {log.status_after && <Badge variant="outline" className="text-[10px] h-4">{log.status_after}</Badge>}
                      </div>
                      {log.message && <p className="text-xs text-muted-foreground mt-0.5">{log.message}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
