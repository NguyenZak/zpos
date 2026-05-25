"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, Store, Package, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CreatePurchaseDialog({ onShowSuccess }: { onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: "",
    purchase_number: `PN-${Date.now().toString().slice(-6)}`,
    status: "completed",
  });

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [sData, pData] = await Promise.all([posService.getSuppliers(), posService.getProducts()]);
          setSuppliers(sData);
          setProducts(pData);
        } catch (e) {
          console.error(e);
        }
      };
      fetchData();
    }
  }, [open]);

  const addItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const qty = product.stock || 1;
    const cost = product.cost_price ?? product.price * 0.7;
    setItems([
      ...items,
      {
        id: product.id,
        name: product.name,
        quantity: qty,
        cost: cost,
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((acc, item) => acc + item.cost * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }
    if (!formData.supplier_id) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }

    setLoading(true);
    try {
      await posService.createPurchaseOrder(
        {
          organization_id: "00000000-0000-0000-0000-000000000000",
          branch_id: "00000000-0000-0000-0000-000000000000",
          ...formData,
          total_amount: totalCost,
        },
        items,
      );

      toast.success("Đã nhập hàng thành công!");
      setOpen(false);
      setItems([]);
      if (onShowSuccess) onShowSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo đơn nhập hàng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo đơn nhập hàng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-[600px]">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              Nhập hàng vào kho
            </DialogTitle>
            <DialogDescription>Tạo phiếu nhập hàng để cập nhật số lượng tồn kho.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nhà cung cấp</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Mã phiếu nhập</Label>
                <Input value={formData.purchase_number} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Thêm sản phẩm</Label>
              <Select onValueChange={addItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Tìm sản phẩm cần nhập..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 border rounded-md bg-muted/20 p-4">
              <div className="space-y-4">
                {items.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground italic text-sm">
                    Chưa có sản phẩm nào được chọn
                  </div>
                )}
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-card p-3 rounded-md border shadow-sm">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                    </div>
                    <div className="w-20">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">SL</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Giá nhập</Label>
                      <Input
                        type="number"
                        value={item.cost}
                        onChange={(e) => updateItem(index, "cost", parseInt(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="p-6 bg-muted/30 border-t flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng tiền nhập</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalCost)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hoàn tất
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
