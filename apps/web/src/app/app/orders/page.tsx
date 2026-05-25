"use client";

import React, { useCallback, useEffect, useState } from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Edit,
  Eye,
  FileDown,
  FileText,
  Loader2,
  MoreHorizontal,
  Printer,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PrintInvoice } from "@/app/app/pos/_components/print-invoice";
import { IssueInvoiceDialog } from "@/components/einvoice/issue-invoice-dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";

import { MobileOrders } from "../_components/mobile/mobile-orders";
import { EditOrderDialog } from "./_components/edit-order-dialog";
import { OrderDetailDialog } from "./_components/order-detail-dialog";
import { ReturnOrderDialog } from "./_components/return-order-dialog";

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status?: string;
  payment_amount_received?: number;
  debt_amount?: number;
  customer_address?: string;
  customer_phone?: string;
  created_at: string;
  branch_id?: string;
  staff_id?: string | null;
  staff_name?: string | null;
  order_items?: any[];
  return_orders?: any[];
  invoice_status?: string | null;
  source?: string;
  online_status?: string;
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const [data, setData] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [bulkCancelAlertOpen, setBulkCancelAlertOpen] = useState(false);
  const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState<"cancel" | "delete" | null>(null);

  // View & Print states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  // Return Order states
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);

  // eInvoice state
  const [invoiceTarget, setInvoiceTarget] = useState<Order | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  // Track which orders already have invoices (invoice_status)
  const [orderInvoiceStatus, setOrderInvoiceStatus] = useState<Record<string, string>>({});

  function openIssueInvoice(order: Order) {
    setInvoiceTarget(order);
    setInvoiceDialogOpen(true);
  }

  const handlePrint = (order: Order) => {
    const mappedOrder = {
      order_number: order.order_number,
      created_at: order.created_at,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      customer: order.customer_name ? { name: order.customer_name, phone: "" } : undefined,
      items: (order.order_items ?? []).map((item: any) => {
        const prodName = item.variant?.product?.name || "Sản phẩm";
        const variantName = item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : "";
        return {
          product_name: `${prodName}${variantName}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        };
      }),
    };

    setPrintOrder(mappedOrder);

    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 150);
  };

  // Search & Filters states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);

  const handleCancelOrder = async () => {
    if (!cancellingId) return;
    try {
      await posService.cancelOrder(cancellingId);
      toast.success("Đã hủy đơn hàng", {
        description: "Trạng thái đơn hàng đã được chuyển sang Đã hủy.",
      });
      await loadOrders();
    } catch (_error) {
      toast.error("Lỗi khi hủy đơn hàng");
    } finally {
      setCancelAlertOpen(false);
      setCancellingId(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingId) return;
    try {
      await posService.deleteOrder(deletingId);
      toast.success("Đã xóa đơn hàng", {
        description: "Hóa đơn và toàn bộ sản phẩm liên quan đã được xóa khỏi hệ thống.",
      });
      await loadOrders();
    } catch (_error) {
      toast.error("Lỗi khi xóa đơn hàng");
    } finally {
      setDeleteAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả đơn trên trang"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chọn đơn ${row.original.order_number}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "order_number",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="font-bold">{row.getValue("order_number")}</span>
          {row.original.source === "online" && (
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
              Online
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <span>{format(date, "dd/MM/yyyy HH:mm", { locale: vi })}</span>;
      },
    },
    {
      accessorKey: "customer_name",
      header: "Khách hàng",
      cell: ({ row }) => <span>{row.getValue("customer_name") || "Khách lẻ"}</span>,
    },
    {
      accessorKey: "staff_name",
      header: "Nhân viên bán",
      cell: ({ row }) => {
        const name = row.original.staff_name;
        return name ? (
          <span className="font-semibold">{name}</span>
        ) : (
          <span className="text-muted-foreground text-xs italic">Không xác định</span>
        );
      },
    },
    {
      id: "products",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const items = row.original.order_items || [];
        if (items.length === 0) return <span className="text-muted-foreground text-xs italic">Không có chi tiết</span>;

        const productsSummary = items
          .map((item: any) => {
            const prodName = item.variant?.product?.name || "Sản phẩm";
            const variantName = item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : "";
            return `${prodName}${variantName} x${item.quantity}`;
          })
          .join(", ");

        return (
          <div className="max-w-[220px] truncate font-semibold text-muted-foreground text-xs" title={productsSummary}>
            {productsSummary}
          </div>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: "Tổng tiền",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total_amount"));
        return <div className="font-black text-primary">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "payment_method",
      header: "Thanh toán",
      cell: ({ row }) => {
        const method = row.getValue("payment_method") as string;
        const status = row.original.payment_status;

        const isDebt = method === "debt" || status === "debt" || status === "partial_debt";
        const isPaid = status === "paid";

        if (isDebt) {
          const unpaidAmount =
            row.original.debt_amount ?? row.original.total_amount - (row.original.payment_amount_received || 0);

          if (isPaid) {
            return (
              <div className="flex flex-col gap-1">
                <Badge
                  variant="outline"
                  className="w-fit border-green-500/20 bg-green-500/10 font-bold text-green-600 capitalize"
                >
                  Nợ đã trả
                </Badge>
                {method !== "debt" && (
                  <span className="font-semibold text-[10px] text-muted-foreground uppercase">
                    Qua{" "}
                    {method === "cash"
                      ? "Tiền mặt"
                      : method === "card"
                        ? "Thẻ"
                        : method === "transfer"
                          ? "Chuyển khoản"
                          : method}
                  </span>
                )}
              </div>
            );
          }
          const isPartial = status === "partial_debt" || (unpaidAmount < row.original.total_amount && unpaidAmount > 0);
          return (
            <div className="flex flex-col gap-1">
              <Badge className="w-fit bg-rose-500 font-bold text-white capitalize hover:bg-rose-600">
                {isPartial ? "Nợ trả một phần" : "Nợ chưa trả"}
              </Badge>
              {unpaidAmount > 0 && (
                <span className="font-extrabold text-[10px] text-amber-600 uppercase">
                  Còn nợ: {formatCurrency(unpaidAmount)}
                </span>
              )}
            </div>
          );
        }

        const label =
          method === "cash"
            ? "Tiền mặt"
            : method === "card"
              ? "Thẻ"
              : method === "transfer"
                ? "Chuyển khoản"
                : method || "—";

        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit capitalize">
              {label}
            </Badge>
            {status && status !== "paid" && (
              <span className="font-bold text-[10px] text-muted-foreground uppercase">
                {status === "pending" ? "Chờ thanh toán" : status === "refunded" ? "Đã hoàn" : status}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const _variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        let label = "Đang xử lý";
        let className = "bg-yellow-500 hover:bg-yellow-600";

        if (status === "completed") {
          label = "Hoàn tất";
          className = "bg-green-500 hover:bg-green-600 text-white";
        } else if (status === "cancelled") {
          label = "Đã hủy";
          className = "bg-red-500 hover:bg-red-600 text-white";
        }

        const onlineStatus = row.original.online_status;
        const hasReturns = row.original.return_orders && row.original.return_orders.length > 0;

        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge className={className}>{label}</Badge>
            {row.original.source === "online" && onlineStatus && (
              <span className="font-semibold text-[10px] text-blue-600 uppercase">
                {onlineStatus === "pending" ? "Đã tiếp nhận" : onlineStatus}
              </span>
            )}
            {hasReturns && (
              <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
                Có hoàn trả
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "invoice_status",
      header: "HĐĐT",
      cell: ({ row }) => {
        const invStatus = orderInvoiceStatus[row.original.id];
        if (invStatus === "issued" || invStatus === "sent" || invStatus === "sent_to_tax" || invStatus === "synced") {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã xuất
            </span>
          );
        }
        if (invStatus === "failed") {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-red-500 text-xs">
              <AlertCircle className="h-3.5 w-3.5" /> Lỗi
            </span>
          );
        }
        if (row.original.status === "cancelled") {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <button
            type="button"
            onClick={() => openIssueInvoice(row.original)}
            className="inline-flex items-center gap-1 font-bold text-violet-600 text-xs hover:text-violet-700 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" /> Xuất HĐ
          </button>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const hasInvoice = ["issued", "sent", "sent_to_tax", "synced", "adjusted", "replaced"].includes(
          orderInvoiceStatus[row.original.id] || "",
        );
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setSelectedOrder(row.original);
                  setDetailOpen(true);
                }}
              >
                <Eye className="h-4 w-4" /> Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => handlePrint(row.original)}>
                <Printer className="h-4 w-4" /> In bill
              </DropdownMenuItem>
              {/* eInvoice action */}
              {!hasInvoice && row.original.status !== "cancelled" && (
                <DropdownMenuItem
                  className="gap-2 text-violet-600 focus:bg-violet-50 focus:text-violet-600"
                  onClick={() => openIssueInvoice(row.original)}
                >
                  <FileText className="h-4 w-4" /> Xuất hoá đơn điện tử
                </DropdownMenuItem>
              )}
              {row.original.status === "completed" && (
                <DropdownMenuItem
                  className="gap-2 text-orange-600 focus:bg-orange-50 focus:text-orange-600"
                  onClick={() => {
                    setReturnTarget(row.original);
                    setReturnOpen(true);
                  }}
                >
                  <RefreshCcw className="h-4 w-4" /> Trả hàng / Hoàn tiền
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setEditingId(row.original.id);
                  setEditOpen(true);
                }}
              >
                <Edit className="h-4 w-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-amber-600 focus:bg-amber-50 focus:text-amber-600"
                onClick={() => {
                  setCancellingId(row.original.id);
                  setCancelAlertOpen(true);
                }}
              >
                <XCircle className="h-4 w-4" /> Hủy đơn
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 font-semibold text-destructive focus:bg-destructive/5 focus:text-destructive"
                onClick={() => {
                  setDeletingId(row.original.id);
                  setDeleteAlertOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" /> Xóa đơn hàng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Memoized search and filters logic
  const filteredData = React.useMemo(() => {
    return data.filter((o) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const numMatch = o.order_number?.toLowerCase().includes(query);
        const custMatch = o.customer_name?.toLowerCase().includes(query);
        if (!numMatch && !custMatch) return false;
      }

      // 2. Status filter
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      // 3. Payment method filter
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
        } else {
          if (o.payment_method !== paymentFilter) return false;
        }
      }

      // 4. Branch filter
      if (branchFilter !== "all" && o.branch_id !== branchFilter) return false;

      // 5. Date filter
      if (dateFilter !== "all") {
        const orderDate = new Date(o.created_at);
        const now = new Date();

        if (dateFilter === "today") {
          if (orderDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          if (orderDate.toDateString() !== yesterday.toDateString()) return false;
        } else if (dateFilter === "7days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === "thisMonth") {
          if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === "lastMonth") {
          const lastMonth = new Date();
          lastMonth.setMonth(now.getMonth() - 1);
          if (orderDate.getMonth() !== lastMonth.getMonth() || orderDate.getFullYear() !== lastMonth.getFullYear())
            return false;
        }
      }

      // 6. Source filter
      if (sourceFilter !== "all" && o.source !== sourceFilter) return false;

      return true;
    });
  }, [data, searchQuery, statusFilter, paymentFilter, branchFilter, dateFilter, sourceFilter]);

  // Aggregate stats from filteredData
  const stats = React.useMemo(() => {
    const totalCount = filteredData.length;
    const totalRevenue = filteredData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const completedCount = filteredData.filter((o) => o.status === "completed").length;
    const completedRevenue = filteredData
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const cancelledCount = filteredData.filter((o) => o.status === "cancelled").length;
    const totalDebt = filteredData
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.debt_amount || 0), 0);

    return {
      totalCount,
      totalRevenue,
      completedCount,
      completedRevenue,
      cancelledCount,
      totalDebt,
    };
  }, [filteredData]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedOrders = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedOrders.length;
  const selectedTotal = selectedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const selectedCancelableOrders = selectedOrders.filter((order) => order.status !== "cancelled");
  const singleSelectedOrder = selectedCount === 1 ? selectedOrders[0] : null;
  const singleSelectedHasInvoice = singleSelectedOrder
    ? ["issued", "sent", "sent_to_tax", "synced", "adjusted", "replaced"].includes(
        orderInvoiceStatus[singleSelectedOrder.id] || "",
      )
    : false;

  const toExportRows = (orders: Order[]) =>
    orders.map((order) => ({
      "Mã đơn hàng": order.order_number,
      "Ngày tạo": format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: vi }),
      "Khách hàng": order.customer_name || "Khách lẻ",
      "Nhân viên bán": order.staff_name || "",
      "Sản phẩm": (order.order_items ?? [])
        .map((item: any) => {
          const prodName = item.variant?.product?.name || "Sản phẩm";
          const variantName = item.variant?.name && item.variant.name !== "Default" ? ` (${item.variant.name})` : "";
          return `${prodName}${variantName} x${item.quantity}`;
        })
        .join("; "),
      "Tổng tiền": order.total_amount || 0,
      "Thanh toán": order.payment_method || "",
      "Trạng thái thanh toán": order.payment_status || "",
      "Trạng thái đơn": order.status || "",
      "Còn nợ": order.debt_amount || 0,
    }));

  const handleExportOrders = (orders: Order[], filename: string) => {
    if (orders.length === 0) {
      toast.info("Không có đơn hàng để xuất");
      return;
    }

    exportToCSV(toExportRows(orders), filename);
    toast.success("Đã xuất CSV", {
      description: `${orders.length} đơn hàng đã được đưa vào file xuất.`,
    });
  };

  const handleBulkCancelOrders = async () => {
    if (selectedCancelableOrders.length === 0) return;

    setBulkProcessing("cancel");
    try {
      await Promise.all(selectedCancelableOrders.map((order) => posService.cancelOrder(order.id)));
      toast.success("Đã hủy các đơn đã chọn", {
        description: `${selectedCancelableOrders.length} đơn hàng đã được chuyển sang Đã hủy.`,
      });
      setRowSelection({});
      await loadOrders();
    } catch (_error) {
      toast.error("Lỗi khi hủy nhiều đơn hàng");
    } finally {
      setBulkProcessing(null);
      setBulkCancelAlertOpen(false);
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) return;

    setBulkProcessing("delete");
    try {
      await Promise.all(selectedOrders.map((order) => posService.deleteOrder(order.id)));
      toast.success("Đã xóa các đơn đã chọn", {
        description: `${selectedOrders.length} đơn hàng đã bị xóa khỏi hệ thống.`,
      });
      setRowSelection({});
      await loadOrders();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhiều đơn hàng");
    } finally {
      setBulkProcessing(null);
      setBulkDeleteAlertOpen(false);
    }
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, bList] = await Promise.all([posService.getOrders(), posService.getBranches().catch(() => [])]);

      const mapped = orders.map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        customer_id: o.customer_id,
        customer_name: o.customer?.name,
        customer_address: o.customer?.address || "",
        customer_phone: o.customer?.phone || "",
        total_amount: o.total_amount,
        status: o.status,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        payment_amount_received: o.payment_amount_received,
        debt_amount:
          o.debt_amount ??
          (o.payment_method === "debt" || o.payment_status === "debt" || o.payment_status === "partial_debt"
            ? o.total_amount - (o.payment_amount_received || 0)
            : 0),
        created_at: o.created_at,
        branch_id: o.branch_id,
        staff_id: o.staff_id || null,
        staff_name: o.staff?.full_name || o.staff?.email || null,
        order_items: o.order_items || [],
        return_orders: o.return_orders || [],
        // invoice_status from DB if present
        invoice_status: o.invoice_status || null,
        source: o.source || "pos",
        online_status: o.online_status || null,
      }));

      setData(mapped);
      setBranches(bList || []);

      // Build invoice status map from existing orders data
      const statusMap: Record<string, string> = {};
      for (const o of mapped) {
        if (o.invoice_status) statusMap[o.id] = o.invoice_status;
      }
      setOrderInvoiceStatus(statusMap);
      setRowSelection({});
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const orderId = searchParams.get("order");
    if (!orderId || data.length === 0) return;

    const order = data.find((item) => item.id === orderId);
    if (!order) return;

    setSelectedOrder(order);
    setDetailOpen(true);
  }, [data, searchParams]);

  if (isMobile) {
    const mappedMobileOrders = data.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      customer_id: (o as any).customer_id,
      customer: o.customer_name
        ? {
            id: (o as any).customer_id,
            name: o.customer_name,
            phone: o.customer_phone,
            address: o.customer_address,
          }
        : null,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_address: o.customer_address,
      total_amount: o.total_amount,
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      payment_amount_received: o.payment_amount_received,
      debt_amount: o.debt_amount,
      created_at: o.created_at,
      branch_id: o.branch_id,
      staff_id: o.staff_id,
      staff_name: o.staff_name,
      items: o.order_items || [],
      order_items: o.order_items || [],
      return_orders: o.return_orders || [],
      invoice_status: o.invoice_status || null,
      source: o.source || "pos",
      online_status: o.online_status || null,
    }));

    return <MobileOrders orders={mappedMobileOrders} branches={branches} loading={loading} onRefresh={loadOrders} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Đơn hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý và theo dõi lịch sử bán hàng của bạn.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleExportOrders(filteredData, "bao_cao_don_hang")}>
          <FileDown className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-2">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đơn, khách hàng..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 bg-background pl-10"
          />
        </div>

        {/* Predefined Date Filter Selector */}
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-9 w-[155px]">
            <SelectValue placeholder="Thời gian" />
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

        {/* Source Filter Selector */}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-9 w-[145px]">
            <SelectValue placeholder="Nguồn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nguồn</SelectItem>
            <SelectItem value="pos">Tại quầy (POS)</SelectItem>
            <SelectItem value="online">Website</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter Selector */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[145px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="completed">Hoàn tất</SelectItem>
            <SelectItem value="processing">Đang xử lý</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Method Filter Selector */}
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Thanh toán" />
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

        {/* Branch Filter Selector */}
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue placeholder="Chi nhánh" />
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

        {/* Reset Filters button */}
        {(statusFilter !== "all" ||
          paymentFilter !== "all" ||
          branchFilter !== "all" ||
          dateFilter !== "all" ||
          sourceFilter !== "all" ||
          searchQuery !== "") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setPaymentFilter("all");
              setBranchFilter("all");
              setDateFilter("all");
              setSourceFilter("all");
              setSearchQuery("");
            }}
            className="h-9 gap-1 px-3 text-ash hover:text-primary"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Real-time Filter Summary Statistics */}
      <div className="my-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total count */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-[10px] text-ash uppercase tracking-wider">Bộ lọc: Tổng số đơn</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="font-black text-2xl text-obsidian">{stats.totalCount} đơn</div>
          <p className="mt-1 text-[10px] text-ash">Đơn hàng được tìm thấy</p>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-[10px] text-ash uppercase tracking-wider">Doanh số lọc</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <span className="font-extrabold text-xs">₫</span>
            </div>
          </div>
          <div className="font-black text-2xl text-emerald-600">{formatCurrency(stats.totalRevenue)}</div>
          <p className="mt-1 text-[10px] text-ash">Tổng cộng giá trị đơn hàng</p>
        </div>

        {/* Card 3: Completed sales */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-[10px] text-ash uppercase tracking-wider">Doanh thu thực nhận</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <span className="font-extrabold text-[10px]">OK</span>
            </div>
          </div>
          <div className="font-black text-2xl text-sky-600">{formatCurrency(stats.completedRevenue)}</div>
          <p className="mt-1 text-[10px] text-ash">Từ {stats.completedCount} đơn hoàn tất</p>
        </div>

        {/* Card 4: Total Debt */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-[10px] text-ash uppercase tracking-wider">Doanh số ghi nợ</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <CircleAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="font-black text-2xl text-amber-600">{formatCurrency(stats.totalDebt)}</div>
          <p className="mt-1 text-[10px] text-ash">Tổng nợ cần thu hồi</p>
        </div>

        {/* Card 5: Cancelled count */}
        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-[10px] text-ash uppercase tracking-wider">Đơn bị hủy</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <span className="font-extrabold text-[10px]">✕</span>
            </div>
          </div>
          <div className="font-black text-2xl text-red-500">{stats.cancelledCount} đơn</div>
          <p className="mt-1 text-[10px] text-ash">Đơn bị hủy bỏ hoặc từ chối</p>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-7 rounded-md px-2.5 font-bold">
              {selectedCount} đơn đã chọn
            </Badge>
            <span className="text-muted-foreground text-sm">
              Tổng giá trị: <span className="font-bold text-foreground">{formatCurrency(selectedTotal)}</span>
            </span>
            {selectedCancelableOrders.length !== selectedCount && (
              <span className="font-semibold text-amber-600 text-xs">
                {selectedCount - selectedCancelableOrders.length} đơn đã hủy sẽ không hủy lại
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {singleSelectedOrder && (
              <>
                <Button variant="outline" size="sm" onClick={() => handlePrint(singleSelectedOrder)}>
                  <Printer className="mr-2 h-4 w-4" />
                  In bill
                </Button>
                {!singleSelectedHasInvoice && singleSelectedOrder.status !== "cancelled" && (
                  <Button variant="outline" size="sm" onClick={() => openIssueInvoice(singleSelectedOrder)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Xuất HĐĐT
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => handleExportOrders(selectedOrders, "don_hang_da_chon")}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkCancelAlertOpen(true)}
              disabled={selectedCancelableOrders.length === 0 || bulkProcessing !== null}
              className="text-amber-700 hover:text-amber-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Hủy đơn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteAlertOpen(true)}
              disabled={bulkProcessing !== null}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải danh sách đơn hàng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Trước
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Sau
        </Button>
      </div>

      <EditOrderDialog orderId={editingId} open={editOpen} onOpenChange={setEditOpen} onSuccess={loadOrders} />

      <AlertDialog open={cancelAlertOpen} onOpenChange={setCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ chuyển trạng thái đơn hàng sang "Đã hủy". Bạn có thể thay đổi lại sau nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellingId(null)}>Quay lại</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-amber-600 text-white hover:bg-amber-700">
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive">Xác nhận xóa vĩnh viễn đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này **không thể khôi phục**. Hóa đơn này và toàn bộ danh mục sản phẩm chi tiết đi kèm sẽ bị xóa
              hoàn toàn khỏi cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              Xác nhận xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkCancelAlertOpen} onOpenChange={setBulkCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy {selectedCancelableOrders.length} đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Các đơn đã chọn sẽ được chuyển sang "Đã hủy". Đơn đã hủy sẵn sẽ được bỏ qua.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing !== null}>Quay lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancelOrders}
              disabled={bulkProcessing !== null}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {bulkProcessing === "cancel" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive">
              Xóa vĩnh viễn {selectedCount} đơn hàng?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể khôi phục. Toàn bộ đơn hàng đã chọn và sản phẩm chi tiết đi kèm sẽ bị xóa khỏi cơ
              sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing !== null}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteOrders}
              disabled={bulkProcessing !== null}
              className="bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              {bulkProcessing === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderDetailDialog
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onPrint={() => {
          if (selectedOrder) {
            handlePrint(selectedOrder);
          }
        }}
      />

      {printOrder && <PrintInvoice order={printOrder} />}

      {/* eInvoice Issue Dialog */}
      {invoiceTarget && (
        <IssueInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={(open) => {
            setInvoiceDialogOpen(open);
            if (!open) setInvoiceTarget(null);
          }}
          orderId={invoiceTarget.id}
          branchId={invoiceTarget.branch_id}
          cartItems={(invoiceTarget.order_items || []).map((item: any) => ({
            product_name:
              (item.variant?.product?.name || "Sản phẩm") +
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
            // Update local invoice status map without full reload
            setOrderInvoiceStatus((prev) => ({
              ...prev,
              [invoiceTarget.id]: invoice.status,
            }));
          }}
        />
      )}

      {/* Return Order Dialog */}
      {returnTarget && (
        <ReturnOrderDialog
          order={returnTarget}
          open={returnOpen}
          onOpenChange={(open) => {
            setReturnOpen(open);
            if (!open) setTimeout(() => setReturnTarget(null), 200);
          }}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
