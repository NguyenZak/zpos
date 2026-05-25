"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  Filter,
  Package,
  Boxes,
  History,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  ArrowRightLeft,
  Check,
  Edit2,
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { MobileInventory } from "../_components/mobile/mobile-inventory";
import { AdjustStockDialog } from "./_components/adjust-stock-dialog";
import { StockHistoryDialog } from "./_components/stock-history-dialog";
import { createClient } from "@/utils/supabase/client";

export type InventoryItem = {
  id: string;
  product_id?: string;
  is_variant?: boolean;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min_stock: number;
  price?: number;
  image?: string;
};

export default function InventoryPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const [data, setData] = useState<InventoryItem[]>([]);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<"ADJUST" | "LOSS">("ADJUST");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    try {
      const products = await posService.getProducts();
      let inventoryList: InventoryItem[] = [];

      products.forEach((p: any) => {
        if (p.has_variants && p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            inventoryList.push({
              id: v.id,
              product_id: p.id,
              is_variant: true,
              name: `${p.name} - ${v.name}`,
              sku: v.sku || p.sku || "N/A",
              category: p.category?.name || "Chưa phân loại",
              stock: v.stock || 0,
              min_stock: p.min_stock || 5, // fallback to product min_stock
              price: v.price || p.price || 0,
              image: v.image_url || p.image || "",
            });
          });
        } else {
          inventoryList.push({
            id: p.id,
            product_id: p.id,
            is_variant: false,
            name: p.name,
            sku: p.sku || "N/A",
            category: p.category?.name || "Chưa phân loại",
            stock: p.stock || 0,
            min_stock: p.min_stock || 5,
            price: p.price || 0,
            image: p.image || "",
          });
        }
      });

      setData(inventoryList);
    } catch (error) {
      console.error("Lỗi tải kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center border border-pebble">
            <Package className="w-5 h-5 text-ash" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-ink">{row.getValue("name")}</span>
            <span className="text-[10px] text-ash font-black uppercase tracking-widest">{row.original.sku}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      cell: ({ row }) => (
        <Badge variant="outline" className="border-pebble bg-mist/20 text-ash">
          {row.getValue("category")}
        </Badge>
      ),
    },
    {
      accessorKey: "stock",
      header: "Tồn thực tế",
      cell: ({ row }) => {
        const stock = parseInt(row.getValue("stock"));
        const minStock = row.original.min_stock || 5;
        const isLow = stock <= minStock;
        return (
          <div className="flex items-center gap-3">
            <div className={`text-xl font-black ${isLow ? "text-red-500" : "text-obsidian"}`}>{stock}</div>
            {isLow && (
              <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 gap-1 px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" />
                Sắp hết
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "min_stock",
      header: "Cảnh báo dưới",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <MinStockCell
            item={item}
            onSave={async (newVal) => {
              try {
                await posService.updateProduct(item.id, { min_stock: newVal });
                toast.success(`Cập nhật cảnh báo tồn cho ${item.name} thành ${newVal}`);
                loadInventory();
              } catch (e) {
                toast.error("Không thể cập nhật hạn mức cảnh báo!");
              }
            }}
          />
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-ash hover:text-primary">
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4 text-ash" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Điều chỉnh kho</DropdownMenuLabel>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setAdjustMode("ADJUST");
                    setAdjustItem(row.original);
                    setIsAdjustOpen(true);
                  }}
                >
                  <RefreshCcw className="w-4 h-4" /> Cập nhật số dư
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setAdjustItem(row.original);
                    setIsHistoryOpen(true);
                  }}
                >
                  <History className="w-4 h-4" /> Xem thẻ kho
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setAdjustMode("LOSS");
                    setAdjustItem(row.original);
                    setIsAdjustOpen(true);
                  }}
                >
                  Báo mất / hỏng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (isMobile) {
    const mappedMobileProducts = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      barcode: item.sku,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      price: item.price || 0,
      image: item.image || "",
    }));

    return (
      <MobileInventory
        products={mappedMobileProducts}
        loading={loading}
        onUpdateStock={async (productId, newStock) => {
          const target = data.find((i) => i.id === productId.toString());
          if (!target) return;
          const supabase = createClient();
          if (target.is_variant) {
            await supabase.from("product_variants").update({ stock: newStock }).eq("id", target.id);
          } else {
            await supabase.from("products").update({ stock: newStock }).eq("id", target.id);
          }
          loadInventory();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Tồn kho</h1>
          <p className="text-muted-foreground text-sm">Theo dõi số lượng hàng hóa và cảnh báo hết hàng.</p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
          <Button variant="outline" size="sm" onClick={loadInventory}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => toast.info("Tính năng Kiểm kho định kỳ đang được phát triển.")}>
            <Boxes className="mr-2 h-4 w-4" />
            Kiểm kho định kỳ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
        <div className="bg-card border p-6 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng sản phẩm</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
        </div>
        <div className="bg-card border p-6 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500/10 text-yellow-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sắp hết hàng</p>
            <p className="text-2xl font-bold">{data.filter((i) => i.stock <= i.min_stock && i.stock > 0).length}</p>
          </div>
        </div>
        <div className="bg-card border p-6 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500/10 text-red-600 rounded-lg flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hết hàng</p>
            <p className="text-2xl font-bold text-red-600">{data.filter((i) => i.stock <= 0).length}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info("Tính năng Lọc chi tiết đang được phát triển.")}>
          <Filter className="mr-2 h-4 w-4" />
          Bộ lọc
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-mist/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-bold text-obsidian uppercase text-[10px] tracking-widest h-12"
                  >
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
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm font-bold text-ash">Đang kiểm tra kho hàng...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-mist/10 border-pebble">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center text-ash font-bold opacity-50">
                  Không tìm thấy dữ liệu tồn kho.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdjustStockDialog
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        item={adjustItem}
        mode={adjustMode}
        onSuccess={loadInventory}
      />
      <StockHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} item={adjustItem} />
    </div>
  );
}

function MinStockCell({ item, onSave }: { item: InventoryItem; onSave: (val: number) => Promise<void> }) {
  const [val, setVal] = useState(item.min_stock);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVal(item.min_stock);
  }, [item.min_stock]);

  const handleSave = async () => {
    if (val < 0) {
      toast.error("Hạn mức không được nhỏ hơn 0!");
      return;
    }
    setLoading(true);
    try {
      await onSave(val);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
        <Input
          type="number"
          value={val}
          onChange={(e) => setVal(parseInt(e.target.value) || 0)}
          className="h-8 py-1 px-2 text-sm font-bold text-center w-16"
          autoFocus
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-primary hover:bg-primary/10 shrink-0"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 group cursor-pointer hover:bg-muted/30 p-1.5 -m-1.5 rounded-lg transition-colors max-w-[140px]"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      <span className="font-bold text-ink text-sm">{val} sp</span>
      <Edit2 className="w-3 h-3 text-ash opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
