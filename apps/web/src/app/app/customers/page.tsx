"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Award,
  CreditCard,
  FileDown,
  History,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { posService } from "@/services/pos.service";

import { AddCustomerDialog } from "./_components/add-customer-dialog";
import { EditCustomerDialog } from "./_components/edit-customer-dialog";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export default function CustomersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkAlertOpen, setBulkAlertOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const customers = await posService.getCustomers("");
      setData(customers || []);
      setRowSelection({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

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
        description: "Hồ sơ khách hàng đã được gỡ bỏ.",
      });
      await loadCustomers();
    } catch (_error) {
      toast.error("Lỗi khi xóa khách hàng");
    } finally {
      setAlertOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả khách hàng trên trang"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chọn khách hàng ${row.original.name}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {row.original.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-ink text-sm">{row.original.name}</span>
            <span className="font-semibold text-[10px] text-muted-foreground uppercase">
              #{row.original.id.slice(0, 8)}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Điện thoại",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-ash text-sm">
          <Phone className="h-3 w-3" />
          {row.getValue("phone") || "---"}
        </div>
      ),
    },
    {
      accessorKey: "points",
      header: "Điểm tích lũy",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
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
          <Badge variant={debt > 0 ? "destructive" : "secondary"} className="font-bold text-[10px]">
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
            <DropdownMenuItem
              onClick={() => {
                setEditingCustomer(row.original);
                setEditOpen(true);
              }}
            >
              Chỉnh sửa
            </DropdownMenuItem>
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
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection,
    },
  });

  const selectedCustomers = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedCount = selectedCustomers.length;

  const handleExportCustomers = () => {
    if (selectedCustomers.length === 0) return;
    exportToCSV(
      selectedCustomers.map((customer) => ({
        "Tên khách hàng": customer.name,
        "Điện thoại": customer.phone || "",
        Email: customer.email || "",
        "Địa chỉ": customer.address || "",
        "Điểm tích lũy": customer.points || 0,
        "Công nợ": customer.debt || 0,
      })),
      "khach_hang_da_chon",
    );
    toast.success("Đã xuất CSV khách hàng");
  };

  const handleBulkDeleteCustomers = async () => {
    if (selectedCustomers.length === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedCustomers.map((customer) => posService.deleteCustomer(customer.id)));
      toast.success("Đã xóa các khách hàng đã chọn", {
        description: `${selectedCustomers.length} hồ sơ khách hàng đã được gỡ bỏ.`,
      });
      await loadCustomers();
    } catch (_error) {
      toast.error("Lỗi khi xóa nhiều khách hàng");
    } finally {
      setBulkDeleting(false);
      setBulkAlertOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Khách hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý hồ sơ, điểm tích lũy và công nợ khách hàng.</p>
        </div>
        <AddCustomerDialog onShowSuccess={loadCustomers} />
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm khách hàng (F2)..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="h-9 pl-10"
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <Badge variant="secondary" className="h-7 w-fit rounded-md px-2.5 font-bold">
            {selectedCount} khách hàng đã chọn
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCustomers}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAlertOpen(true)}
              disabled={bulkDeleting}
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>Đang tải danh sách khách hàng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
            <DialogTitle className="font-bold text-xl">Hồ sơ khách hàng</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="col-span-1 space-y-4">
                <div className="flex flex-col items-center rounded-lg border bg-muted/30 p-4">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <h3 className="text-center font-bold">{selectedCustomer.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                    {selectedCustomer.points || 0} điểm
                  </Badge>
                </div>
                <div className="space-y-3 px-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{selectedCustomer.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{selectedCustomer.email || "N/A"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    <span className="text-xs">{selectedCustomer.address || "Chưa có địa chỉ"}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                    <p className="font-bold text-[10px] text-primary uppercase tracking-widest">Tổng chi tiêu</p>
                    <p className="mt-1 font-bold text-lg">
                      {formatCurrency(
                        selectedCustomer.orders?.reduce(
                          (acc: number, curr: any) => acc + Number(curr.total_amount),
                          0,
                        ) || 0,
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                    <p className="font-bold text-[10px] text-red-600 uppercase tracking-widest">Công nợ hiện tại</p>
                    <p className="mt-1 font-bold text-lg text-red-600">{formatCurrency(selectedCustomer.debt || 0)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 font-bold text-sm">
                    <History className="h-4 w-4" />
                    Lịch sử đơn hàng
                  </h4>
                  <div className="max-h-[250px] space-y-2 overflow-y-auto pr-2">
                    {selectedCustomer.orders?.length > 0 ? (
                      selectedCustomer.orders.map((order: any) => {
                        const isDebt =
                          order.payment_status === "debt" ||
                          order.payment_status === "partial_debt" ||
                          order.payment_method === "debt";
                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold">#{order.order_number}</span>
                              <span className="text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                              {isDebt && (
                                <Badge variant="destructive" className="h-4 px-1 text-[8px]">
                                  Ghi nợ
                                </Badge>
                              )}
                              <Badge className="h-4 px-1 text-[8px]">{order.status}</Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-10 text-center text-muted-foreground text-sm italic">
                        Chưa có lịch sử giao dịch.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditCustomerDialog
        customer={editingCustomer}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingCustomer(null);
        }}
        onUpdated={loadCustomers}
      />

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
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkAlertOpen} onOpenChange={setBulkAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa {selectedCount} khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn các hồ sơ khách hàng đã chọn. Bạn không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteCustomers}
              disabled={bulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
