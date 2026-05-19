"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgingBucket } from "@/services/debt.service";

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

const cellClass = (value: number, threshold: "soft" | "warn" | "danger" = "soft") => {
  if (!value) return "text-muted-foreground";
  if (threshold === "danger") return "text-red-600 font-bold";
  if (threshold === "warn") return "text-amber-600 font-semibold";
  return "font-medium";
};

export function AgingBucketTable({
  rows,
  loading,
}: {
  rows: AgingBucket[];
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground italic">Đang tải báo cáo aging...</p>;
  }
  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-10">
        Không có khoản nợ nào — tất cả khách hàng đã tất toán.
      </p>
    );
  }

  const totals = rows.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      d0_30: acc.d0_30 + r.d0_30,
      d31_60: acc.d31_60 + r.d31_60,
      d61_90: acc.d61_90 + r.d61_90,
      d90plus: acc.d90plus + r.d90plus,
      total: acc.total + r.total,
    }),
    { current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 },
  );

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0">
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead className="text-right">Trong hạn</TableHead>
            <TableHead className="text-right">0–30 ngày</TableHead>
            <TableHead className="text-right">31–60 ngày</TableHead>
            <TableHead className="text-right">61–90 ngày</TableHead>
            <TableHead className="text-right">90+ ngày</TableHead>
            <TableHead className="text-right">Tổng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.customer_id}>
              <TableCell>
                <Link
                  href={`/debt/customers/${r.customer_id}`}
                  className="font-bold hover:underline"
                >
                  {r.customer_name || "Khách lẻ"}
                </Link>
                {r.phone && (
                  <div className="text-[10px] text-muted-foreground">{r.phone}</div>
                )}
              </TableCell>
              <TableCell className={`text-right ${cellClass(r.current, "soft")}`}>
                {r.current ? fmt(r.current) : "—"}
              </TableCell>
              <TableCell className={`text-right ${cellClass(r.d0_30, "warn")}`}>
                {r.d0_30 ? fmt(r.d0_30) : "—"}
              </TableCell>
              <TableCell className={`text-right ${cellClass(r.d31_60, "warn")}`}>
                {r.d31_60 ? fmt(r.d31_60) : "—"}
              </TableCell>
              <TableCell className={`text-right ${cellClass(r.d61_90, "danger")}`}>
                {r.d61_90 ? fmt(r.d61_90) : "—"}
              </TableCell>
              <TableCell className={`text-right ${cellClass(r.d90plus, "danger")}`}>
                {r.d90plus ? fmt(r.d90plus) : "—"}
              </TableCell>
              <TableCell className="text-right font-bold">{fmt(r.total)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/30 font-bold">
            <TableCell>Tổng cộng</TableCell>
            <TableCell className="text-right">{fmt(totals.current)}</TableCell>
            <TableCell className="text-right text-amber-600">{fmt(totals.d0_30)}</TableCell>
            <TableCell className="text-right text-amber-600">{fmt(totals.d31_60)}</TableCell>
            <TableCell className="text-right text-red-600">{fmt(totals.d61_90)}</TableCell>
            <TableCell className="text-right text-red-600">{fmt(totals.d90plus)}</TableCell>
            <TableCell className="text-right">{fmt(totals.total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
