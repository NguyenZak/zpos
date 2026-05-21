"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ReturnOrderDialogProps {
  order: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReturnOrderDialog({ order, open, onOpenChange, onSuccess }: ReturnOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");
  const [customRefundAmount, setCustomRefundAmount] = useState<number | null>(null);

  useEffect(() => {
    if (open && order && order.order_items) {
      // Initialize return items with qty 0 and restock true
      setReturnItems(order.order_items.map((it: any) => ({
        ...it,
        returnQty: 0, // initially 0
        restock: true
      })));
      setCustomRefundAmount(null);
      setReason("");
      setRefundMethod("cash");
    }
  }, [open, order]);

  if (!order) return null;

  const totalReturnAmount = returnItems.reduce((sum, item) => sum + (item.returnQty * item.unit_price), 0);
  const finalRefundAmount = customRefundAmount !== null ? customRefundAmount : totalReturnAmount;

  const hasItemsToReturn = returnItems.some(it => it.returnQty > 0);

  const handleSubmit = async () => {
    if (!hasItemsToReturn) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để trả!");
      return;
    }

    setLoading(true);
    try {
      const itemsToReturn = returnItems
        .filter(it => it.returnQty > 0)
        .map(it => ({
          order_item_id: it.id,
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.returnQty,
          refund_price: it.unit_price * it.returnQty,
          is_restocked: it.restock
        }));

      await posService.processReturnOrder({
        order_id: order.id,
        customer_id: order.customer_id,
        total_refund_amount: finalRefundAmount,
        refund_method: refundMethod,
        reason,
        items: itemsToReturn
      });

      toast.success("Đã hoàn tất trả hàng & hoàn tiền!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Return order error:", error);
      toast.error(`Lỗi khi hoàn trả: ${error.message || "Không xác định"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + " đ";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ArrowLeftRight className="w-5 h-5 text-orange-500" />
            Trả hàng & Hoàn tiền - Đơn #{order.order_number}
          </DialogTitle>
          <DialogDescription>
            Chọn số lượng sản phẩm khách muốn trả lại và số tiền cần hoàn.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-center">Đã mua</th>
                  <th className="p-3 text-center">SL Trả</th>
                  <th className="p-3 text-center">Hoàn Kho?</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returnItems.map((item, idx) => {
                  const prodName = item.variant?.product?.name || item.product_name || "Sản phẩm";
                  const vName = item.variant?.name || item.variant_name;
                  const variantName = vName && vName !== 'Default' ? ` (${vName})` : '';
                  return (
                    <tr key={idx} className={item.returnQty > 0 ? "bg-orange-50/50" : ""}>
                      <td className="p-3 font-semibold text-foreground">
                        {prodName}
                        {variantName && <span className="block text-xs font-normal text-muted-foreground">{variantName}</span>}
                        <span className="block text-xs font-medium text-primary mt-1">{formatCurrency(item.unit_price)}/sp</span>
                      </td>
                      <td className="p-3 text-center font-bold text-muted-foreground">{item.quantity}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              const newItems = [...returnItems];
                              if (newItems[idx].returnQty > 0) newItems[idx].returnQty--;
                              setReturnItems(newItems);
                            }}
                          >-</Button>
                          <span className="w-6 font-bold text-base">{item.returnQty}</span>
                          <Button 
                            variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              const newItems = [...returnItems];
                              if (newItems[idx].returnQty < item.quantity) newItems[idx].returnQty++;
                              setReturnItems(newItems);
                            }}
                          >+</Button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          checked={item.restock}
                          onCheckedChange={(val) => {
                            const newItems = [...returnItems];
                            newItems[idx].restock = val;
                            setReturnItems(newItems);
                          }}
                          disabled={item.returnQty === 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
              <h4 className="font-semibold text-sm">Phương thức hoàn tiền</h4>
              <Select value={refundMethod} onValueChange={setRefundMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Thẻ (Quẹt thẻ)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="grid gap-2 pt-2">
                <Label className="text-xs font-semibold">Lý do trả hàng (Tùy chọn)</Label>
                <Textarea 
                  placeholder="Khách không ưng ý, hàng lỗi..."
                  className="resize-none h-16 text-xs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border bg-orange-50/50 border-orange-100">
              <h4 className="font-semibold text-sm text-orange-700">Tổng tiền hoàn trả</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Giá trị hàng trả:</span>
                <span className="font-bold">{formatCurrency(totalReturnAmount)}</span>
              </div>
              <div className="grid gap-2 border-t pt-3 border-orange-200">
                <Label className="text-xs font-semibold text-orange-700">Tùy chỉnh số tiền hoàn (nếu cần)</Label>
                <Input 
                  type="number"
                  className="font-bold text-lg text-primary"
                  value={customRefundAmount !== null ? customRefundAmount : totalReturnAmount}
                  onChange={(e) => setCustomRefundAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!hasItemsToReturn || loading} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Xác nhận Hoàn: {formatCurrency(finalRefundAmount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
