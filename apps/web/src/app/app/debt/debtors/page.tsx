"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertOctagon,
  BellRing,
  ChevronLeft,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { debtService, type CreditAccount } from "@/services/debt.service";
import { RecordPaymentDialog } from "../_components/record-payment-dialog";

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

export default function DebtorsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialFilter = (params.get("filter") as "all" | "overdue" | "over_limit") || "all";

  const [rows, setRows] = useState<CreditAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "over_limit">(initialFilter);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [paymentFor, setPaymentFor] = useState<CreditAccount | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await debtService.listDebtors({
        onlyOverdue: filter === "overdue",
        onlyOverLimit: filter === "over_limit",
        search: search.trim() || undefined,
        limit: 500,
      });
      setRows(data || []);
      setSelected(new Set());
    } catch (e: any) {
      console.error(e);
      toast.error("Không tải được danh sách khách nợ", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.customer?.name || "").toLowerCase().includes(q) ||
        (r.customer?.phone || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const allSelected = filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.customer_id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredRows.map((r) => r.customer_id)));
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulkRemind = async () => {
    if (selected.size === 0) return;
    setBulkSending(true);
    try {
      const res = await debtService.bulkSendReminders(Array.from(selected));
      toast.success(`Đã gửi ${res.ok} nhắc nợ${res.failed ? `, lỗi ${res.failed}` : ""}`);
      setSelected(new Set());
    } catch (e: any) {
      toast.error("Lỗi gửi nhắc nợ hàng loạt", { description: e?.message });
    } finally {
      setBulkSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => router.push("/debt")}>
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </Button>
          <h1 className="text-3xl leading-none tracking-tight">Khách hàng đang nợ</h1>
          <p className="text-muted-foreground text-sm">
            Lọc, tìm kiếm và gửi nhắc nợ hàng loạt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleBulkRemind}
            disabled={selected.size === 0 || bulkSending}
          >
            {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
            Gửi nhắc nợ ({selected.size})
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khách nợ</SelectItem>
            <SelectItem value="overdue">Chỉ quá hạn</SelectItem>
            <SelectItem value="over_limit">Vượt hạn mức</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead className="text-right">Dư nợ</TableHead>
              <TableHead className="text-right">Quá hạn</TableHead>
              <TableHead className="text-right">Hạn mức</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground italic">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground italic">
                  Không có khách hàng phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => {
                const overLimit = Number(r.current_balance) > Number(r.credit_limit || 0);
                const overdue = Number(r.overdue_amount) > 0;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.customer_id)}
                        onCheckedChange={() => toggleOne(r.customer_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/debt/customers/${r.customer_id}`}
                        className="font-bold hover:underline"
                      >
                        {r.customer?.name || `Khách #${r.customer_id.slice(0, 8)}`}
                      </Link>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        {r.customer?.phone || "—"}
                        {overLimit && (
                          <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                            <AlertOctagon className="w-2.5 h-2.5 mr-0.5" /> Vượt hạn mức
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {fmt(Number(r.current_balance))}
                    </TableCell>
                    <TableCell className="text-right">
                      {overdue ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {fmt(Number(r.overdue_amount))}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {fmt(Number(r.credit_limit || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaymentFor(r)}
                      >
                        <Wallet className="w-3.5 h-3.5" /> Thu tiền
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {paymentFor && (
        <RecordPaymentDialog
          open={!!paymentFor}
          onOpenChange={(open) => !open && setPaymentFor(null)}
          customerId={paymentFor.customer_id}
          customerName={paymentFor.customer?.name}
          currentBalance={Number(paymentFor.current_balance)}
          onSuccess={() => {
            setPaymentFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}
