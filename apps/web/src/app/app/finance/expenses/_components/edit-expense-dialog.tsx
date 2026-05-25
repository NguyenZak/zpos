"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Loader2, Receipt } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";

interface EditExpenseDialogProps {
  expense: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditExpenseDialog({ expense, open, onOpenChange, onSuccess }: EditExpenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    amount: "",
    payment_method: "cash",
    expense_date: new Date().toISOString().split("T")[0],
    note: "",
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await posService.getExpenseCategories();
        setCategories(cats);
      } catch (error) {
        console.error(error);
      }
    };
    if (open) {
      loadCategories();
      if (expense) {
        setFormData({
          title: expense.title || "",
          category_id: expense.category_id || "",
          amount: expense.amount ? expense.amount.toString() : "",
          payment_method: expense.payment_method || "cash",
          expense_date: expense.expense_date
            ? new Date(expense.expense_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          note: expense.note || "",
        });
      }
    }
  }, [open, expense]);

  const formatCurrencyValue = (value: string | number) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCurrencyValue = (value: string) => {
    return value.replace(/,/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await posService.updateExpense(expense.id, {
        title: formData.title,
        category_id: formData.category_id,
        amount: parseFloat(parseCurrencyValue(formData.amount)) || 0,
        payment_method: formData.payment_method,
        expense_date: formData.expense_date,
        note: formData.note,
      });

      toast.success("Đã cập nhật chi phí thành công!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi: ${error.message || "Không thể cập nhật chi phí"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Sửa khoản chi phí
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin khoản chi phí này.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Lý do chi / Tiêu đề</Label>
              <Input
                id="title"
                placeholder="Ví dụ: Tiền điện tháng 5"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục chi phí</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Số tiền (₫)</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="1,200,000"
                  value={formatCurrencyValue(formData.amount)}
                  onChange={(e) => setFormData({ ...formData, amount: parseCurrencyValue(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="method">Phương thức thanh toán</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                    <SelectItem value="vietqr">VietQR</SelectItem>
                    <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Ngày chi</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú nội bộ</Label>
              <Input
                id="note"
                placeholder="Ghi chú chi tiết..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Đóng
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
