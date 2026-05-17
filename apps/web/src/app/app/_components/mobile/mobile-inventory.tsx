"use client";

import React, { useState } from "react";
import { 
  Search, 
  Package, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Plus,
  Minus,
  Barcode,
  RefreshCw,
  X,
  PlusCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MobileInventoryProps {
  products: any[];
  loading?: boolean;
  onUpdateStock?: (productId: number, newStock: number) => Promise<void>;
}

export function MobileInventory({ products: initialProducts, loading = false, onUpdateStock }: MobileInventoryProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("Tất cả");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState(0);

  // Sync state if initialProducts changes
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
  };

  const handleAdjustStockSubmit = async () => {
    if (!selectedProduct) return;
    const newStock = Math.max(0, (selectedProduct.stock ?? 0) + adjustQty);
    
    // Optimistic UI update
    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, stock: newStock } : p));
    
    try {
      if (onUpdateStock) {
        await onUpdateStock(selectedProduct.id, newStock);
      }
      toast.success(`Đã cập nhật tồn kho: ${selectedProduct.name} (Tồn mới: ${newStock})`);
    } catch (e) {
      toast.error("Lỗi khi đồng bộ tồn kho với hệ thống");
    }
    
    setDrawerOpen(false);
  };

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode?.includes(searchQuery) ||
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStock = stockFilter === "Tất cả" ||
      (stockFilter === "Sắp hết hàng" && p.stock !== null && p.stock <= 5 && p.stock > 0) ||
      (stockFilter === "Hết hàng" && (p.stock === null || p.stock === 0)) ||
      (stockFilter === "Đủ hàng" && p.stock !== null && p.stock > 5);

    return matchesSearch && matchesStock;
  });

  const filterChips = ["Tất cả", "Sắp hết hàng", "Hết hàng", "Đủ hàng"];

  return (
    <div className="flex flex-col h-full bg-background pb-12 animate-in fade-in duration-300">
      {/* INVENTORY HEADER */}
      <div className="flex flex-col gap-3.5 border-b pb-4">
        <div className="mt-2">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            Quản lý tồn kho
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cập nhật nhanh lượng hàng hoá thực tế</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4.5 h-4.5" />
          <Input 
            placeholder="Tìm sản phẩm, SKU, mã vạch..." 
            className="pl-10 h-11 bg-muted/40 border-none shadow-none rounded-xl text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* STATUS FILTER CHIPS */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          {filterChips.map((chip: string) => (
            <button
              key={chip}
              onClick={() => setStockFilter(chip)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border snap-start active:scale-95 ${
                stockFilter === chip 
                  ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                  : "bg-card text-muted-foreground border-muted hover:bg-muted"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS INVENTORY CARDS */}
      <div className="flex-1 overflow-y-auto pt-4 pr-1 scrollbar-none pb-24">
        {filteredProducts.length > 0 ? (
          <div className="space-y-3">
            {filteredProducts.map((p) => {
              const stockLevel = p.stock ?? 0;
              const isLow = stockLevel <= 5 && stockLevel > 0;
              const isOut = stockLevel === 0;

              return (
                <Card 
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setAdjustQty(0); setDrawerOpen(true); }}
                  className="border border-muted/50 rounded-2xl active:scale-[0.98] transition-all bg-card cursor-pointer"
                >
                  <CardContent className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop"} 
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border shrink-0"
                        onError={(e)=>{
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop";
                        }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                        <p className="text-[9px] text-muted-foreground font-mono truncate">{p.barcode || p.sku || "ZPOS-PROD"}</p>
                        <p className="text-[9px] font-bold text-primary">{formatCurrency(p.price)}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-[9px] h-5.5 px-2 font-black uppercase border-none",
                          isOut && "bg-destructive/10 text-destructive",
                          isLow && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          !isOut && !isLow && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        Tồn: {stockLevel}
                      </Badge>
                      <p className="text-[8px] text-muted-foreground font-semibold uppercase leading-none">
                        {isOut ? "Hết hàng" : isLow ? "Sắp hết" : "Sẵn sàng"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border border-dashed rounded-2xl">
            <p className="text-xs text-muted-foreground font-bold">Không tìm thấy sản phẩm nào trong kho</p>
          </div>
        )}
      </div>

      {/* QUICK INVENTORY ADJUSTMENT DRAWER */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="pb-8 bg-background max-h-[85vh]">
          {selectedProduct && (
            <>
              <DrawerHeader className="text-left border-b pb-3 px-6">
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedProduct.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop"} 
                      alt={selectedProduct.name}
                      className="w-10 h-10 rounded-lg object-cover border"
                      onError={(e)=>{
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop";
                      }}
                    />
                    <div>
                      <DrawerTitle className="text-sm font-black truncate max-w-[200px]">{selectedProduct.name}</DrawerTitle>
                      <DrawerDescription className="text-[10px] text-muted-foreground font-mono">SKU/Barcode: {selectedProduct.barcode || "N/A"}</DrawerDescription>
                    </div>
                  </div>
                  <DrawerClose asChild>
                    <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="px-6 py-5 space-y-5">
                {/* Visual Inventory Status Card */}
                <div className="grid grid-cols-2 gap-3.5 bg-muted/30 p-3.5 rounded-2xl border">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-muted-foreground uppercase leading-none">Tồn kho hiện tại</span>
                    <h4 className="text-lg font-black font-mono leading-none">{selectedProduct.stock ?? 0}</h4>
                  </div>
                  <div className="space-y-0.5 text-right border-l pl-3.5 border-muted-foreground/10">
                    <span className="text-[8px] font-black text-muted-foreground uppercase leading-none">Sau điều chỉnh</span>
                    <h4 className="text-lg font-black font-mono leading-none text-primary">
                      {Math.max(0, (selectedProduct.stock ?? 0) + adjustQty)}
                    </h4>
                  </div>
                </div>

                {/* Adjuster layout */}
                <div className="space-y-3.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none block text-center">Số lượng điều chỉnh</Label>
                  
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setAdjustQty(adjustQty - 1)}
                      disabled={(selectedProduct.stock ?? 0) + adjustQty <= 0}
                      className="w-12 h-12 rounded-full border bg-card hover:bg-muted text-foreground flex items-center justify-center shadow-xs active:scale-90 transition-all disabled:opacity-30"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    
                    <span className={`text-3xl font-black font-mono w-16 text-center leading-none ${adjustQty > 0 ? "text-emerald-600 dark:text-emerald-400" : adjustQty < 0 ? "text-destructive" : "text-foreground"}`}>
                      {adjustQty > 0 ? `+${adjustQty}` : adjustQty}
                    </span>
                    
                    <button 
                      onClick={() => setAdjustQty(adjustQty + 1)}
                      className="w-12 h-12 rounded-full border bg-card hover:bg-muted text-foreground flex items-center justify-center shadow-xs active:scale-90 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick adjustment increments */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[-10, -5, +5, +10].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAdjustQty(Math.max(-(selectedProduct.stock ?? 0), adjustQty + val))}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                        val > 0 
                          ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" 
                          : "bg-destructive/5 border-destructive/10 text-destructive hover:bg-destructive/10"
                      }`}
                    >
                      {val > 0 ? `+${val}` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <DrawerFooter className="px-6 gap-2 border-t pt-3">
                <Button 
                  onClick={handleAdjustStockSubmit}
                  className="h-12 text-sm font-bold w-full rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đồng bộ tồn kho
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
