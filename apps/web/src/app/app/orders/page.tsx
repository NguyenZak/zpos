"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  ArrowUpDown,
  FileDown,
  Filter,
  ClipboardList,
  Eye,
  Loader2,
  Trash2,
  XCircle,
  Edit,
  Printer,
  RefreshCcw,
  CircleAlert
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { MobileOrders } from "../_components/mobile/mobile-orders";
import { EditOrderDialog } from "./_components/edit-order-dialog";

import { OrderDetailDialog } from "./_components/order-detail-dialog";
import { PrintInvoice } from "@/app/app/pos/_components/print-invoice";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { posService } from '@/services/pos.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  created_at: string;
  branch_id?: string;
  order_items?: any[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + " đ";
};

export default function OrdersPage() {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  // View & Print states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  const handlePrint = (order: Order) => {
    const mappedOrder = {
      order_number: order.order_number,
      created_at: order.created_at,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      customer: order.customer_name ? { name: order.customer_name, phone: "" } : undefined,
      items: (order.order_items || []).map((item: any) => {
        const prodName = item.variant?.product?.name || "Sản phẩm";
        const variantName = item.variant?.name && item.variant.name !== 'Default' ? ` (${item.variant.name})` : '';
        return {
          product_name: `${prodName}${variantName}`,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        };
      })
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
  const [branches, setBranches] = useState<any[]>([]);

  const handleCancelOrder = async () => {
    if (!cancellingId) return;
    try {
      await posService.cancelOrder(cancellingId);
      toast.success("Đã hủy đơn hàng", {
        description: "Trạng thái đơn hàng đã được chuyển sang Đã hủy."
      });
      loadOrders();
    } catch (error) {
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
        description: "Hóa đơn và toàn bộ sản phẩm liên quan đã được xóa khỏi hệ thống."
      });
      loadOrders();
    } catch (error) {
      toast.error("Lỗi khi xóa đơn hàng");
    } finally {
      setDeleteAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "order_number",
      header: "Mã đơn hàng",
      cell: ({ row }) => <span className="font-bold">{row.getValue("order_number")}</span>,
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
      id: "products",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const items = row.original.order_items || [];
        if (items.length === 0) return <span className="text-muted-foreground italic text-xs">Không có chi tiết</span>;
        
        const productsSummary = items.map((item: any) => {
          const prodName = item.variant?.product?.name || "Sản phẩm";
          const variantName = item.variant?.name && item.variant.name !== 'Default' ? ` (${item.variant.name})` : '';
          return `${prodName}${variantName} x${item.quantity}`;
        }).join(", ");

        return (
          <div className="max-w-[220px] truncate text-xs font-semibold text-muted-foreground" title={productsSummary}>
            {productsSummary}
          </div>
        );
      }
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
        
        const isDebt = method === 'debt' || status === 'debt' || status === 'partial_debt';
        const isPaid = status === 'paid';
        
        if (isDebt) {
          const unpaidAmount = row.original.debt_amount !== undefined && row.original.debt_amount !== null
            ? row.original.debt_amount
            : (row.original.total_amount - (row.original.payment_amount_received || 0));
            
          if (isPaid) {
            return (
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-bold capitalize w-fit">
                  Nợ đã trả
                </Badge>
                {method !== 'debt' && (
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Qua {method === 'cash' ? 'Tiền mặt' : method === 'card' ? 'Thẻ' : method === 'transfer' ? 'Chuyển khoản' : method}
                  </span>
                )}
              </div>
            );
          } else {
            const isPartial = status === 'partial_debt' || (unpaidAmount < row.original.total_amount && unpaidAmount > 0);
            return (
              <div className="flex flex-col gap-1">
                <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold capitalize w-fit">
                  {isPartial ? 'Nợ trả một phần' : 'Nợ chưa trả'}
                </Badge>
                {unpaidAmount > 0 && (
                  <span className="text-[10px] font-extrabold uppercase text-amber-600">
                    Còn nợ: {formatCurrency(unpaidAmount)}
                  </span>
                )}
              </div>
            );
          }
        }
        
        const label =
          method === 'cash' ? 'Tiền mặt' :
          method === 'card' ? 'Thẻ' :
          method === 'transfer' ? 'Chuyển khoản' :
          method || '—';
          
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="capitalize w-fit">
              {label}
            </Badge>
            {status && status !== 'paid' && (
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {status === 'pending' ? 'Chờ thanh toán' :
                  status === 'refunded' ? 'Đã hoàn' :
                  status}
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
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
        let label = "Đang xử lý";
        let className = "bg-yellow-500 hover:bg-yellow-600";

        if (status === 'completed') {
          label = "Hoàn tất";
          className = "bg-green-500 hover:bg-green-600 text-white";
        } else if (status === 'cancelled') {
          label = "Đã hủy";
          className = "bg-red-500 hover:bg-red-600 text-white";
        }

        return (
          <Badge className={className}>
            {label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
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
                <Eye className="w-4 h-4" /> Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2"
                onClick={() => handlePrint(row.original)}
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2"
                onClick={() => {
                  setEditingId(row.original.id);
                  setEditOpen(true);
                }}
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                onClick={() => {
                  setCancellingId(row.original.id);
                  setCancelAlertOpen(true);
                }}
              >
                <XCircle className="w-4 h-4" /> Hủy đơn
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/5 font-semibold"
                onClick={() => {
                  setDeletingId(row.original.id);
                  setDeleteAlertOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" /> Xóa đơn hàng
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
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      // 3. Payment method filter
      if (paymentFilter !== 'all') {
        const isDebt = o.payment_method === 'debt' || o.payment_status === 'debt' || o.payment_status === 'partial_debt';
        const isPaid = o.payment_status === 'paid';
        
        if (paymentFilter === 'debt_unpaid') {
          if (!isDebt || isPaid) return false;
        } else if (paymentFilter === 'debt_paid') {
          if (!isDebt || !isPaid) return false;
        } else if (paymentFilter === 'debt') {
          if (!isDebt) return false;
        } else {
          if (o.payment_method !== paymentFilter) return false;
        }
      }

      // 4. Branch filter
      if (branchFilter !== 'all' && o.branch_id !== branchFilter) return false;

      // 5. Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(o.created_at);
        const now = new Date();
        
        if (dateFilter === 'today') {
          if (orderDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          if (orderDate.toDateString() !== yesterday.toDateString()) return false;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'thisMonth') {
          if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'lastMonth') {
          const lastMonth = new Date();
          lastMonth.setMonth(now.getMonth() - 1);
          if (orderDate.getMonth() !== lastMonth.getMonth() || orderDate.getFullYear() !== lastMonth.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, paymentFilter, branchFilter, dateFilter]);

  // Aggregate stats from filteredData
  const stats = React.useMemo(() => {
    const totalCount = filteredData.length;
    const totalRevenue = filteredData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const completedCount = filteredData.filter(o => o.status === 'completed').length;
    const completedRevenue = filteredData.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const cancelledCount = filteredData.filter(o => o.status === 'cancelled').length;
    const totalDebt = filteredData
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.debt_amount || 0), 0);
    
    return {
      totalCount,
      totalRevenue,
      completedCount,
      completedRevenue,
      cancelledCount,
      totalDebt
    };
  }, [filteredData]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [orders, bList] = await Promise.all([
        posService.getOrders(),
        posService.getBranches().catch(() => [])
      ]);
      
      setData(orders.map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer?.name,
        customer_address: o.customer?.address || '',
        customer_phone: o.customer?.phone || '',
        total_amount: o.total_amount,
        status: o.status,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        payment_amount_received: o.payment_amount_received,
        debt_amount: o.debt_amount !== undefined && o.debt_amount !== null ? o.debt_amount : (o.payment_method === 'debt' || o.payment_status === 'debt' || o.payment_status === 'partial_debt' ? o.total_amount - (o.payment_amount_received || 0) : 0),
        created_at: o.created_at,
        branch_id: o.branch_id,
        order_items: o.order_items || []
      })));
      setBranches(bList || []);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (isMobile) {
    const mappedMobileOrders = data.map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      customer: o.customer_name ? { name: o.customer_name } : null,
      total_amount: o.total_amount,
      status: o.status,
      payment_method: o.payment_method,
      created_at: o.created_at,
      items: o.order_items || []
    }));

    return (
      <MobileOrders 
        orders={mappedMobileOrders}
        loading={loading}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Đơn hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý và theo dõi lịch sử bán hàng của bạn.</p>
        </div>
        <Button variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo mã đơn, khách hàng..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10 h-9 bg-background"
          />
        </div>

        {/* Predefined Date Filter Selector */}
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[155px] h-9">
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

        {/* Status Filter Selector */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[145px] h-9">
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
          <SelectTrigger className="w-[180px] h-9">
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
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue placeholder="Chi nhánh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Filters button */}
        {(statusFilter !== 'all' || paymentFilter !== 'all' || branchFilter !== 'all' || dateFilter !== 'all' || searchQuery !== '') && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { 
              setStatusFilter('all'); 
              setPaymentFilter('all'); 
              setBranchFilter('all'); 
              setDateFilter('all');
              setSearchQuery(''); 
            }}
            className="h-9 px-3 text-ash hover:text-primary gap-1"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Real-time Filter Summary Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 my-2">
        {/* Card 1: Total count */}
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-ash uppercase tracking-wider">Bộ lọc: Tổng số đơn</span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-obsidian">{stats.totalCount} đơn</div>
          <p className="text-[10px] text-ash mt-1">Đơn hàng được tìm thấy</p>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-ash uppercase tracking-wider">Doanh số lọc</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <span className="font-extrabold text-xs">₫</span>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-[10px] text-ash mt-1">Tổng cộng giá trị đơn hàng</p>
        </div>

        {/* Card 3: Completed sales */}
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-ash uppercase tracking-wider">Doanh thu thực nhận</span>
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              <span className="font-extrabold text-[10px]">OK</span>
            </div>
          </div>
          <div className="text-2xl font-black text-sky-600">{formatCurrency(stats.completedRevenue)}</div>
          <p className="text-[10px] text-ash mt-1">Từ {stats.completedCount} đơn hoàn tất</p>
        </div>

        {/* Card 4: Total Debt */}
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-ash uppercase tracking-wider">Doanh số ghi nợ</span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CircleAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{formatCurrency(stats.totalDebt)}</div>
          <p className="text-[10px] text-ash mt-1">Tổng nợ cần thu hồi</p>
        </div>

        {/* Card 5: Cancelled count */}
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold text-ash uppercase tracking-wider">Đơn bị hủy</span>
            <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <span className="font-extrabold text-[10px]">✕</span>
            </div>
          </div>
          <div className="text-2xl font-black text-red-500">{stats.cancelledCount} đơn</div>
          <p className="text-[10px] text-ash mt-1">Đơn bị hủy bỏ hoặc từ chối</p>
        </div>
      </div>

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
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang tải danh sách đơn hàng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Sau
        </Button>
      </div>

      <EditOrderDialog 
        orderId={editingId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={loadOrders}
      />

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
            <AlertDialogAction onClick={handleCancelOrder} className="bg-amber-600 hover:bg-amber-700 text-white">
              Xác nhận hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-bold">Xác nhận xóa vĩnh viễn đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này **không thể khôi phục**. Hóa đơn này và toàn bộ danh mục sản phẩm chi tiết đi kèm sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive hover:bg-destructive/90 text-white font-bold">
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

      {printOrder && (
        <PrintInvoice order={printOrder} />
      )}
    </div>
  );
}
