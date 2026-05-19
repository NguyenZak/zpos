"use client";

import { ArrowDownToLine, ArrowUpFromLine, Pencil, Receipt, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DebtTransaction, DebtTxKind } from "@/services/debt.service";

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

const formatDateTime = (s: string) => {
  const d = new Date(s);
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

const kindMeta: Record<DebtTxKind, { label: string; icon: any; tone: string }> = {
  charge: { label: "Ghi nợ", icon: ArrowUpFromLine, tone: "text-red-600" },
  payment: { label: "Thu nợ", icon: ArrowDownToLine, tone: "text-emerald-600" },
  adjustment: { label: "Điều chỉnh", icon: Pencil, tone: "text-amber-600" },
  write_off: { label: "Xoá nợ", icon: XCircle, tone: "text-zinc-500" },
  refund: { label: "Hoàn tiền", icon: Receipt, tone: "text-violet-600" },
};

export function LedgerTimeline({
  transactions,
  loading,
  emptyText = "Chưa có giao dịch công nợ.",
}: {
  transactions: DebtTransaction[];
  loading?: boolean;
  emptyText?: string;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground italic">Đang tải sổ cái...</p>;
  }
  if (!transactions || transactions.length === 0) {
    return <p className="text-sm text-muted-foreground italic text-center py-6">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const meta = kindMeta[tx.kind] ?? kindMeta.adjustment;
        const Icon = meta.icon;
        const isCredit = tx.kind === "payment" || tx.kind === "write_off" || tx.kind === "adjustment" && Number(tx.amount) < 0;
        return (
          <div
            key={tx.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition"
          >
            <div className={`p-2 rounded-md bg-muted ${meta.tone}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {meta.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(tx.created_at)}
                  </span>
                </div>
                <span className={`font-bold text-sm ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                  {isCredit ? "-" : "+"}{fmt(Math.abs(Number(tx.amount)))}
                </span>
              </div>
              {tx.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.notes}</p>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>
                  Trước: <span className="font-mono">{fmt(Number(tx.balance_before))}</span>
                </span>
                <span>→</span>
                <span>
                  Sau: <span className="font-mono font-bold">{fmt(Number(tx.balance_after))}</span>
                </span>
                {tx.due_date && (
                  <span className="ml-auto">Hạn: {new Date(tx.due_date).toLocaleDateString("vi-VN")}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
