"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtVND, fmtDate } from "./format";

interface ShiftOrdersTableProps {
  orders: any[];
}

const methodMeta: Record<string, { label: string; className: string }> = {
  cash: { label: "Tiền mặt", className: "bg-emerald-100 text-emerald-700" },
  bank_transfer: { label: "Chuyển khoản", className: "bg-blue-100 text-blue-700" },
  transfer: { label: "Chuyển khoản", className: "bg-blue-100 text-blue-700" },
  vietqr: { label: "VietQR", className: "bg-indigo-100 text-indigo-700" },
  card: { label: "Thẻ", className: "bg-purple-100 text-purple-700" },
  momo: { label: "MoMo", className: "bg-pink-100 text-pink-700" },
  zalopay: { label: "ZaloPay", className: "bg-sky-100 text-sky-700" },
  debt: { label: "Ghi nợ", className: "bg-amber-100 text-amber-700" },
};

export function ShiftOrdersTable({ orders }: ShiftOrdersTableProps) {
  if (!orders.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có đơn nào trong ca này.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Phương thức</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Tổng tiền</TableHead>
            <TableHead className="text-right">Thời gian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const m = methodMeta[o.payment_method] || {
              label: o.payment_method || "—",
              className: "bg-slate-100 text-slate-700",
            };
            return (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.order_number || o.id.slice(0, 8)}</TableCell>
                <TableCell>{o.customer?.name || "Khách lẻ"}</TableCell>
                <TableCell>
                  <Badge className={m.className} variant="secondary">
                    {m.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={o.status === "cancelled" ? "destructive" : "secondary"}>{o.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{fmtVND(o.total_amount)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(o.created_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
