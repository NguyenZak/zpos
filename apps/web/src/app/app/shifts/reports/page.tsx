"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { shiftService } from "@/services/shift.service";
import { usePermissions } from "@/hooks/use-permissions";
import { fmtVND } from "../_components/format";

const todayStr = () => new Date().toISOString().slice(0, 10);
const startOfMonthStr = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default function ShiftReportsPage() {
  const { hasPermission, loading: permLoading } = usePermissions();
  const canExport = hasPermission("shifts.export");

  const [from, setFrom] = useState(startOfMonthStr());
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState<Awaited<ReturnType<typeof shiftService.getReportSummary>> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await shiftService.getReportSummary(from + "T00:00:00", to + "T23:59:59");
      setData(r);
    } catch (e: any) {
      toast.error(e?.message || "Không tải được báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permLoading) load();
  }, [permLoading]);

  const totals = data?.totals;
  const byCashier = data?.byCashier || [];

  const exportCSV = () => {
    if (!totals) return;
    const rows: string[] = [];
    rows.push("Báo cáo ca làm việc");
    rows.push(`Từ,${from}`);
    rows.push(`Đến,${to}`);
    rows.push("");
    rows.push("Loại,Giá trị");
    rows.push(`Tổng ca,${totals.shifts}`);
    rows.push(`Tổng đơn,${totals.orders}`);
    rows.push(`Đơn huỷ,${totals.cancelled}`);
    rows.push(`Doanh thu,${totals.sales}`);
    rows.push(`Tiền mặt,${totals.cash}`);
    rows.push(`Chuyển khoản,${totals.transfer}`);
    rows.push(`VietQR,${totals.vietqr}`);
    rows.push(`Thẻ,${totals.card}`);
    rows.push(`MoMo,${totals.momo}`);
    rows.push(`ZaloPay,${totals.zalopay}`);
    rows.push(`Ghi nợ,${totals.debt}`);
    rows.push(`Hoàn tiền,${totals.refund}`);
    rows.push(`Chi phí,${totals.expense}`);
    rows.push(`Chênh lệch tiền,${totals.cash_difference}`);
    rows.push("");
    rows.push("Thu ngân,Số ca,Doanh thu,Chênh lệch");
    for (const c of byCashier) rows.push(`${c.cashier_name},${c.shifts},${c.sales},${c.difference}`);

    const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shift-report-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/shifts">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl tracking-tight">Báo cáo ca làm việc</h1>
            <p className="text-sm text-muted-foreground">
              Tổng hợp doanh thu, tiền mặt và chênh lệch theo khoảng thời gian.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Từ ngày</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Đến ngày</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Lọc
          </Button>
          {canExport && (
            <>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="size-4" /> CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" /> In
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tổng ca</p>
            <p className="mt-1 text-2xl font-semibold">{totals?.shifts ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tổng đơn</p>
            <p className="mt-1 text-2xl font-semibold">{totals?.orders ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Doanh thu</p>
            <p className="mt-1 text-xl font-semibold">{fmtVND(totals?.sales ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Chênh lệch tổng</p>
            <p
              className={`mt-1 text-xl font-semibold ${!totals || totals.cash_difference === 0 ? "" : totals.cash_difference > 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {fmtVND(totals?.cash_difference ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo phương thức</CardTitle>
            <CardDescription>
              Khoảng thời gian {from} → {to}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Tiền mặt" value={totals?.cash ?? 0} />
            <Row label="Chuyển khoản" value={totals?.transfer ?? 0} />
            <Row label="VietQR" value={totals?.vietqr ?? 0} />
            <Row label="Thẻ" value={totals?.card ?? 0} />
            <Row label="MoMo" value={totals?.momo ?? 0} />
            <Row label="ZaloPay" value={totals?.zalopay ?? 0} />
            <Row label="Ghi nợ" value={totals?.debt ?? 0} />
            <hr className="my-2" />
            <Row label="Hoàn tiền" value={totals?.refund ?? 0} />
            <Row label="Chi phí tại quầy" value={totals?.expense ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo thu ngân</CardTitle>
            <CardDescription>{byCashier.length} thu ngân trong kỳ</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thu ngân</TableHead>
                  <TableHead className="text-right">Số ca</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead className="text-right">Chênh lệch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCashier.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Chưa có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
                {byCashier.map((c) => (
                  <TableRow key={c.cashier_id}>
                    <TableCell>{c.cashier_name}</TableCell>
                    <TableCell className="text-right">{c.shifts}</TableCell>
                    <TableCell className="text-right font-medium">{fmtVND(c.sales)}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${c.difference === 0 ? "" : c.difference > 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {fmtVND(c.difference)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{fmtVND(value)}</span>
  </div>
);
