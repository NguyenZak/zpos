"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shift } from "@/services/shift.service";
import { fmtVND, fmtDate, fmtDuration } from "./format";
import { ShiftStatusBadge } from "./shift-status-badge";
import { CreditCard, Banknote, Smartphone, QrCode, Coins, Receipt, ArrowLeftRight, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ShiftSummaryCardProps {
  shift: Shift;
}

const Row = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-4" />
      <span>{label}</span>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  </div>
);

export function ShiftSummaryCard({ shift }: ShiftSummaryCardProps) {
  const diff = Number(shift.cash_difference || 0);
  const counted = Number(shift.counted_cash_amount || 0);
  const expected = Number(shift.expected_cash_amount || 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Ca #{shift.id.slice(0, 8)}</CardTitle>
              <CardDescription>
                Mở lúc {fmtDate(shift.opened_at)} · Thời lượng {fmtDuration(shift.opened_at, shift.closed_at)}
              </CardDescription>
            </div>
            <ShiftStatusBadge status={shift.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <Row icon={Banknote} label="Tiền mặt đầu ca" value={fmtVND(shift.opening_cash_amount)} />
          <Row icon={Banknote} label="Tiền mặt bán hàng" value={fmtVND(shift.cash_sales_amount)} />
          <Row icon={ArrowLeftRight} label="Chuyển khoản" value={fmtVND(shift.bank_transfer_amount)} />
          <Row icon={QrCode} label="VietQR" value={fmtVND(shift.vietqr_amount)} />
          <Row icon={CreditCard} label="Thẻ" value={fmtVND(shift.card_amount)} />
          <Row icon={Smartphone} label="MoMo" value={fmtVND(shift.momo_amount)} />
          <Row icon={Smartphone} label="ZaloPay" value={fmtVND(shift.zalopay_amount)} />
          <Row icon={Coins} label="Ghi nợ" value={fmtVND(shift.debt_amount)} />
          <Row icon={Receipt} label="Hoàn tiền" value={fmtVND(shift.refund_amount)} />
          <Row icon={Receipt} label="Chi phí tại quầy" value={fmtVND(shift.expense_amount)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đối soát tiền mặt</CardTitle>
          <CardDescription>
            {shift.total_orders} đơn · {shift.cancelled_orders} huỷ · Tổng doanh thu {fmtVND(shift.total_sales_amount)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Đầu ca</p>
              <p className="font-semibold">{fmtVND(shift.opening_cash_amount)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Dự kiến</p>
              <p className="font-semibold text-emerald-600">{fmtVND(expected)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Đếm thực tế</p>
              <p className="font-semibold">{fmtVND(counted)}</p>
            </div>
          </div>

          {shift.status !== "open" && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 ${diff === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700"}`}>
              {diff === 0 ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
              <div className="text-sm">
                {diff === 0 && "Khớp tiền — không có chênh lệch."}
                {diff > 0 && `Dư ${fmtVND(diff)} so với dự kiến.`}
                {diff < 0 && `Thiếu ${fmtVND(Math.abs(diff))} so với dự kiến.`}
              </div>
            </div>
          )}

          {shift.note && (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú</p>
              <p className="mt-1 whitespace-pre-wrap">{shift.note}</p>
            </div>
          )}

          {shift.reviewed_at && (
            <p className="text-xs text-muted-foreground">
              Đã duyệt bởi {shift.reviewer?.full_name || "—"} lúc {fmtDate(shift.reviewed_at)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
