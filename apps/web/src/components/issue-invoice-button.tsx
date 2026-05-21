"use client";

import React from "react";
import { FileText, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  einvoiceService,
  type Invoice,
  type InvoiceItem,
} from "@/services/einvoice.service";

// Backward compat alias
type InvoiceLineItem = InvoiceItem;

interface Props {
  orderId?: string;
  buyer?: {
    name?: string;
    tax_code?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceLineItem[];
  defaultVatRate?: number;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  /** If true, shows compact label; if false shows the full label. */
  compact?: boolean;
  onIssued?: (invoice: Invoice) => void;
}

export function IssueInvoiceButton({
  orderId,
  buyer,
  items,
  defaultVatRate = 8,
  size = "default",
  variant = "default",
  compact = false,
  onIssued,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [issuing, setIssuing] = React.useState(false);
  const [existing, setExisting] = React.useState<Invoice | null>(null);
  const [form, setForm] = React.useState({
    name: buyer?.name || "",
    tax_code: buyer?.tax_code || "",
    address: buyer?.address || "",
    email: buyer?.email || "",
    phone: buyer?.phone || "",
    vatRate: defaultVatRate,
    notes: "",
    issuePersonalInvoice: !buyer?.tax_code,
  });

  React.useEffect(() => {
    if (!open || !orderId) return;
    einvoiceService.getInvoiceForOrder(orderId).then(setExisting);
  }, [open, orderId]);

  async function handleIssue() {
    setIssuing(true);
    try {
      const res = await einvoiceService.issueInvoice({
        orderId,
        buyer: {
          name: form.issuePersonalInvoice ? form.name || "KHÁCH LẺ" : form.name,
          tax_code: form.issuePersonalInvoice ? "" : form.tax_code,
          address: form.address,
          email: form.email,
          phone: form.phone,
        },
        items: items as any,
        vatRate: form.vatRate,
        notes: form.notes,
      });
      if (!res.ok) {
        toast.error(res.error || "Phát hành thất bại");
        return;
      }
      toast.success(`Đã phát hành hoá đơn #${res.invoice?.invoice_no}`);
      setExisting(res.invoice || null);
      onIssued?.(res.invoice as Invoice);
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message}`);
    } finally {
      setIssuing(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={
          variant === "default"
            ? "bg-violet-600 hover:bg-violet-700 text-white"
            : ""
        }
      >
        <FileText className="mr-2 h-4 w-4" />
        {compact ? "HĐĐT" : "Phát hành HĐĐT"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Phát hành Hoá đơn điện tử
            </DialogTitle>
            <DialogDescription>
              Theo TT 78/2021. Hoá đơn sau khi phát hành không thể chỉnh sửa,
              chỉ có thể huỷ/thay thế/điều chỉnh.
            </DialogDescription>
          </DialogHeader>

          {existing ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    Đơn này đã có hoá đơn
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Số HĐ:</span>{" "}
                    <span className="font-mono font-bold">
                      {existing.invoice_series}-{existing.invoice_no}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trạng thái:</span>{" "}
                    <Badge className="ml-1">{existing.status}</Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Mã tra cứu:</span>{" "}
                    <span className="font-mono">
                      {existing.provider_lookup_code || "—"}
                    </span>
                  </div>
                </div>
                {existing.provider_pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    asChild
                  >
                    <a
                      href={existing.provider_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Xem PDF
                    </a>
                  </Button>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
                <div>
                  <p className="font-bold text-sm">Phát hành cho cá nhân (không MST)</p>
                  <p className="text-xs text-muted-foreground">
                    Tắt nếu khách yêu cầu HĐ có MST công ty
                  </p>
                </div>
                <Switch
                  checked={form.issuePersonalInvoice}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, issuePersonalInvoice: v }))
                  }
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="font-bold">
                    {form.issuePersonalInvoice ? "Họ tên khách" : "Tên công ty"}
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder={
                      form.issuePersonalInvoice ? "Nguyễn Văn A" : "CÔNG TY TNHH ABC"
                    }
                  />
                </div>
                {!form.issuePersonalInvoice && (
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Mã số thuế</Label>
                    <Input
                      value={form.tax_code}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tax_code: e.target.value }))
                      }
                      className="font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label className="font-bold">Địa chỉ</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="font-bold">Email (nhận HĐ)</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-bold">Thuế suất VAT (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.vatRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vatRate: Number(e.target.value) }))
                    }
                    className="font-bold"
                  />
                </div>
              </div>

              <div className="rounded-md border bg-muted/20 p-3 text-xs space-y-1">
                <p className="font-bold uppercase tracking-wider text-muted-foreground">
                  Mặt hàng ({items.length})
                </p>
                {items.slice(0, 5).map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate flex-1">{(it as any).product_name || (it as any).name}</span>
                    <span className="font-mono ml-2">
                      {it.quantity} × {new Intl.NumberFormat("vi-VN").format(it.unit_price)}
                    </span>
                  </div>
                ))}
                {items.length > 5 && (
                  <p className="text-muted-foreground">
                    ... và {items.length - 5} sản phẩm khác
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Huỷ
                </Button>
                <Button
                  onClick={handleIssue}
                  disabled={issuing}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {issuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Phát hành
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
