"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { debtService, type AgingBucket } from "@/services/debt.service";
import { AgingBucketTable } from "../_components/aging-bucket-table";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

export default function AgingReportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await debtService.getAgingReport();
      setRows(data || []);
    } catch (e: any) {
      toast.error("Không tải được báo cáo aging", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.customer_name?.toLowerCase().includes(q) || (r.phone || "").toLowerCase().includes(q));
  }, [rows, search]);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, r) => ({
          current: acc.current + r.current,
          d0_30: acc.d0_30 + r.d0_30,
          d31_60: acc.d31_60 + r.d31_60,
          d61_90: acc.d61_90 + r.d61_90,
          d90plus: acc.d90plus + r.d90plus,
          total: acc.total + r.total,
        }),
        { current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0 },
      ),
    [filteredRows],
  );

  const exportCSV = () => {
    const header = [
      "Khách hàng",
      "Số điện thoại",
      "Trong hạn",
      "0-30 ngày",
      "31-60 ngày",
      "61-90 ngày",
      "90+ ngày",
      "Tổng",
    ].join(",");
    const escape = (v: string | number) =>
      typeof v === "string" && v.includes(",") ? `"${v.replace(/"/g, '""')}"` : String(v);
    const lines = filteredRows.map((r) =>
      [
        escape(r.customer_name || ""),
        escape(r.phone || ""),
        r.current,
        r.d0_30,
        r.d31_60,
        r.d61_90,
        r.d90plus,
        r.total,
      ].join(","),
    );
    const blob = new Blob(["﻿" + [header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất file CSV");
  };

  const summary = [
    { label: "Trong hạn", value: totals.current, tone: "text-zinc-600" },
    { label: "0–30 ngày", value: totals.d0_30, tone: "text-amber-600" },
    { label: "31–60 ngày", value: totals.d31_60, tone: "text-amber-700" },
    { label: "61–90 ngày", value: totals.d61_90, tone: "text-red-600" },
    { label: "90+ ngày", value: totals.d90plus, tone: "text-red-700" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => router.push("/debt")}>
          <ChevronLeft className="w-4 h-4" /> Dashboard công nợ
        </Button>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-3xl leading-none tracking-tight">Báo cáo Aging</h1>
            <p className="text-muted-foreground text-sm">
              Phân tích công nợ theo độ tuổi: trong hạn, 0–30, 31–60, 61–90, 90+ ngày.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={filteredRows.length === 0}>
              <Download className="w-4 h-4" /> Xuất CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-black mt-1 ${s.tone}`}>{fmt(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Chi tiết theo khách hàng ({filteredRows.length})</CardTitle>
          <Input
            placeholder="Tìm tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[240px]"
          />
        </CardHeader>
        <CardContent>
          <AgingBucketTable rows={filteredRows} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
