"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, Receipt } from "lucide-react";
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

export function AddExpenseDialog({ onShowSuccess }: { onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
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
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (open) loadCategories();
  }, [open]);

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
      await posService.createExpense({
        ...formData,
        amount: parseFloat(parseCurrencyValue(formData.amount)) || 0,
        status: "paid", // Default as paid for now
      });

      toast.success("Đã ghi nhận chi phí thành công!");
      setOpen(false);
      setFormData({
        title: "",
        category_id: categories[0]?.id || "",
        amount: "",
        payment_method: "cash",
        expense_date: new Date().toISOString().split("T")[0],
        note: "",
      });
      if (onShowSuccess) onShowSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi: ${error.message || "Không thể lưu chi phí"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm chi phí
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Ghi nhận chi phí mới
            </DialogTitle>
            <DialogDescription>Nhập các khoản chi phí vận hành cửa hàng tại đây.</DialogDescription>
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
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu chi phí
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
