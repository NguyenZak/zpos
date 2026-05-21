"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Edit,
  Eye,
  FileDown,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  Printer,
  RefreshCcw,
  Search,
  Trash2,
  User as UserIcon,
  X,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PrintInvoice } from "@/app/app/pos/_components/print-invoice";
import { EditOrderDialog } from "@/app/app/orders/_components/edit-order-dialog";
import { ReturnOrderDialog } from "@/app/app/orders/_components/return-order-dialog";
import { IssueInvoiceDialog } from "@/components/einvoice/issue-invoice-dialog";
import { IssueInvoiceButton } from "@/components/issue-invoice-button";
import { SendZaloButton } from "@/components/send-zalo-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { exportToCSV } from "@/lib/export-utils";
import { cn } from "@/lib/utils";
import { posService } from "@/services/pos.service";

interface MobileOrdersProps {
  orders: any[];
  branches?: any[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
}

const ISSUED_INVOICE_STATUSES = ["issued", "sent", "sent_to_tax", "synced", "adjusted", "replaced"];

const formatCurrency = (amount: number) => `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;

export function MobileOrders({ orders, branches = [], loading = false, onRefresh }: MobileOrdersProps) {
  const searchParams = useSearchParams();

  // Search + filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Detail drawer
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Action sheet
  const [actionTarget, setActionTarget] = useState<any | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  // Cancel/Delete confirmations
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Return
  const [returnTarget, setReturnTarget] = useState<any | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);

  // eInvoice
  const [invoiceTarget, setInvoiceTarget] = useState<any | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceStatusMap, setInvoiceStatusMap] = useState<Record<string, string>>({});

  // Print
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  // Build invoice status map from prop
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const o of orders) {
      if (o.invoice_status) map[o.id] = o.invoice_status;
    }
    setInvoiceStatusMap(map);
  }, [orders]);

  // Auto-open detail from URL ?order=ID
  useEffect(() => {
    const orderId = searchParams.get("order");
    if (!orderId || orders.length === 0) return;
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;
    setSelectedOrder(ord);
    setDetailOpen(true);
  }, [orders, searchParams]);

  // Filtered orders (mirror desktop logic)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = o.order_number?.toLowerCase().includes(q);
        const custMatch = (o.customer?.name || o.customer_name || "").toLowerCase().includes(q);
        if (!numMatch && !custMatch) return false;
      }
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      if (paymentFilter !== "all") {
        const isDebt =
          o.payment_method === "debt" || o.payment_status === "debt" || o.payment_status === "partial_debt";
        const isPaid = o.payment_status === "paid";
        if (paymentFilter === "debt_unpaid") {
          if (!isDebt || isPaid) return false;
        } else if (paymentFilter === "debt_paid") {
          if (!isDebt || !isPaid) return false;
        } else if (paymentFilter === "debt") {
          if (!isDebt) return false;
        } else if (o.payment_method !== paymentFilter) return false;
      }

      if (branchFilter !== "all" && o.branch_id !== branchFilter) return false;

      if (dateFilter !== "all") {
        const od = new Date(o.created_at);
        const now = new Date();
        if (dateFilter === "today") {
          if (od.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === "yesterday") {
          const y = new Date();
          y.setDate(now.getDate() - 1);
          if (od.toDateString() !== y.toDateString()) return false;
        } else if (dateFilter === "7days") {
          const a = new Date();
          a.setDate(now.getDate() - 7);
          if (od < a) return false;
        } else if (dateFilter === "thisMonth") {
          if (od.getMonth() !== now.getMonth() || od.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === "lastMonth") {
          const lm = new Date();
          lm.setMonth(now.getMonth() - 1);
          if (od.getMonth() !== lm.getMonth() || od.getFullYear() !== lm.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, branchFilter, dateFilter]);

  // Aggregated stats
  const stats = useMemo(() => {
    const totalCount = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const completedCount = filteredOrders.filter((o) => o.status === "completed").length;
    const completedRevenue = filteredOrders
      .filter((o) => o.status === "completed")
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    const cancelledCount = filteredOrders.filter((o) => o.status === "cancelled").length;
    const totalDebt = filteredOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + (o.debt_amount || 0), 0);
    return { totalCount, totalRevenue, completedCount, completedRevenue, cancelledCount, totalDebt };
  }, [filteredOrders]);

  const selectedOrders = useMemo(
    () => filteredOrders.filter((o) => selectedIds.has(o.id)),
    [filteredOrders, selectedIds],
  );
  const selectedCancelable = selectedOrders.filter((o) => o.status !== "cancelled");
  const selectedTotal = selectedOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

  const hasActiveFilters =
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    dateFilter !== "all" ||
    branchFilter !== "all" ||
    searchQuery !== "";

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (paymentFilter !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (branchFilter !== "all" ? 1 : 0);

  // -------- Actions --------
  const handlePrint = useCallback((ord: any) => {
    const items = ord.items || ord.order_items || [];
    const mapped = {
      order_number: ord.order_number,
      created_at: ord.created_at,
      total_amount: ord.total_amount,
      payment_method: ord.payment_method,
      customer:
        ord.customer?.name || ord.customer_name
          ? { name: ord.customer?.name || ord.customer_name, phone: ord.customer?.phone || ord.customer_phone || "" }
          : undefined,
      items: items.map((item: any) => {
        const prodName = item.variant?.product?.name || item.product_name || "Sản phẩm";
        const variantName =
          item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : "";
        return {
          product_name: `${prodName}${variantName}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        };
      }),
    };
    setPrintOrder(mapped);
    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 150);
  }, []);

  const handleCancel = useCallback(async () => {
    if (!cancellingId) return;
    setProcessing(true);
    try {
      await posService.cancelOrder(cancellingId);
      toast.success("Đã hủy đơn hàng");
      await onRefresh?.();
    } catch {
      toast.error("Lỗi khi hủy đơn hàng");
    } finally {
      setProcessing(false);
      setCancellingId(null);
    }
  }, [cancellingId, onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    setProcessing(true);
    try {
      await posService.deleteOrder(deletingId);
      toast.success("Đã xóa đơn hàng");
      await onRefresh?.();
    } catch {
      toast.error("Lỗi khi xóa đơn hàng");
    } finally {
      setProcessing(false);
      setDeletingId(null);
    }
  }, [deletingId, onRefresh]);

  const handleBulkCancel = useCallback(async () => {
    if (selectedCancelable.length === 0) return;
    setProcessing(true);
    try {
      await Promise.all(selectedCancelable.map((o) => posService.cancelOrder(o.id)));
      toast.success(`Đã hủy ${selectedCancelable.length} đơn`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await onRefresh?.();
    } catch {
      toast.error("Lỗi khi hủy nhiều đơn");
    } finally {
      setProcessing(false);
      setBulkCancelOpen(false);
    }
  }, [selectedCancelable, onRefresh]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedOrders.length === 0) return;
    setProcessing(true);
    try {
      await Promise.all(selectedOrders.map((o) => posService.deleteOrder(o.id)));
      toast.success(`Đã xóa ${selectedOrders.length} đơn`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await onRefresh?.();
    } catch {
      toast.error("Lỗi khi xóa nhiều đơn");
    } finally {
      setProcessing(false);
      setBulkDeleteOpen(false);
    }
  }, [selectedOrders, onRefresh]);

  const handleExport = useCallback((list: any[], filename: string) => {
    if (list.length === 0) {
      toast.info("Không có đơn hàng để xuất");
      return;
    }
    const rows = list.map((o) => ({
      "Mã đơn hàng": o.order_number,
      "Ngày tạo": format(new Date(o.created_at), "dd/MM/yyyy HH:mm", { locale: vi }),
      "Khách hàng": o.customer?.name || o.customer_name || "Khách lẻ",
      "Nhân viên bán": o.staff_name || "",
      "Sản phẩm": (o.items || o.order_items || [])
        .map((item: any) => {
          const prodName = item.variant?.product?.name || item.product_name || "Sản phẩm";
          const variantName =
            item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : "";
          return `${prodName}${variantName} x${item.quantity}`;
        })
        .join("; "),
      "Tổng tiền": o.total_amount || 0,
      "Thanh toán": o.payment_method || "",
      "Trạng thái thanh toán": o.payment_status || "",
      "Trạng thái đơn": o.status || "",
      "Còn nợ": o.debt_amount || 0,
    }));
    exportToCSV(rows, filename);
    toast.success(`Đã xuất CSV ${list.length} đơn`);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
    setBranchFilter("all");
  };

  const openIssueInvoice = (ord: any) => {
    setInvoiceTarget(ord);
    setInvoiceDialogOpen(true);
  };

  // Payment method label helpers
  const paymentLabel = (method?: string) =>
    method === "cash"
      ? "Tiền mặt"
      : method === "card"
        ? "Thẻ"
        : method === "transfer" || method === "bank" || method === "bank_transfer"
          ? "Chuyển khoản"
          : method === "debt"
            ? "Ghi nợ"
            : method || "—";

  // ---------- Render ----------
  return (
    <div className="flex flex-col h-full bg-background pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col gap-3 border-b pb-3">
        <div className="flex items-end justify-between mt-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              Danh sách đơn hàng
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Tra cứu hóa đơn & Trạng thái thanh toán
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport(filteredOrders, "bao_cao_don_hang")}
              className="h-9 px-2 gap-1 text-xs font-bold"
            >
              <FileDown className="w-3.5 h-3.5" />
              CSV
            </Button>
            <Button
              size="sm"
              variant={selectionMode ? "default" : "outline"}
              onClick={() => {
                setSelectionMode((m) => !m);
                if (selectionMode) setSelectedIds(new Set());
              }}
              className="h-9 px-2 gap-1 text-xs font-bold"
            >
              {selectionMode ? "Xong" : "Chọn"}
            </Button>
          </div>
        </div>

        {/* SEARCH BAR + FILTER */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Tìm mã đơn, khách hàng..."
              className="pl-10 h-10 bg-muted/40 border-none shadow-none rounded-xl text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterDrawerOpen(true)}
            className="relative h-10 w-10 rounded-xl shrink-0"
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* STATUS CHIPS */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none snap-x snap-mandatory">
          {[
            { val: "all", label: "Tất cả" },
            { val: "completed", label: "Hoàn tất" },
            { val: "processing", label: "Đang xử lý" },
            { val: "cancelled", label: "Đã hủy" },
          ].map((s) => (
            <button
              key={s.val}
              onClick={() => setStatusFilter(s.val)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border snap-start active:scale-95 ${
                statusFilter === s.val
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-muted hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border bg-card text-rose-600 border-rose-200 active:scale-95 flex items-center gap-1"
            >
              <RefreshCcw className="w-3 h-3" /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* STATS — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto px-1 py-3 scrollbar-none snap-x snap-mandatory">
        <StatCard
          label="Tổng đơn"
          value={`${stats.totalCount} đơn`}
          icon={<ClipboardList className="w-3.5 h-3.5" />}
          color="primary"
        />
        <StatCard
          label="Doanh số"
          value={formatCurrency(stats.totalRevenue)}
          icon={<span className="font-extrabold text-[10px]">₫</span>}
          color="emerald"
        />
        <StatCard
          label="Thực nhận"
          value={formatCurrency(stats.completedRevenue)}
          subLabel={`${stats.completedCount} đơn hoàn tất`}
          icon={<span className="font-extrabold text-[9px]">OK</span>}
          color="sky"
        />
        <StatCard
          label="Doanh số ghi nợ"
          value={formatCurrency(stats.totalDebt)}
          icon={<CircleAlert className="w-3.5 h-3.5" />}
          color="amber"
        />
        <StatCard
          label="Đơn đã hủy"
          value={`${stats.cancelledCount} đơn`}
          icon={<span className="font-extrabold text-[10px]">✕</span>}
          color="red"
        />
      </div>

      {/* SELECTION TOOLBAR */}
      {selectionMode && selectedOrders.length > 0 && (
        <div className="flex flex-col gap-2 mb-2 px-3 py-2 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <Badge variant="secondary" className="font-bold">
              {selectedOrders.length} đơn đã chọn
            </Badge>
            <span className="text-muted-foreground">
              Tổng: <span className="font-bold text-foreground">{formatCurrency(selectedTotal)}</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport(selectedOrders, "don_hang_da_chon")}
              className="flex-1 h-9 text-xs font-bold"
            >
              <FileDown className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkCancelOpen(true)}
              disabled={selectedCancelable.length === 0 || processing}
              className="flex-1 h-9 text-xs font-bold text-amber-700"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Hủy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={processing}
              className="flex-1 h-9 text-xs font-bold text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
            </Button>
          </div>
        </div>
      )}

      {/* ORDERS CARD LIST */}
      <div className="flex-1 overflow-y-auto pt-1 pr-1 scrollbar-none pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách đơn hàng...
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-2.5">
            {filteredOrders.map((ord) => {
              const custName = ord.customer?.name || ord.customer_name || "Khách lẻ";
              const dateStr =
                new Date(ord.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) +
                " - " +
                new Date(ord.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

              const isDebt =
                ord.payment_method === "debt" ||
                ord.payment_status === "debt" ||
                ord.payment_status === "partial_debt";
              const isPaidDebt = isDebt && ord.payment_status === "paid";
              const hasReturns = ord.return_orders && ord.return_orders.length > 0;
              const invStatus = invoiceStatusMap[ord.id];
              const invIssued = ISSUED_INVOICE_STATUSES.includes(invStatus || "");
              const isSelected = selectedIds.has(ord.id);

              return (
                <Card
                  key={ord.id}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(ord.id);
                    } else {
                      setSelectedOrder(ord);
                      setDetailOpen(true);
                    }
                  }}
                  className={cn(
                    "border rounded-lg active:scale-[0.98] transition-all bg-card cursor-pointer",
                    isSelected ? "border-primary border-2" : "border-muted/50",
                  )}
                >
                  <CardContent className="p-3 flex items-start gap-2.5">
                    {selectionMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(ord.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-foreground font-mono leading-none">
                          {ord.order_number}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[8px] h-4.5 px-1.5 py-0 font-bold uppercase",
                            ord.status === "completed" &&
                              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none",
                            ord.status === "cancelled" && "bg-destructive/10 text-destructive border-none",
                            ord.status !== "completed" &&
                              ord.status !== "cancelled" &&
                              "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none",
                          )}
                        >
                          {ord.status === "completed"
                            ? "Hoàn tất"
                            : ord.status === "cancelled"
                              ? "Đã hủy"
                              : "Đang xử lý"}
                        </Badge>
                        {hasReturns && (
                          <Badge
                            variant="outline"
                            className="text-[8px] h-4.5 px-1 bg-orange-50 text-orange-600 border-orange-200"
                          >
                            Hoàn trả
                          </Badge>
                        )}
                        {invIssued && (
                          <Badge
                            variant="outline"
                            className="text-[8px] h-4.5 px-1 bg-emerald-50 text-emerald-600 border-emerald-200 gap-0.5"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" /> HĐĐT
                          </Badge>
                        )}
                        {invStatus === "failed" && (
                          <Badge
                            variant="outline"
                            className="text-[8px] h-4.5 px-1 bg-red-50 text-red-500 border-red-200 gap-0.5"
                          >
                            <AlertCircle className="w-2.5 h-2.5" /> Lỗi HĐ
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-foreground truncate">{custName}</p>
                      {ord.staff_name && (
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <UserIcon className="w-3 h-3" /> {ord.staff_name}
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 text-primary" />
                        {dateStr}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-black font-mono text-primary">
                        {formatCurrency(ord.total_amount)}
                      </p>
                      {isDebt ? (
                        isPaidDebt ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            Nợ đã trả
                          </Badge>
                        ) : (
                          <>
                            <Badge className="text-[9px] h-4 px-1 bg-rose-500 text-white">Nợ chưa trả</Badge>
                            {ord.debt_amount > 0 && (
                              <p className="text-[9px] font-extrabold text-amber-600">
                                Còn nợ: {formatCurrency(ord.debt_amount)}
                              </p>
                            )}
                          </>
                        )
                      ) : (
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">
                          {paymentLabel(ord.payment_method)}
                        </p>
                      )}
                      {!selectionMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionTarget(ord);
                            setActionOpen(true);
                          }}
                          className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground ml-auto"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border border-dashed rounded-lg">
            <p className="text-xs text-muted-foreground font-bold">Không tìm thấy đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* FILTER DRAWER */}
      <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DrawerContent className="pb-6 max-h-[80vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base font-black">Bộ lọc đơn hàng</DrawerTitle>
            <DrawerDescription className="text-xs">Lọc danh sách theo các điều kiện</DrawerDescription>
          </DrawerHeader>
          <div className="px-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thời gian</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="yesterday">Hôm qua</SelectItem>
                  <SelectItem value="7days">7 ngày qua</SelectItem>
                  <SelectItem value="thisMonth">Tháng này</SelectItem>
                  <SelectItem value="lastMonth">Tháng trước</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Phương thức thanh toán
              </label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thanh toán</SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="debt">Ghi nợ (Tất cả)</SelectItem>
                  <SelectItem value="debt_unpaid">Nợ chưa trả</SelectItem>
                  <SelectItem value="debt_paid">Nợ đã trả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {branches.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Chi nhánh
                </label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DrawerFooter className="flex-row gap-2 pt-4">
            <Button variant="outline" onClick={resetFilters} className="flex-1 h-11 font-bold">
              <RefreshCcw className="w-4 h-4 mr-1.5" /> Xóa hết
            </Button>
            <Button onClick={() => setFilterDrawerOpen(false)} className="flex-1 h-11 font-bold">
              Áp dụng
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* DETAIL DRAWER */}
      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="pb-6 bg-background max-h-[92vh]">
          {selectedOrder && (
            <>
              <DrawerHeader className="text-left border-b pb-3 px-6">
                <div className="flex justify-between items-center mt-2">
                  <div className="min-w-0">
                    <DrawerTitle className="text-base font-black tracking-tight flex items-center gap-2">
                      Chi tiết:{" "}
                      <span className="text-primary font-mono">{selectedOrder.order_number}</span>
                    </DrawerTitle>
                    <DrawerDescription className="text-xs text-muted-foreground">
                      {format(new Date(selectedOrder.created_at), "dd MMMM yyyy, HH:mm", { locale: vi })}
                    </DrawerDescription>
                  </div>
                  <DrawerClose asChild>
                    <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="px-6 py-3 space-y-3 overflow-y-auto max-h-[58vh] scrollbar-none">
                {/* Status + Payment summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 p-2.5 rounded-xl border">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Trạng thái</span>
                    <div className="mt-1">
                      <Badge
                        className={cn(
                          "text-[9px] font-bold uppercase",
                          selectedOrder.status === "completed" && "bg-emerald-500 text-white",
                          selectedOrder.status === "cancelled" && "bg-red-500 text-white",
                          selectedOrder.status !== "completed" &&
                            selectedOrder.status !== "cancelled" &&
                            "bg-amber-500 text-white",
                        )}
                      >
                        {selectedOrder.status === "completed"
                          ? "Hoàn tất"
                          : selectedOrder.status === "cancelled"
                            ? "Đã hủy"
                            : "Đang xử lý"}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-xl border">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Thanh toán</span>
                    <p className="mt-1 text-xs font-bold text-primary uppercase">
                      {paymentLabel(selectedOrder.payment_method)}
                    </p>
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Khách hàng & Người bán
                  </span>
                  <div className="bg-card border border-muted/50 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Khách:</span>
                      <span className="font-bold text-foreground text-right truncate">
                        {selectedOrder.customer?.name || selectedOrder.customer_name || "Khách lẻ"}
                      </span>
                    </div>
                    {(selectedOrder.customer?.phone || selectedOrder.customer_phone) && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">SĐT:</span>
                        <span className="font-semibold text-right">
                          {selectedOrder.customer?.phone || selectedOrder.customer_phone}
                        </span>
                      </div>
                    )}
                    {(selectedOrder.customer?.address || selectedOrder.customer_address) && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Địa chỉ:</span>
                        <span className="font-semibold text-right truncate">
                          {selectedOrder.customer?.address || selectedOrder.customer_address}
                        </span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Nhân viên bán:</span>
                      <span className="font-bold text-right">{selectedOrder.staff_name || "Không xác định"}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Sản phẩm đã mua
                  </span>
                  <div className="space-y-1.5">
                    {(selectedOrder.items || selectedOrder.order_items || []).length > 0 ? (
                      (selectedOrder.items || selectedOrder.order_items).map((item: any, idx: number) => {
                        const prodName = item.variant?.product?.name || item.product_name || "Sản phẩm";
                        const variantName =
                          item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : "";
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-muted/40 text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-foreground truncate">
                                {prodName}
                                {variantName}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                SL: x{item.quantity ?? 1} × {formatCurrency(item.unit_price ?? 0)}
                              </p>
                            </div>
                            <span className="font-black text-primary shrink-0 font-mono">
                              {formatCurrency(item.total_price ?? (item.unit_price ?? 0) * (item.quantity ?? 1))}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-muted/40 text-xs">
                        <span>Không có chi tiết</span>
                        <span className="text-primary font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Refund history */}
                {selectedOrder.return_orders && selectedOrder.return_orders.length > 0 && (
                  <div className="flex justify-between text-xs text-orange-600 font-semibold p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                    <span>Đã hoàn tiền ({selectedOrder.return_orders.length} lần):</span>
                    <span className="font-bold">
                      -
                      {formatCurrency(
                        selectedOrder.return_orders.reduce(
                          (acc: number, curr: any) => acc + (Number(curr.total_refund_amount) || 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="bg-muted/40 rounded-xl border border-muted p-3 text-xs space-y-1.5 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  {selectedOrder.debt_amount > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Còn nợ:</span>
                      <span>{formatCurrency(selectedOrder.debt_amount)}</span>
                    </div>
                  )}
                  <Separator className="border-dashed my-1" />
                  <div className="flex justify-between text-sm font-black">
                    <span className="text-foreground">TỔNG THANH TOÁN</span>
                    <span className="text-primary font-mono">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <DrawerFooter className="px-6 gap-2 border-t pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePrint(selectedOrder)}
                    className="h-11 text-xs font-bold gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> In bill
                  </Button>
                  <SendZaloButton
                    event="order_paid"
                    orderId={selectedOrder.id}
                    customerId={selectedOrder.customer?.id || selectedOrder.customer_id}
                    defaultPhone={
                      selectedOrder.customer?.phone || selectedOrder.customer_phone
                    }
                    templateData={{
                      order_number: selectedOrder.order_number || selectedOrder.id,
                      total: new Intl.NumberFormat("vi-VN").format(Number(selectedOrder.total_amount || 0)),
                      customer_name: selectedOrder.customer?.name || selectedOrder.customer_name || "Quý khách",
                    }}
                    variant="outline"
                  />
                </div>
                <IssueInvoiceButton
                  orderId={selectedOrder.id}
                  buyer={{
                    name: selectedOrder.customer?.name || selectedOrder.customer_name,
                    address: selectedOrder.customer?.address || selectedOrder.customer_address,
                    phone: selectedOrder.customer?.phone || selectedOrder.customer_phone,
                  }}
                  items={(selectedOrder.items || selectedOrder.order_items || []).map((it: any) => ({
                    name: it.variant?.product?.name || it.product_name || "Sản phẩm",
                    quantity: Number(it.quantity || 1),
                    unit_price: Number(it.unit_price || 0),
                    total: Number(it.total_price || (it.quantity || 1) * (it.unit_price || 0)),
                  }))}
                  variant="outline"
                />
                {selectedOrder.status === "completed" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReturnTarget(selectedOrder);
                      setReturnOpen(true);
                    }}
                    className="h-11 text-xs font-bold gap-1.5 text-orange-600 border-orange-200"
                  >
                    <RefreshCcw className="w-4 h-4" /> Trả hàng / Hoàn tiền
                  </Button>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(selectedOrder.id);
                      setEditOpen(true);
                    }}
                    className="h-10 text-xs font-bold gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Sửa
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCancellingId(selectedOrder.id)}
                    className="h-10 text-xs font-bold gap-1 text-amber-700"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Hủy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeletingId(selectedOrder.id)}
                    className="h-10 text-xs font-bold gap-1 text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ACTION SHEET (per-row quick actions) */}
      <Drawer open={actionOpen} onOpenChange={setActionOpen}>
        <DrawerContent className="pb-6">
          {actionTarget && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-sm font-black">
                  Thao tác: <span className="text-primary font-mono">{actionTarget.order_number}</span>
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 space-y-1">
                <ActionRow
                  icon={<Eye className="w-4 h-4" />}
                  label="Xem chi tiết"
                  onClick={() => {
                    setSelectedOrder(actionTarget);
                    setActionOpen(false);
                    setDetailOpen(true);
                  }}
                />
                <ActionRow
                  icon={<Printer className="w-4 h-4" />}
                  label="In bill"
                  onClick={() => {
                    handlePrint(actionTarget);
                    setActionOpen(false);
                  }}
                />
                {!ISSUED_INVOICE_STATUSES.includes(invoiceStatusMap[actionTarget.id] || "") &&
                  actionTarget.status !== "cancelled" && (
                    <ActionRow
                      icon={<FileText className="w-4 h-4 text-violet-600" />}
                      label="Xuất hóa đơn điện tử"
                      onClick={() => {
                        openIssueInvoice(actionTarget);
                        setActionOpen(false);
                      }}
                      className="text-violet-600"
                    />
                  )}
                {actionTarget.status === "completed" && (
                  <ActionRow
                    icon={<RefreshCcw className="w-4 h-4 text-orange-600" />}
                    label="Trả hàng / Hoàn tiền"
                    onClick={() => {
                      setReturnTarget(actionTarget);
                      setReturnOpen(true);
                      setActionOpen(false);
                    }}
                    className="text-orange-600"
                  />
                )}
                <Separator className="my-1.5" />
                <ActionRow
                  icon={<Edit className="w-4 h-4" />}
                  label="Chỉnh sửa"
                  onClick={() => {
                    setEditingId(actionTarget.id);
                    setEditOpen(true);
                    setActionOpen(false);
                  }}
                />
                <ActionRow
                  icon={<XCircle className="w-4 h-4 text-amber-600" />}
                  label="Hủy đơn"
                  onClick={() => {
                    setCancellingId(actionTarget.id);
                    setActionOpen(false);
                  }}
                  className="text-amber-600"
                />
                <ActionRow
                  icon={<Trash2 className="w-4 h-4 text-destructive" />}
                  label="Xóa đơn hàng"
                  onClick={() => {
                    setDeletingId(actionTarget.id);
                    setActionOpen(false);
                  }}
                  className="text-destructive"
                />
              </div>
              <DrawerFooter>
                <Button variant="outline" onClick={() => setActionOpen(false)} className="font-bold">
                  Đóng
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* CANCEL CONFIRM */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ chuyển trạng thái đơn hàng sang "Đã hủy". Bạn có thể thay đổi lại sau nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Quay lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={processing}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE CONFIRM */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive">
              Xác nhận xóa vĩnh viễn đơn hàng?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này <strong>không thể khôi phục</strong>. Hóa đơn và toàn bộ chi tiết sẽ bị xóa khỏi
              cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processing}
              className="bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BULK CANCEL CONFIRM */}
      <AlertDialog open={bulkCancelOpen} onOpenChange={setBulkCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy {selectedCancelable.length} đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Các đơn đã chọn sẽ được chuyển sang "Đã hủy". Đơn đã hủy sẵn sẽ được bỏ qua.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Quay lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancel}
              disabled={processing}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* BULK DELETE CONFIRM */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive">
              Xóa vĩnh viễn {selectedOrders.length} đơn hàng?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể khôi phục. Toàn bộ đơn hàng đã chọn và chi tiết đi kèm sẽ bị xóa khỏi cơ
              sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={processing}
              className="bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EDIT DIALOG */}
      <EditOrderDialog
        orderId={editingId}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingId(null);
        }}
        onSuccess={() => {
          onRefresh?.();
        }}
      />

      {/* RETURN DIALOG */}
      {returnTarget && (
        <ReturnOrderDialog
          order={returnTarget}
          open={returnOpen}
          onOpenChange={(open) => {
            setReturnOpen(open);
            if (!open) setTimeout(() => setReturnTarget(null), 200);
          }}
          onSuccess={() => {
            onRefresh?.();
          }}
        />
      )}

      {/* INVOICE DIALOG */}
      {invoiceTarget && (
        <IssueInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={(open) => {
            setInvoiceDialogOpen(open);
            if (!open) setInvoiceTarget(null);
          }}
          orderId={invoiceTarget.id}
          branchId={invoiceTarget.branch_id}
          cartItems={(invoiceTarget.items || invoiceTarget.order_items || []).map((item: any) => ({
            product_name:
              (item.variant?.product?.name || item.product_name || "Sản phẩm") +
              (item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : ""),
            product_id: item.variant?.product_id || undefined,
            order_item_id: item.id || undefined,
            sku: item.variant?.sku || undefined,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount || 0,
          }))}
          totalAmount={invoiceTarget.total_amount}
          paymentMethod={invoiceTarget.payment_method}
          onSuccess={(invoice) => {
            setInvoiceStatusMap((prev) => ({
              ...prev,
              [invoiceTarget.id]: invoice.status,
            }));
          }}
        />
      )}

      {/* PRINT */}
      {printOrder && <PrintInvoice order={printOrder} />}
    </div>
  );
}

// ---------- Helper components ----------
function StatCard({
  label,
  value,
  subLabel,
  icon,
  color,
}: {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ReactNode;
  color: "primary" | "emerald" | "sky" | "amber" | "red";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-500",
    sky: "bg-sky-500/10 text-sky-500",
    amber: "bg-amber-500/10 text-amber-500",
    red: "bg-red-500/10 text-red-500",
  };
  const valueColorMap = {
    primary: "text-obsidian",
    emerald: "text-emerald-600",
    sky: "text-sky-600",
    amber: "text-amber-600",
    red: "text-red-500",
  };
  return (
    <div className="shrink-0 w-[150px] rounded-xl border bg-card p-3 shadow-sm snap-start">
      <div className="flex items-center justify-between pb-1">
        <span className="font-bold text-[9px] text-ash uppercase tracking-wider truncate">{label}</span>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className={`font-black text-sm font-mono ${valueColorMap[color]} truncate`}>{value}</div>
      {subLabel && <p className="mt-0.5 text-[9px] text-ash truncate">{subLabel}</p>}
    </div>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 text-sm font-semibold text-left active:scale-[0.98] transition-all",
        className,
      )}
    >
      {icon}
      {label}
    </button>
  );
}
