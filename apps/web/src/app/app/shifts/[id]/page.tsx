"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock, Printer, RefreshCw, X, Plus, Minus, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  shiftService,
  type Shift,
  type ShiftTransaction,
  type ShiftTransactionType,
  type PaymentMethod,
} from "@/services/shift.service";
import { usePermissions } from "@/hooks/use-permissions";
import { ShiftSummaryCard } from "../_components/shift-summary-card";
import { ShiftOrdersTable } from "../_components/shift-orders-table";
import { ShiftTransactionsTable } from "../_components/shift-transactions-table";
import { CloseShiftDialog } from "../_components/close-shift-dialog";
import { ShiftZReport } from "../_components/shift-z-report";
import { fmtVND } from "../_components/format";

export default function ShiftDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { hasPermission, loading: permLoading } = usePermissions();
  const canView = hasPermission("shifts.view");
  const canClose = hasPermission("shifts.close");
  const canReview = hasPermission("shifts.review");
  const canAdjust = hasPermission("shifts.adjust");
  const canExport = hasPermission("shifts.export");

  const [shift, setShift] = useState<Shift | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [txs, setTxs] = useState<ShiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [closeOpen, setCloseOpen] = useState(false);
  const [cashFlowOpen, setCashFlowOpen] = useState<null | "in" | "out" | "expense">(null);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashMethod, setCashMethod] = useState<PaymentMethod>("cash");
  const [cashNote, setCashNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, o, t] = await Promise.all([
        shiftService.getShift(id),
        shiftService.getShiftOrders(id),
        shiftService.getTransactions(id),
      ]);
      setShift(s);
      setOrders(o);
      setTxs(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permLoading && id) load();
  }, [permLoading, id]);

  if (!permLoading && !canView) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Bạn không có quyền truy cập</h2>
      </div>
    );
  }

  if (loading || !shift) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Đang tải...</p>;
  }

  const submitCashFlow = async () => {
    if (cashAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }
    if (!cashFlowOpen) return;
    const type: ShiftTransactionType =
      cashFlowOpen === "in" ? "cash_in" : cashFlowOpen === "out" ? "cash_out" : "expense";
    try {
      await shiftService.addTransaction({
        shift_id: shift.id,
        type,
        amount: cashAmount,
        payment_method: cashMethod,
        note: cashNote,
      });
      toast.success("Đã ghi nhận giao dịch");
      setCashFlowOpen(null);
      setCashAmount(0);
      setCashNote("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Có lỗi xảy ra");
    }
  };

  const handleReview = async () => {
    const res = await shiftService.reviewShift(shift.id);
    if (!res.ok) {
      toast.error(res.error || "Không thể duyệt ca");
      return;
    }
    toast.success("Đã duyệt ca");
    await load();
  };

  const handleCancel = async () => {
    const reason = window.prompt("Lý do huỷ ca?");
    if (!reason) return;
    const res = await shiftService.cancelShift(shift.id, reason);
    if (!res.ok) {
      toast.error(res.error || "Không thể huỷ ca");
      return;
    }
    toast.success("Đã huỷ ca");
    await load();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      <ShiftZReport shift={shift} transactions={txs} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between print:hidden">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/shifts">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl tracking-tight">Chi tiết ca #{shift.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">
              {shift.cashier?.full_name || shift.cashier?.email || "—"} · {shift.branch?.name || "—"}
              {shift.cash_register?.name && ` · ${shift.cash_register.name}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
          {canExport && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="size-4" /> In/PDF
            </Button>
          )}
          {shift.status === "open" && canClose && (
            <Button onClick={() => setCloseOpen(true)}>
              <Receipt className="size-4" /> Đóng ca
            </Button>
          )}
          {shift.status === "closed" && canReview && (
            <Button onClick={handleReview}>
              <ShieldCheck className="size-4" /> Duyệt ca
            </Button>
          )}
          {shift.status === "open" && canAdjust && (
            <Button variant="destructive" onClick={handleCancel}>
              <X className="size-4" /> Huỷ ca
            </Button>
          )}
        </div>
      </div>

      <ShiftSummaryCard shift={shift} />

      {shift.status === "open" && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-base">Thao tác nhanh trên ca</CardTitle>
            <CardDescription>Ghi nhận tiền nhập/rút quỹ hoặc chi phí phát sinh trong ca.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCashFlowOpen("in");
                setCashAmount(0);
                setCashNote("");
              }}
            >
              <Plus className="size-4" /> Nhập quỹ
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCashFlowOpen("out");
                setCashAmount(0);
                setCashNote("");
              }}
            >
              <Minus className="size-4" /> Rút quỹ
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCashFlowOpen("expense");
                setCashAmount(0);
                setCashNote("");
              }}
            >
              <Receipt className="size-4" /> Chi phí tại quầy
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Đơn hàng ({orders.length})</TabsTrigger>
          <TabsTrigger value="transactions">Sổ giao dịch ({txs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="pt-3">
          <Card>
            <CardContent className="p-0">
              <ShiftOrdersTable orders={orders} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions" className="pt-3">
          <Card>
            <CardContent className="p-0">
              <ShiftTransactionsTable transactions={txs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CloseShiftDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        shift={shift}
        onClosed={async (wantsToPrint) => {
          if (wantsToPrint) {
            await load();
            setTimeout(() => window.print(), 500);
          } else {
            router.replace("/pos");
          }
        }}
      />

      <Dialog open={!!cashFlowOpen} onOpenChange={(v) => !v && setCashFlowOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {cashFlowOpen === "in" && "Nhập quỹ"}
              {cashFlowOpen === "out" && "Rút quỹ"}
              {cashFlowOpen === "expense" && "Chi phí tại quầy"}
            </DialogTitle>
            <DialogDescription>Ghi nhận dòng tiền phát sinh trong ca.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Số tiền</Label>
              <Input
                type="number"
                min={0}
                value={cashAmount || ""}
                onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value) || 0))}
              />
              <p className="text-xs text-muted-foreground">{fmtVND(cashAmount)}</p>
            </div>
            <div className="space-y-1">
              <Label>Phương thức</Label>
              <Select value={cashMethod} onValueChange={(v) => setCashMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="vietqr">VietQR</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Textarea value={cashNote} onChange={(e) => setCashNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashFlowOpen(null)}>
              Huỷ
            </Button>
            <Button onClick={submitCashFlow}>
              <CheckCircle2 className="size-4" /> Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
