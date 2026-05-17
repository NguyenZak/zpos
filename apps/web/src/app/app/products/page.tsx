"use client";

import React, { useState, useEffect } from 'react';
import { 
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef
} from "@tanstack/react-table";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  FileDown, 
  FileUp,
  Package, 
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  Pencil
} from "lucide-react";

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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-utils";

import { AddProductDialog } from "./_components/add-product-dialog";
import { EditProductDialog } from "./_components/edit-product-dialog";
import { posService } from "@/services/pos.service";

export default function ProductsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const products = await posService.getProducts();
      setData(products || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Dynamically extract active categories from loaded product records
  const categories = React.useMemo(() => {
    const list = new Set<string>();
    data.forEach(item => {
      if (item.category?.name) {
        list.add(item.category.name);
      }
    });
    return Array.from(list).sort();
  }, [data]);

  // Real-time filtered data matching active criteria
  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      // 1. Category Filter
      if (selectedCategory !== "all") {
        if (item.category?.name !== selectedCategory) return false;
      }

      // 2. Stock Status Filter
      const stock = parseInt(item.stock || 0);
      const minStock = parseInt(item.min_stock || 5);
      if (selectedStockStatus === "low") {
        if (stock > minStock) return false;
      } else if (selectedStockStatus === "instock") {
        if (stock <= minStock) return false;
      } else if (selectedStockStatus === "outofstock") {
        if (stock !== 0) return false;
      }

      // 3. Price Range Filter
      const price = parseFloat(item.price || 0);
      if (selectedPriceRange === "under50") {
        if (price >= 50000) return false;
      } else if (selectedPriceRange === "50to200") {
        if (price < 50000 || price > 200000) return false;
      } else if (selectedPriceRange === "over200") {
        if (price <= 200000) return false;
      }

      return true;
    });
  }, [data, selectedCategory, selectedStockStatus, selectedPriceRange]);

  const handleDelete = async (id: string) => {
    try {
      await posService.deleteProduct(id);
      toast.success("Đã xóa sản phẩm");
      loadProducts();
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]|^-|-$)/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // We accept CSV files.
    if (!file.name.endsWith('.csv')) {
      toast.error('Hệ thống hiện chỉ hỗ trợ định dạng file .CSV (được lưu từ Excel)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      if (rows.length <= 1) {
        toast.error('File không hợp lệ hoặc trống!');
        return;
      }

      setLoading(true);
      let successCount = 0;
      
      const toastId = toast.loading('Đang xử lý dữ liệu import...');
      
      // Load categories to map by name
      let catMap = new Map();
      try {
        const catList = await posService.getCategories();
        catList.forEach((c: any) => catMap.set(c.name.trim().toLowerCase(), c.id));
      } catch (e) {
        console.error("Could not load categories for mapping", e);
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
        // Parse CSV row ignoring commas inside quotes
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/(^"|"$)/g, '').trim());
        
        // Expecting format: Tên SP (0), Danh mục (1), Giá nhập (2), Giá bán (3), Tồn kho (4), SKU/Barcode (5), Tồn tối thiểu (6)
        if (cols.length >= 5 && cols[0]) {
          let catId = null;
          if (cols[1]) {
            const catName = cols[1].trim();
            const cNameLower = catName.toLowerCase();
            if (catMap.has(cNameLower)) {
              catId = catMap.get(cNameLower);
            } else {
              // Dynamically create category
              try {
                const orgId = await posService.getActiveOrganizationId();
                const newCat = await posService.createCategory({
                  name: catName,
                  slug: slugify(catName),
                  organization_id: orgId
                });
                catId = newCat.id;
                catMap.set(cNameLower, catId);
              } catch (catErr) {
                console.error("Could not dynamically create category during import", catName, catErr);
              }
            }
          }

          try {
            await posService.createProduct({
              name: cols[0],
              category_id: catId,
              cost_price: parseFloat(cols[2]) || 0,
              price: parseFloat(cols[3]) || 0,
              stock: parseInt(cols[4]) || 0,
              barcode: cols[5] || '',
              min_stock: parseInt(cols[6]) || 5,
              description: 'Imported from CSV'
            });
            successCount++;
          } catch (err) {
            console.error('Error importing row:', i, err);
          }
        }
      }
      
      toast.success(`Đã import thành công ${successCount} sản phẩm!`, { id: toastId });
      loadProducts();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Tên sản phẩm", "Danh mục", "Giá nhập", "Giá bán", "Tồn kho", "Mã SKU", "Tồn tối thiểu"];
    const sampleRow1 = ["Cà phê sữa đá", "Cà phê", "12000", "25000", "100", "CF001", "10"];
    const sampleRow2 = ["Bạc xỉu", "Cà phê", "15000", "30000", "50", "BX001", "5"];
    const csvContent = "\uFEFF" + [headers.join(","), sampleRow1.join(","), sampleRow2.join(",")].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "zpos_template_san_pham.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 h-8"
          >
            Sản phẩm
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex-shrink-0 border">
            {row.original.image ? (
              <img src={row.original.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-full h-full p-2 text-muted-foreground/30" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">SKU: {row.original.barcode || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Danh mục",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px] font-bold">
          {row.original.category?.name || "Chưa phân loại"}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Giá bán",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount);
        return <div className="font-bold text-sm text-primary">{formatted}</div>;
      },
    },
    {
      accessorKey: "stock",
      header: "Tồn kho",
      cell: ({ row }) => {
        const stock = parseInt(row.getValue("stock"));
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${stock <= 5 ? 'text-red-500' : ''}`}>
              {stock}
            </span>
            {stock <= 5 && <AlertTriangle className="w-3 h-3 text-red-500" />}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setEditingProduct(row.original)}
            className="hover:bg-muted"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa sản phẩm?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ đánh dấu sản phẩm "{row.original.name}" là ngừng kinh doanh và không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original.id)} className="bg-destructive hover:bg-destructive/90">
                  Xác nhận xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Sản phẩm</h1>
          <p className="text-muted-foreground text-sm">Quản lý danh mục sản phẩm và tồn kho của bạn.</p>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".csv"
            onChange={handleImport}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileUp className="mr-2 h-4 w-4 text-emerald-600" />
                Nhập từ Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Tiện ích Import</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadTemplate} className="cursor-pointer">
                <FileDown className="mr-2 h-4 w-4" />
                Tải file mẫu (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4 text-emerald-600" />
                Tải lên file dữ liệu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => exportToCSV(data, 'danh_sach_san_pham')}
          >
            <FileDown className="mr-2 h-4 w-4 text-blue-600" />
            Xuất CSV
          </Button>
          <AddProductDialog onShowSuccess={loadProducts} />
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Tìm theo tên, mã SKU..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Button 
          variant={showFilters || selectedCategory !== "all" || selectedStockStatus !== "all" || selectedPriceRange !== "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Bộ lọc
          {(selectedCategory !== "all" || selectedStockStatus !== "all" || selectedPriceRange !== "all") && (
            <Badge variant="secondary" className="ml-1.5 px-1 py-0.2 bg-background text-foreground text-[9px] rounded-full font-extrabold border-none">
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Collapsible Advanced Filters Panel */}
      {showFilters && (
        <div className="grid gap-4 md:grid-cols-3 p-4 rounded-xl border bg-muted/20 animate-in slide-in-from-top-2 duration-200">
          {/* Category Filter */}
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Danh mục sản phẩm</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Trạng thái tồn kho</label>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="low">Sắp hết hàng / Dưới cảnh báo</option>
              <option value="instock">Còn hàng (Đầy đủ)</option>
              <option value="outofstock">Đã hết hàng (= 0)</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Khoảng giá bán</label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
            >
              <option value="all">Tất cả khoảng giá</option>
              <option value="under50">Dưới 50.000 đ</option>
              <option value="50to200">50.000 đ - 200.000 đ</option>
              <option value="over200">Trên 200.000 đ</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory !== "all" || selectedStockStatus !== "all" || selectedPriceRange !== "all") && (
            <div className="md:col-span-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedStockStatus("all");
                  setSelectedPriceRange("all");
                  toast.success("Đã đặt lại tất cả bộ lọc");
                }}
                className="text-xs font-bold hover:bg-destructive/10 hover:text-destructive h-8"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}
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
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm">Đang đồng bộ dữ liệu sản phẩm...</span>
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
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                    <Package className="w-12 h-12" />
                    <span className="text-sm">Không tìm thấy sản phẩm nào.</span>
                  </div>
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

      {editingProduct && (
        <EditProductDialog 
          product={editingProduct} 
          open={!!editingProduct} 
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null);
          }} 
          onSuccess={() => {
            setEditingProduct(null);
            loadProducts();
          }} 
        />
      )}
    </div>
  );
}
