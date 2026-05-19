"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { debtService, type DebtOrder, type DebtPaymentMethod } from "@/services/debt.service";

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName?: string;
  currentBalance?: number;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentBalance,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<DebtOrder[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<DebtPaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    debtService
      .getCustomerDebtOrders(customerId)
      .then((list) => {
        if (!cancelled) setOrders(list || []);
      })
      .catch((e) => console.error("Load debt orders failed:", e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  // FIFO allocation preview: oldest order paid first.
  const allocations = useMemo(() => {
    let remaining = amount;
    const sorted = [...orders].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return sorted
      .map((o) => {
        // debt_amount is the still-unpaid portion of the order (charge_debt
        // sets it to total_amount and record_debt_payment decrements it).
        const outstanding = Number(o.debt_amount ?? 0);
        if (remaining <= 0 || outstanding <= 0) return null;
        const apply = Math.min(remaining, outstanding);
        remaining -= apply;
        return { order_id: o.id, order_number: o.order_number, amount: apply };
      })
      .filter(Boolean) as { order_id: string; order_number: string; amount: number }[];
  }, [amount, orders]);

  const totalOutstanding = useMemo(
    () => orders.reduce((acc, o) => acc + Number(o.debt_amount ?? 0), 0),
    [orders],
  );

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }
    setSubmitting(true);
    try {
      const res = await debtService.recordPayment({
        customerId,
        amount,
        method,
        reference: reference || undefined,
        notes: notes || undefined,
        allocations: allocations.map((a) => ({ order_id: a.order_id, amount: a.amount })),
      });
      if (!res.ok) {
        toast.error("Không thể ghi nhận phiếu thu", { description: res.error });
        return;
      }
      toast.success("Đã thu nợ", {
        description: `Số dư còn lại: ${fmt(res.balance_after ?? 0)}`,
      });
      onOpenChange(false);
      setAmount(0);
      setReference("");
      setNotes("");
      onSuccess?.();
    } catch (e: any) {
      toast.error("Lỗi khi ghi nhận phiếu thu", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Thu tiền công nợ
          </DialogTitle>
          <DialogDescription>
            {customerName ? `Khách hàng: ${customerName}` : `Khách hàng #${customerId.slice(0, 8)}`}
            {typeof currentBalance === "number" && (
              <span className="ml-2">
                — Dư nợ: <span className="font-bold text-red-600">{fmt(currentBalance)}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Số tiền thu</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="0"
              />
              {amount > totalOutstanding && totalOutstanding > 0 && (
                <p className="text-[10px] text-amber-600">
                  Vượt số dư nợ {fmt(totalOutstanding)} — phần dư sẽ giữ làm credit.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Phương thức</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as DebtPaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="vietqr">VietQR</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Số tham chiếu (tùy chọn)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Mã giao dịch / số phiếu thu"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú nội bộ"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phân bổ FIFO (tự động)</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang tải đơn nợ...
              </div>
            ) : allocations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {orders.length === 0 ? "Khách không có đơn nợ đang mở" : "Nhập số tiền để xem phân bổ"}
              </p>
            ) : (
              <div className="max-h-32 overflow-y-auto rounded-md border divide-y">
                {allocations.map((a) => (
                  <div key={a.order_id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="font-mono">#{a.order_number}</span>
                    <Badge variant="secondary">{fmt(a.amount)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || amount <= 0}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Xác nhận thu {amount > 0 ? fmt(amount) : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
