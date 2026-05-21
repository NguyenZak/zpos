"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { format } from "date-fns";
import {
  ClipboardList,
  Edit,
  Eye,
  FileDown,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  Truck,
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

export default function PurchasesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const purchases = await posService.getPurchaseOrders();
      setData(purchases);
      setSelectedIds({});
    } catch (error) {
      console.error("Lỗi tải danh sách nhập hàng:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await posService.deletePurchaseOrder(deleteId);
      toast.success("Đã xoá đơn nhập hàng");
      setDeleteId(null);
      await loadPurchases();
    } catch (error: any) {
      console.error("Lỗi xoá đơn:", error);
      toast.error(`Không thể xoá đơn: ${error.message || "Lỗi không xác định"}`);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "";
    switch (s) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700">
            Nháp
          </Badge>
        );
      case "ordered":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Đã đặt hàng
          </Badge>
        );
      case "receiving":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-700">
            Đang nhập kho
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Hoàn tất
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const filteredData = data.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return item.code?.toLowerCase().includes(query) || item.supplier?.name?.toLowerCase().includes(query);
  });

  const selectedPurchases = data.filter((item) => selectedIds[item.id]);
  const selectedCount = selectedPurchases.length;
  const allPageSelected = filteredData.length > 0 && filteredData.every((item) => selectedIds[item.id]);
  const somePageSelected = filteredData.some((item) => selectedIds[item.id]);

  const toggleAllPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      for (const item of filteredData) {
        if (checked) next[item.id] = true;
        else delete next[item.id];
      }
      return next;
    });
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (checked) next[id] = true;
      else delete next[id];
      return next;
    });
  };

  const exportPurchases = (items: any[], filename: string) => {
    if (items.length === 0) {
      toast.info("Không có đơn nhập để xuất");
      return;
    }
    exportToCSV(
      items.map((item) => ({
        "Mã đơn": item.code,
        "Ngày nhập": format(new Date(item.created_at), "dd/MM/yyyy HH:mm"),
        "Nhà cung cấp": item.supplier?.name || "",
        "Tổng tiền": item.total_amount || 0,
        "Trạng thái": item.status || "",
      })),
      filename,
    );
    toast.success("Đã xuất CSV nhập hàng");
  };

  const handleBulkDelete = async () => {
    if (selectedPurchases.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(selectedPurchases.map((item) => posService.deletePurchaseOrder(item.id)));
      toast.success("Đã xoá các đơn nhập đã chọn", {
        description: `${selectedPurchases.length} đơn nhập hàng đã được xóa.`,
      });
      setBulkDeleteOpen(false);
      await loadPurchases();
    } catch (error: any) {
      console.error("Lỗi xoá nhiều đơn:", error);
      toast.error(`Không thể xoá đơn: ${error.message || "Lỗi không xác định"}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-black text-3xl leading-none tracking-tight">Nhập hàng</h1>
          <p className="text-muted-foreground text-sm">Quản lý nhập kho và nhập hàng từ nhà cung cấp.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPurchases(filteredData, "nhap_hang")}>
            <FileDown className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
          <Button size="sm" asChild>
            <Link href="/app/purchases/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn nhập
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đơn, nhà cung cấp..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Lọc đơn
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <Badge variant="secondary" className="h-7 w-fit rounded-md px-2.5 font-bold">
            {selectedCount} đơn nhập đã chọn
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportPurchases(selectedPurchases, "don_nhap_da_chon")}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Xóa
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds({})}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                  onCheckedChange={(value) => toggleAllPage(!!value)}
                  aria-label="Chọn tất cả đơn nhập trên trang"
                />
              </TableHead>
              <TableHead className="w-[150px]">Mã đơn</TableHead>
              <TableHead className="w-[180px]">Ngày nhập</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm">Đang tải danh sách...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  data-state={selectedIds[item.id] && "selected"}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <Checkbox
                      checked={!!selectedIds[item.id]}
                      onCheckedChange={(value) => toggleOne(item.id, !!value)}
                      aria-label={`Chọn đơn nhập ${item.code}`}
                    />
                  </TableCell>
                  <TableCell className="font-bold">{item.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{format(new Date(item.created_at), "dd/MM/yyyy")}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(item.created_at), "HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{item.supplier?.name || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-primary">
                    {formatCurrency(item.total_amount)}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/app/purchases/${item.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" /> Chi tiết
                          </Link>
                        </DropdownMenuItem>
                        {item.status !== "completed" && item.status !== "cancelled" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/app/purchases/${item.id}/edit`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" /> Sửa đơn
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>In đơn nhập</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Xóa đơn
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <ClipboardList className="h-12 w-12" />
                    <span className="text-sm">Chưa có đơn nhập hàng nào.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đơn nhập hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn nhập hàng này không? Hành động này không thể hoàn tác và sẽ xóa toàn bộ lịch
              sử cũng như chi tiết của đơn này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
              Xóa đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedCount} đơn nhập hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác và sẽ xóa toàn bộ lịch sử cũng như chi tiết của các đơn đã chọn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
              Xóa đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
