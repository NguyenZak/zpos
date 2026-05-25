"use client";

import React from "react";
import {
  FileText,
  Loader2,
  Search,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Building2,
  User,
  Mail,
  MapPin,
  QrCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { einvoiceService } from "@/services/einvoice";
import type { Invoice, IssueInvoiceInput } from "@/services/einvoice/types";

interface CartItem {
  product_name: string;
  product_id?: string;
  order_item_id?: string;
  sku?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
}

interface IssueInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  branchId?: string;
  customerId?: string;
  cartItems: CartItem[];
  totalAmount: number;
  paymentMethod?: string;
  onSuccess?: (invoice: Invoice) => void;
}

function formatVND(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);
}

export function IssueInvoiceDialog({
  open,
  onOpenChange,
  orderId,
  branchId,
  customerId,
  cartItems,
  totalAmount,
  paymentMethod,
  onSuccess,
}: IssueInvoiceDialogProps) {
  const [step, setStep] = React.useState<"buyer" | "confirm" | "result">("buyer");
  const [loading, setLoading] = React.useState(false);
  const [lookingUp, setLookingUp] = React.useState(false);
  const [result, setResult] = React.useState<Invoice | null>(null);
  const [vatRate, setVatRate] = React.useState<number>(0);
  const [buyer, setBuyer] = React.useState({
    name: "",
    tax_code: "",
    address: "",
    email: "",
    phone: "",
  });

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setStep("buyer");
      setResult(null);
      setBuyer({ name: "", tax_code: "", address: "", email: "", phone: "" });
      // Load default VAT from tax settings
      einvoiceService.getTaxSettings().then((tax) => {
        if (tax?.default_vat_rate != null) setVatRate(Number(tax.default_vat_rate));
      });
    }
  }, [open]);

  async function handleLookupTax() {
    const code = buyer.tax_code.trim().replace(/[^0-9-]/g, "");
    if (!code || code.length < 10) {
      toast.error("Nhập mã số thuế hợp lệ (10+ ký tự)");
      return;
    }
    setLookingUp(true);
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${code}`);
      const json = await res.json();
      if (json.code === "00" && json.data) {
        const { name, address } = json.data;
        setBuyer((b) => ({ ...b, name: name || b.name, address: address || b.address }));
        toast.success("Đã tự động điền thông tin doanh nghiệp");
      } else {
        toast.error(json.desc || "Không tìm thấy doanh nghiệp với MST này");
      }
    } catch {
      toast.error("Lỗi kết nối tra cứu MST");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleIssue() {
    setLoading(true);
    try {
      const input: IssueInvoiceInput = {
        orderId,
        branchId,
        customerId,
        invoiceType: buyer.tax_code ? "B2B" : "B2C",
        buyer,
        items: cartItems.map((c) => ({
          product_name: c.product_name,
          product_id: c.product_id,
          order_item_id: c.order_item_id,
          sku: c.sku,
          unit: c.unit,
          quantity: c.quantity,
          unit_price: c.unit_price,
          discount_amount: c.discount_amount || 0,
          vat_rate: vatRate,
        })),
        vatRate,
        paymentMethod,
      };

      // Use client service (calls demo/manual directly; real providers should use /api/einvoice/issue)
      const res = await einvoiceService.issueInvoice(input);

      if (res.ok && res.invoice) {
        setResult(res.invoice);
        setStep("result");
        onSuccess?.(res.invoice);
        toast.success("Phát hành hoá đơn thành công!");
      } else {
        toast.error(res.error || "Phát hành thất bại");
      }
    } finally {
      setLoading(false);
    }
  }

  const subtotal = cartItems.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const discount = cartItems.reduce((s, c) => s + (c.discount_amount || 0), 0);
  const vatAmount = Math.round(((subtotal - discount) * vatRate) / 100);
  const total = subtotal - discount + vatAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            {step === "result" ? "Hoá đơn đã phát hành" : "Xuất hoá đơn điện tử"}
          </DialogTitle>
          <DialogDescription>
            {step === "buyer" && "Nhập thông tin người mua để in trên hoá đơn. B2C có thể bỏ trống MST."}
            {step === "confirm" && "Xác nhận thông tin trước khi gửi lên nhà cung cấp HĐĐT."}
            {step === "result" && "Hoá đơn điện tử đã được phát hành thành công."}
          </DialogDescription>
        </DialogHeader>

        {step === "buyer" && (
          <div className="space-y-4 py-2">
            {/* Invoice type indicator */}
            <div className="flex gap-2">
              <Badge variant={buyer.tax_code ? "default" : "secondary"} className="gap-1">
                {buyer.tax_code ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {buyer.tax_code ? "B2B — Doanh nghiệp" : "B2C — Cá nhân"}
              </Badge>
            </div>

            {/* MST with lookup */}
            <div className="grid gap-1.5">
              <Label className="font-bold text-sm">Mã số thuế người mua</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="0312345678 (bỏ trống nếu B2C)"
                  value={buyer.tax_code}
                  onChange={(e) => setBuyer((b) => ({ ...b, tax_code: e.target.value }))}
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleLookupTax()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleLookupTax}
                  disabled={lookingUp || !buyer.tax_code}
                >
                  {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Nhập MST và bấm 🔍 để tra cứu tự động tên/địa chỉ</p>
            </div>

            <div className="grid gap-1.5">
              <Label className="font-bold text-sm">Tên người mua / Công ty</Label>
              <Input
                placeholder="CÔNG TY TNHH ABC hoặc Nguyễn Văn A"
                value={buyer.name}
                onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="font-bold text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Địa chỉ
              </Label>
              <Input
                placeholder="Số nhà, đường, quận, tỉnh..."
                value={buyer.address}
                onChange={(e) => setBuyer((b) => ({ ...b, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email nhận HĐ
                </Label>
                <Input
                  type="email"
                  placeholder="ketoan@congty.vn"
                  value={buyer.email}
                  onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold text-sm">Thuế suất VAT (%)</Label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <option value={0}>0% — Không chịu thuế</option>
                  <option value={5}>5% — Hàng đặc biệt</option>
                  <option value={8}>8% — Hàng thông thường</option>
                  <option value={10}>10% — Hàng xa xỉ</option>
                </select>
              </div>
            </div>

            {/* Amount preview */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-mono font-bold">{formatVND(subtotal - discount)}</span>
              </div>
              {vatRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({vatRate}%)</span>
                  <span className="font-mono font-bold text-amber-600">{formatVND(vatAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Tổng tiền trên HĐ</span>
                <span className="font-mono text-violet-600">{formatVND(total)}</span>
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
              <p className="font-bold text-base">Thông tin người mua</p>
              {buyer.name && (
                <p>
                  <span className="text-muted-foreground">Tên:</span> <b>{buyer.name}</b>
                </p>
              )}
              {buyer.tax_code && (
                <p>
                  <span className="text-muted-foreground">MST:</span> <b className="font-mono">{buyer.tax_code}</b>
                </p>
              )}
              {buyer.address && (
                <p>
                  <span className="text-muted-foreground">Địa chỉ:</span> {buyer.address}
                </p>
              )}
              {buyer.email && (
                <p>
                  <span className="text-muted-foreground">Email:</span> {buyer.email}
                </p>
              )}
              {!buyer.name && !buyer.tax_code && (
                <p className="text-muted-foreground italic">Không có thông tin người mua (B2C)</p>
              )}
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số sản phẩm</span>
                <span className="font-bold">{cartItems.length} mặt hàng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT {vatRate}%</span>
                <span className="font-mono font-bold">{formatVND(vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng trên hoá đơn</span>
                <span className="text-violet-600 font-mono">{formatVND(total)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
              Sau khi phát hành, hoá đơn sẽ được gửi lên nhà cung cấp HĐĐT và không thể sửa nội dung (chỉ hủy hoặc điều
              chỉnh).
            </p>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">Phát hành thành công!</p>
                <p className="text-sm text-muted-foreground">
                  Số HĐ:{" "}
                  <span className="font-mono font-bold">
                    {result.invoice_series}/{result.invoice_no}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
              {result.tax_authority_code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã CQT</span>
                  <span className="font-mono font-bold text-xs">{result.tax_authority_code}</span>
                </div>
              )}
              {result.lookup_code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã tra cứu</span>
                  <span className="font-mono font-bold text-xs">{result.lookup_code}</span>
                </div>
              )}
              {result.lookup_url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Link tra cứu</span>
                  <a
                    href={result.lookup_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 underline text-xs truncate max-w-[200px]"
                  >
                    Xem HĐ →
                  </a>
                </div>
              )}
              {result.provider_pdf_url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">PDF</span>
                  <a
                    href={result.provider_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 underline text-xs"
                  >
                    Tải PDF
                  </a>
                </div>
              )}
            </div>

            {result.qr_code_url && (
              <div className="flex flex-col items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> QR tra cứu hoá đơn
                </p>
                <img src={result.qr_code_url} alt="QR tra cứu HĐ" className="w-32 h-32 rounded border" />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "buyer" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button onClick={() => setStep("confirm")} className="bg-violet-600 hover:bg-violet-700 text-white">
                <Receipt className="mr-2 h-4 w-4" /> Xem lại & Xác nhận
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("buyer")} disabled={loading}>
                Quay lại
              </Button>
              <Button onClick={handleIssue} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Phát hành hoá đơn
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => onOpenChange(false)} className="bg-violet-600 hover:bg-violet-700 text-white w-full">
              Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
