"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Search,
  MoreHorizontal,
  History,
  CreditCard,
  Award,
  Loader2,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
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
import { 
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AddCustomerDialog } from "./_components/add-customer-dialog";
import { posService } from "@/services/pos.service";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function CustomersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const customers = await posService.getCustomers("");
      setData(customers || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleViewDetail = async (customer: any) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
    // Fetch deeper detail (orders)
    try {
      const fullDetail = await posService.getCustomerDetail(customer.id);
      setSelectedCustomer(fullDetail);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingId) return;
    try {
      await posService.deleteCustomer(deletingId);
      toast.success("Đã xóa khách hàng", {
        description: "Hồ sơ khách hàng đã được gỡ bỏ."
      });
      loadCustomers();
    } catch (error) {
      toast.error("Lỗi khi xóa khách hàng");
    } finally {
      setAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {row.original.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-ink">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">#{row.original.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Điện thoại",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-ash font-medium">
          <Phone className="w-3 h-3" />
          {row.getValue("phone") || "---"}
        </div>
      ),
    },
    {
      accessorKey: "points",
      header: "Điểm tích lũy",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-amber-600 text-sm">{row.original.points || 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "debt",
      header: "Công nợ",
      cell: ({ row }) => {
        const debt = row.original.debt || 0;
        return (
          <Badge variant={debt > 0 ? "destructive" : "secondary"} className="text-[10px] font-bold">
            {debt > 0 ? formatCurrency(debt) : "0₫"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewDetail(row.original)}>
              <History className="mr-2 h-4 w-4" /> Xem lịch sử
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/debt/customers/${row.original.id}`}>
                <CreditCard className="mr-2 h-4 w-4" /> Thanh toán nợ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive" 
              onClick={() => {
                setDeletingId(row.original.id);
                setAlertOpen(true);
              }}
            >
              Xóa khách hàng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý hồ sơ, điểm tích lũy và công nợ khách hàng.</p>
        </div>
        <AddCustomerDialog onShowSuccess={loadCustomers} />
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm khách hàng (F2)..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10 h-9"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
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
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span>Đang tải danh sách khách hàng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length ? (
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
                <TableCell colSpan={columns.length} className="h-40 text-center opacity-50">
                  Chưa có khách hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Hồ sơ khách hàng</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="col-span-1 space-y-4">
                <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg border">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-3">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-center">{selectedCustomer.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-[10px] uppercase">{selectedCustomer.points || 0} điểm</Badge>
                </div>
                <div className="space-y-3 px-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{selectedCustomer.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{selectedCustomer.email || "N/A"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span className="text-xs">{selectedCustomer.address || "Chưa có địa chỉ"}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Tổng chi tiêu</p>
                    <p className="text-lg font-bold mt-1">
                      {formatCurrency(selectedCustomer.orders?.reduce((acc: number, curr: any) => acc + Number(curr.total_amount), 0) || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                    <p className="text-[10px] text-red-600 uppercase font-bold tracking-widest">Công nợ hiện tại</p>
                    <p className="text-lg font-bold mt-1 text-red-600">{formatCurrency(selectedCustomer.debt || 0)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Lịch sử đơn hàng
                  </h4>
                  <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
                    {selectedCustomer.orders?.length > 0 ? selectedCustomer.orders.map((order: any) => {
                      const isDebt = order.payment_status === 'debt' || order.payment_status === 'partial_debt' || order.payment_method === 'debt';
                      return (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold">#{order.order_number}</span>
                            <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                            {isDebt && (
                              <Badge variant="destructive" className="text-[8px] h-4 px-1">Ghi nợ</Badge>
                            )}
                            <Badge className="text-[8px] h-4 px-1">{order.status}</Badge>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-center py-10 text-muted-foreground text-sm italic">Chưa có lịch sử giao dịch.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn hồ sơ khách hàng. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90 text-white">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
