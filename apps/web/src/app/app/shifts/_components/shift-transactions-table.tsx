"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ShiftTransaction } from "@/services/shift.service";
import { fmtVND, fmtDate } from "./format";

const typeMeta: Record<string, { label: string; className: string }> = {
  opening_cash: { label: "Tiền đầu ca", className: "bg-emerald-100 text-emerald-700" },
  sale: { label: "Bán hàng", className: "bg-blue-100 text-blue-700" },
  refund: { label: "Hoàn tiền", className: "bg-rose-100 text-rose-700" },
  cash_in: { label: "Nhập quỹ", className: "bg-teal-100 text-teal-700" },
  cash_out: { label: "Rút quỹ", className: "bg-orange-100 text-orange-700" },
  expense: { label: "Chi phí", className: "bg-amber-100 text-amber-700" },
  closing_cash: { label: "Tiền cuối ca", className: "bg-violet-100 text-violet-700" },
  adjustment: { label: "Điều chỉnh", className: "bg-slate-100 text-slate-700" },
};

export function ShiftTransactionsTable({ transactions }: { transactions: ShiftTransaction[] }) {
  if (!transactions.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thời gian</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Phương thức</TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => {
            const m = typeMeta[t.type] || { label: t.type, className: "bg-slate-100 text-slate-700" };
            return (
              <TableRow key={t.id}>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(t.created_at)}</TableCell>
                <TableCell><Badge className={m.className} variant="secondary">{m.label}</Badge></TableCell>
                <TableCell>{t.payment_method || "—"}</TableCell>
                <TableCell className="max-w-[280px] truncate">{t.note || "—"}</TableCell>
                <TableCell className="text-right font-medium">{fmtVND(t.amount)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
