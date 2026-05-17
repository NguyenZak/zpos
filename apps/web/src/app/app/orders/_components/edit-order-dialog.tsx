"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditOrderDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditOrderDialog({ orderId, open, onOpenChange, onSuccess }: EditOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails();
    }
  }, [open, orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await posService.getOrderDetails(orderId!);
      setOrderDetails(data);
      setStatus(data.status);
      setPaymentMethod(data.payment_method);
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết đơn hàng");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await posService.updateOrder(orderId!, {
        status,
        payment_method: paymentMethod
      });
      toast.success("Đã cập nhật đơn hàng", {
        description: `Mã đơn #${orderDetails.order_number} đã được cập nhật.`
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Lỗi khi cập nhật đơn hàng");
    } finally {
      setSaving(false);
    }
  };

  if (!orderId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chỉnh sửa đơn hàng 
            {orderDetails && <span className="text-primary">#{orderDetails.order_number}</span>}
          </DialogTitle>
          <DialogDescription>
            Cập nhật trạng thái xử lý và thông tin thanh toán của đơn hàng.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang lấy dữ liệu...</p>
          </div>
        ) : orderDetails && (
          <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tổng tiền</span>
                <span className="text-lg font-black text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderDetails.total_amount)}
                </span>
              </div>
              <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                {status}
              </Badge>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái đơn hàng</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Đang xử lý</SelectItem>
                    <SelectItem value="completed">Đã hoàn tất</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_method">Phương thức thanh toán</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment_method">
                    <SelectValue placeholder="Chọn phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                    <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border bg-amber-500/5 p-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-[11px] text-amber-700 leading-relaxed">
                Việc thay đổi trạng thái đơn hàng sẽ ảnh hưởng đến báo cáo doanh thu và tồn kho. Hãy chắc chắn trước khi lưu.
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Hủy</Button>
          <Button onClick={handleUpdate} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
