"use client";

import React from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ZaloMessage, type ZaloMessageStatus, zaloService } from "@/services/zalo.service";

const STATUS_META: Record<ZaloMessageStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Đang gửi",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  queued: {
    label: "Đã xếp hàng",
    className: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  sent: {
    label: "Đã gửi",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    icon: <Send className="h-3 w-3" />,
  },
  delivered: {
    label: "Đã nhận",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  read: {
    label: "Đã đọc",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    icon: <Eye className="h-3 w-3" />,
  },
  failed: {
    label: "Lỗi",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function formatTime(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", { hour12: false });
}

function formatPhone(p: string) {
  if (!p) return "";
  // 84xxxxxxxxx → 0xxxxxxxxx for display
  return p.startsWith("84") ? "0" + p.slice(2) : p;
}

export default function ZaloMessagesPage() {
  const [messages, setMessages] = React.useState<ZaloMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ZaloMessageStatus | "all">("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await zaloService.listMessages({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 300,
      });
      setMessages(rows);
    } catch (e: any) {
      toast.error(`Lỗi tải tin: ${e?.message || "Không rõ"}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.phone?.toLowerCase().includes(q) ||
        m.template_zalo_id?.toLowerCase().includes(q) ||
        m.rendered_text?.toLowerCase().includes(q),
    );
  }, [messages, query]);

  const stats = React.useMemo(() => {
    const delivered = messages.filter((m) => m.status === "delivered" || m.status === "read").length;
    const sent = messages.filter((m) => m.status === "sent").length;
    const failed = messages.filter((m) => m.status === "failed").length;
    const cost = messages.reduce((s, m) => s + Number(m.cost || 0), 0);
    return { delivered, sent, failed, cost, total: messages.length };
  }, [messages]);

  function exportCSV() {
    const headers = ["Thời gian", "SĐT", "Template", "Trạng thái", "Order", "Invoice", "Lỗi"];
    const rows = filtered.map((m) => [
      formatTime(m.created_at),
      formatPhone(m.phone),
      m.template_zalo_id || "",
      STATUS_META[m.status]?.label || m.status,
      m.order_id || "",
      m.invoice_id || "",
      m.zalo_error_message || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zalo-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <MessageCircle className="w-7 h-7 text-violet-600" />
            Tin nhắn Zalo ZNS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lịch sử tin tự động gửi cho khách qua Zalo OA — xác nhận thanh toán, HĐĐT, sinh nhật...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Làm mới
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã nhận / đọc</CardDescription>
            <CardTitle className="text-2xl">{stats.delivered}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 font-bold">Khách đã thấy</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã gửi (chưa nhận)</CardDescription>
            <CardTitle className="text-2xl">{stats.sent}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-600 font-bold">Đang chờ callback</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lỗi</CardDescription>
            <CardTitle className="text-2xl">{stats.failed}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-red-600 font-bold">Cần kiểm tra</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng phí ZNS</CardDescription>
            <CardTitle className="text-2xl">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(stats.cost)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Cộng dồn 300 tin gần nhất</CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo SĐT, template ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ZaloMessageStatus | "all")}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Đang gửi</option>
                <option value="sent">Đã gửi</option>
                <option value="delivered">Đã nhận</option>
                <option value="read">Đã đọc</option>
                <option value="failed">Lỗi</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold">Chưa có tin nhắn</p>
              <p className="text-sm text-muted-foreground">Tin Zalo sẽ xuất hiện khi POS phát hành đơn / hoá đơn.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Liên kết</TableHead>
                  <TableHead>Lỗi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const meta = STATUS_META[m.status] || STATUS_META.failed;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{formatTime(m.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{formatPhone(m.phone)}</TableCell>
                      <TableCell className="font-mono text-xs">{m.template_zalo_id || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 font-bold ${meta.className}`}>
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.order_id && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            ORD
                          </Badge>
                        )}
                        {m.invoice_id && (
                          <Badge variant="outline" className="font-mono text-[10px] ml-1">
                            HĐ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-xs truncate" title={m.zalo_error_message || ""}>
                        {m.zalo_error_message || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
