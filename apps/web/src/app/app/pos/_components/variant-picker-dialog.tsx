"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Layers, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export type PickedVariant = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  image?: string | null;
  price: number;
  cost_price?: number;
  stock: number;
  attributes: Record<string, string>;
};

interface VariantPickerDialogProps {
  product: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (variant: PickedVariant, product: any) => void;
  onConfirmAll?: (variants: PickedVariant[], product: any) => void;
  allowOutOfStock?: boolean;
}

function deriveAttributeMap(rawVariants: any[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  rawVariants.forEach((v) => {
    const attrs = v?.attributes || {};
    Object.entries(attrs).forEach(([k, val]) => {
      const list = map.get(k) || [];
      const strVal = String(val);
      if (!list.includes(strVal)) list.push(strVal);
      map.set(k, list);
    });
  });
  return map;
}

function findVariant(rawVariants: any[], selection: Record<string, string>): any | undefined {
  const keys = Object.keys(selection);
  return rawVariants.find((v) => {
    const attrs = v?.attributes || {};
    return keys.every((k) => String(attrs[k] ?? "") === selection[k]);
  });
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export function VariantPickerDialog({ product, open, onOpenChange, onConfirm, onConfirmAll, allowOutOfStock = false }: VariantPickerDialogProps) {
  const rawVariants: any[] = useMemo(
    () => (product && Array.isArray(product.variants) ? product.variants : []),
    [product],
  );

  const attributeMap = useMemo(() => deriveAttributeMap(rawVariants), [rawVariants]);
  const attributeNames = useMemo(() => Array.from(attributeMap.keys()), [attributeMap]);

  const [selection, setSelection] = useState<Record<string, string>>({});

  // Reset selection each time the dialog opens for a new product
  useEffect(() => {
    if (open) setSelection({});
  }, [open, product?.id]);

  const fullySelected = attributeNames.length > 0 && attributeNames.every((k) => selection[k]);
  const matchedVariant = fullySelected ? findVariant(rawVariants, selection) : undefined;
  const matchedStock = Number(matchedVariant?.stock ?? 0);
  const matchedPrice = Number(matchedVariant?.price ?? 0);
  const matchedCostPrice = Number(matchedVariant?.cost_price ?? 0);

  // Determine which values are still selectable given the current selection
  const isValueAvailable = (attrName: string, value: string) => {
    const tentative = { ...selection, [attrName]: value };
    return rawVariants.some((v) => {
      const attrs = v?.attributes || {};
      return Object.entries(tentative).every(([k, val]) => String(attrs[k] ?? "") === val);
    });
  };

  const handleConfirm = () => {
    if (!matchedVariant || !product) return;
    if (!allowOutOfStock && matchedStock <= 0) return;
    const variantName = matchedVariant.name || Object.values(selection).join(" / ");
    onConfirm(
      {
        id: matchedVariant.id,
        name: variantName,
        sku: matchedVariant.sku || null,
        barcode: matchedVariant.barcode || null,
        image: matchedVariant.image_url || null,
        price: matchedPrice,
        cost_price: matchedCostPrice,
        stock: matchedStock,
        attributes: matchedVariant.attributes || {},
      },
      product,
    );
    onOpenChange(false);
  };

  const handleConfirmAll = () => {
    if (!product || !onConfirmAll) return;
    const variantsToReturn: PickedVariant[] = rawVariants
      .filter(v => allowOutOfStock || Number(v.stock ?? 0) > 0)
      .map(v => ({
        id: v.id,
        name: v.name || "",
        sku: v.sku || null,
        barcode: v.barcode || null,
        image: v.image_url || null,
        price: Number(v.price ?? 0),
        cost_price: Number(v.cost_price ?? 0),
        stock: Number(v.stock ?? 0),
        attributes: v.attributes || {},
      }));
    if (variantsToReturn.length > 0) {
      onConfirmAll(variantsToReturn, product);
      onOpenChange(false);
    } else {
      toast.error("Không có phiên bản nào khả dụng");
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 p-0 sm:rounded-2xl overflow-hidden">
        <DialogHeader className="border-b px-5 py-4 text-left bg-muted/20">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground">
              <Layers className="h-5 w-5" />
            </span>
            <span className="line-clamp-1">{product.name}</span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-[13px] text-muted-foreground">
            Chọn biến thể để thêm vào đơn ({rawVariants.length} phiên bản)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5">
          {attributeNames.map((attrName) => {
            const values = attributeMap.get(attrName) || [];
            return (
              <div key={attrName} className="space-y-3">
                <Label className="text-sm font-bold uppercase text-muted-foreground/80">{attrName}</Label>
                <div className="flex flex-wrap gap-2.5">
                  {values.map((val) => {
                    const isSelected = selection[attrName] === val;
                    const isAvailable = isValueAvailable(attrName, val);
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelection({ ...selection, [attrName]: val })}
                        className={`rounded-xl border px-3 py-2 text-[13px] font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                            : isAvailable
                              ? "border-input bg-background text-foreground hover:bg-muted hover:text-foreground"
                              : "cursor-not-allowed border-dashed border-input bg-muted/40 text-muted-foreground/40"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="rounded-xl border border-input/60 bg-muted/10 p-3.5">
            {!fullySelected ? (
              <p className="text-sm text-muted-foreground">Chọn đủ thuộc tính để xem giá và tồn kho.</p>
            ) : matchedVariant ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {(matchedVariant.image_url || product.image) && (
                    <img
                      src={matchedVariant.image_url || product.image}
                      alt={matchedVariant.name || ""}
                      className="h-14 w-14 shrink-0 rounded-xl border object-cover"
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground/80">Phiên bản</p>
                    <p className="mt-0.5 font-bold text-foreground">{matchedVariant.name || Object.values(selection).join(" / ")}</p>
                    {matchedVariant.sku && (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">SKU: {matchedVariant.sku}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatVND(matchedPrice)}</p>
                  <p
                    className={`mt-0.5 text-xs font-semibold ${
                      matchedStock <= 0
                        ? "text-red-500"
                        : matchedStock <= 5
                          ? "text-amber-500"
                          : "text-green-600"
                    }`}
                  >
                    {matchedStock > 0 ? `Còn ${matchedStock} SP` : "Hết hàng"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500">Tổ hợp này không tồn tại.</p>
            )}
          </div>
        </div>

        <DialogFooter className="m-0 flex flex-row items-center justify-between gap-2 border-t px-5 py-3.5 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <div className="flex gap-2">
            {onConfirmAll && rawVariants.length > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl px-4 text-sm font-semibold shadow-sm"
                onClick={handleConfirmAll}
              >
                <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                Chọn tất cả
              </Button>
            )}
            <Button
              type="button"
              className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm"
              disabled={!matchedVariant || (!allowOutOfStock && matchedStock <= 0)}
              onClick={handleConfirm}
            >
              <ShoppingCart className="h-4 w-4" />
              Thêm vào
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
