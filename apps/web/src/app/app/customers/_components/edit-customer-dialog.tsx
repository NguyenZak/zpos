"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Pencil, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";

type EditCustomerDialogProps = {
  customer: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function EditCustomerDialog({ customer, open, onOpenChange, onUpdated }: EditCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (open && customer) {
      setFormData({
        name: customer.name ?? "",
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
      });
    }
  }, [open, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id) return;
    setLoading(true);
    try {
      await posService.updateCustomer(customer.id, {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || "",
      });
      toast.success("Đã cập nhật khách hàng", {
        description: "Thông tin khách hàng đã được lưu.",
      });
      onOpenChange(false);
      onUpdated?.();
    } catch (error: any) {
      console.error("Lỗi cập nhật khách hàng:", error);
      toast.error("Lỗi khi cập nhật khách hàng", {
        description: error?.message ?? "Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] sm:w-full rounded-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Chỉnh sửa khách hàng
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin liên hệ và địa chỉ của khách hàng.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Họ và tên</Label>
              <Input
                id="edit-name"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  placeholder="09xx xxx xxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="khachhang@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Địa chỉ</Label>
              <Input
                id="edit-address"
                placeholder="Số nhà, đường, quận, thành phố"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:pt-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
