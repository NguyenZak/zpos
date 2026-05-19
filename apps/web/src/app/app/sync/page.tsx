"use client";

import React from "react";
import {
  CloudOff,
  CloudUpload,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  PackageCheck,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  listPendingOrders,
  deletePendingOrder,
  updatePendingOrder,
  clearSyncedOrders,
  type PendingOrderRecord,
} from "@/lib/offline/offline-db";
import {
  flushOfflineQueue,
  refreshCachedCatalog,
} from "@/lib/offline/sync";
import { getCachedProducts, getCachedCustomers } from "@/lib/offline/offline-db";

const STATUS_META: Record<
  PendingOrderRecord["status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  queued: {
    label: "Chờ đồng bộ",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  syncing: {
    label: "Đang đồng bộ",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  synced: {
    label: "Đã đồng bộ",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "Lỗi",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function formatTime(ms?: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

function formatVND(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v || 0);
}

export default function SyncPage() {
  const online = useOnlineStatus();
  const [rows, setRows] = React.useState<PendingOrderRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [refreshingCatalog, setRefreshingCatalog] = React.useState(false);
  const [productsCached, setProductsCached] = React.useState(0);
  const [customersCached, setCustomersCached] = React.useState(0);
  const [discardTarget, setDiscardTarget] = React.useState<PendingOrderRecord | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, prods, custs] = await Promise.all([
        listPendingOrders(),
        getCachedProducts(),
        getCachedCustomers(),
      ]);
      setRows(list);
      setProductsCached(prods.length);
      setCustomersCached(custs.length);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [load]);

  async function handleSync() {
    if (!online) {
      toast.error("Hiện đang offline — không thể đồng bộ");
      return;
    }
    setSyncing(true);
    try {
      const res = await flushOfflineQueue();
      if (res.ok > 0) toast.success(`Đã đồng bộ ${res.ok} đơn`);
      if (res.failed > 0) toast.error(`${res.failed} đơn còn lỗi`);
      if (res.ok === 0 && res.failed === 0) toast.info("Không có đơn nào cần đồng bộ");
      load();
    } finally {
      setSyncing(false);
    }
  }

  async function handleRetry(row: PendingOrderRecord) {
    await updatePendingOrder(row.id, { status: "queued", last_error: null });
    load();
  }

  async function handleDiscard() {
    if (!discardTarget) return;
    await deletePendingOrder(discardTarget.id);
    setDiscardTarget(null);
    toast.success("Đã xoá khỏi hàng đợi");
    load();
  }

  async function handleClearSynced() {
    const n = await clearSyncedOrders();
    if (n > 0) toast.success(`Đã dọn ${n} đơn đã đồng bộ`);
    load();
  }

  async function handleRefreshCatalog() {
    if (!online) {
      toast.error("Cần online để làm mới catalog");
      return;
    }
    setRefreshingCatalog(true);
    try {
      const res = await refreshCachedCatalog();
      toast.success(
        `Đã cache ${res.products} sản phẩm + ${res.customers} khách hàng`,
      );
      load();
    } finally {
      setRefreshingCatalog(false);
    }
  }

  const stats = React.useMemo(() => {
    const queued = rows.filter((r) => r.status === "queued").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const synced = rows.filter((r) => r.status === "synced").length;
    const totalAmount = rows
      .filter((r) => r.status !== "synced")
      .reduce((s, r) => s + Number(r.payload?.total_amount || 0), 0);
    return { queued, failed, synced, totalAmount };
  }, [rows]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-violet-600" />
            Đồng bộ offline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi các đơn được bán khi mất mạng & tình trạng đồng bộ với
            server. Catalog và khách hàng được cache để POS chạy được offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {online ? (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/30 gap-1.5 font-bold">
              <Wifi className="h-3 w-3" />
              Đang online
            </Badge>
          ) : (
            <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15 border-red-500/30 gap-1.5 font-bold">
              <WifiOff className="h-3 w-3" />
              Đang offline
            </Badge>
          )}
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncing || !online || stats.queued + stats.failed === 0}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="mr-2 h-4 w-4" />
            )}
            Đồng bộ ngay
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đơn chờ đồng bộ</CardDescription>
            <CardTitle className="text-2xl">{stats.queued + stats.failed}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs font-bold">
            <span className="text-amber-600">{stats.queued} chờ</span>
            {" · "}
            <span className="text-red-600">{stats.failed} lỗi</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng tiền chưa đồng bộ</CardDescription>
            <CardTitle className="text-2xl">{formatVND(stats.totalAmount)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-600 font-bold">
            Chưa ghi nhận trên server
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5" />
              Sản phẩm đã cache
            </CardDescription>
            <CardTitle className="text-2xl">{productsCached}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Dùng khi mất mạng
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Khách hàng đã cache
            </CardDescription>
            <CardTitle className="text-2xl">{customersCached}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Dùng khi mất mạng
          </CardContent>
        </Card>
      </div>

      {/* Catalog cache controls */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Catalog cache</CardTitle>
              <CardDescription>
                Cache sản phẩm + khách hàng vào IndexedDB để POS bán được khi
                mất mạng. Nên làm mới mỗi sáng trước khi mở quán.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleRefreshCatalog}
              disabled={refreshingCatalog || !online}
            >
              {refreshingCatalog ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Làm mới catalog
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Queue table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Hàng đợi đơn offline</CardTitle>
              <CardDescription>
                {rows.length === 0
                  ? "Không có đơn nào đang chờ đồng bộ."
                  : `${rows.length} đơn trong hàng đợi.`}
              </CardDescription>
            </div>
            {stats.synced > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearSynced}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Dọn {stats.synced} đơn đã đồng bộ
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <CloudOff className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold">Không có đơn nào trong hàng đợi</p>
              <p className="text-sm text-muted-foreground">
                Mọi đơn đã được đồng bộ với server.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian tạo</TableHead>
                  <TableHead>Mã đơn local</TableHead>
                  <TableHead>SP</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lần thử</TableHead>
                  <TableHead>Lỗi gần nhất</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.failed;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {formatTime(r.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>{r.payload?.order_number || r.id.slice(0, 8)}</div>
                        <div className="text-muted-foreground">{r.id.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.items?.length || 0} sản phẩm
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatVND(Number(r.payload?.total_amount || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1 font-bold ${meta.className}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.attempts || 0}
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[200px] truncate" title={r.last_error || ""}>
                        {r.last_error || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {r.status === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(r)}
                              className="h-7 px-2"
                              title="Thử lại"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDiscardTarget(r)}
                            className="h-7 px-2 text-red-600 hover:text-red-700"
                            title="Bỏ khỏi hàng đợi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Help */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs space-y-1.5 leading-relaxed">
        <p className="font-bold text-violet-700 dark:text-violet-400">
          💡 Cách Offline POS hoạt động
        </p>
        <p>
          1. Mỗi sáng (hoặc khi catalog thay đổi nhiều), bấm <b>Làm mới catalog</b>
          {" "}— sản phẩm + khách hàng được lưu vào trình duyệt.
        </p>
        <p>
          2. Khi mất mạng, POS tiếp tục bán bình thường — đơn được đưa vào hàng
          đợi local.
        </p>
        <p>
          3. Khi có mạng lại, hệ thống <b>tự đồng bộ</b>. Bạn cũng có thể đồng bộ
          tay tại đây.
        </p>
        <p>
          4. PWA đã được cài đặt: bấm "Cài ZPOS" trên trình duyệt để dùng như
          ứng dụng riêng (Chrome / Edge / Safari iOS).
        </p>
      </div>

      {/* Discard confirm */}
      <Dialog
        open={!!discardTarget}
        onOpenChange={(o) => !o && setDiscardTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bỏ đơn khỏi hàng đợi?</DialogTitle>
            <DialogDescription>
              Đơn{" "}
              <b>{discardTarget?.payload?.order_number || discardTarget?.id.slice(0, 8)}</b>{" "}
              ({formatVND(Number(discardTarget?.payload?.total_amount || 0))}) sẽ
              bị xoá khỏi hàng đợi local và <b>không bao giờ</b> được ghi lên
              server. Chỉ dùng khi đơn đó là sai/test.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardTarget(null)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Xác nhận xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
