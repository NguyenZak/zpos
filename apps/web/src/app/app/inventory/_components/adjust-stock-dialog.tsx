"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InventoryItem } from "../page";
import { createClient } from "@/utils/supabase/client";

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  mode?: "ADJUST" | "LOSS";
  onSuccess: () => void;
}

export function AdjustStockDialog({ open, onOpenChange, item, mode = "ADJUST", onSuccess }: AdjustStockDialogProps) {
  const [stock, setStock] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      setStock(item.stock);
      setReason(mode === "LOSS" ? "Báo mất / hỏng hàng hoá" : "Kiểm kho định kỳ");
    }
  }, [open, item, mode]);

  const handleSave = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const supabase = createClient();

      // Update stock based on type
      let orgId = null;
      let previousStock = item.stock;

      if (item.is_variant) {
        const { data: vData, error } = await supabase
          .from("product_variants")
          .update({ stock })
          .eq("id", item.id)
          .select("products(organization_id)")
          .single();
        if (error) throw error;
        orgId = (vData as any)?.products?.organization_id;
      } else {
        const { data: pData, error } = await supabase
          .from("products")
          .update({ stock })
          .eq("id", item.id)
          .select("organization_id")
          .single();
        if (error) throw error;
        orgId = (pData as any)?.organization_id;
      }

      // Log transaction if possible
      if (orgId) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          await supabase.from("inventory_transactions").insert({
            organization_id: orgId,
            product_id: item.is_variant ? item.product_id : item.id,
            variant_id: item.is_variant ? item.id : null,
            transaction_type: mode === "LOSS" ? "LOSS" : "ADJUSTMENT",
            quantity: stock - previousStock,
            previous_stock: previousStock,
            new_stock: stock,
            notes: reason || (mode === "LOSS" ? "Báo mất / hỏng hàng hoá" : "Điều chỉnh số dư"),
            created_by: user?.id || null,
          });
        } catch (logErr) {
          console.warn("Failed to log inventory transaction (table might not exist yet):", logErr);
        }
      }

      toast.success(`Đã cập nhật tồn kho cho ${item.name}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Lỗi cập nhật tồn kho: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "LOSS" ? "Báo mất / hỏng: " : "Cập nhật số dư: "}
            {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tồn kho hiện tại</Label>
            <Input disabled value={item.stock} />
          </div>
          <div className="grid gap-2">
            <Label>Tồn kho thực tế (mới)</Label>
            <Input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value) || 0)} autoFocus />
          </div>
          <div className="grid gap-2">
            <Label>Lý do / Ghi chú</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Kiểm kho, Báo hỏng..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
