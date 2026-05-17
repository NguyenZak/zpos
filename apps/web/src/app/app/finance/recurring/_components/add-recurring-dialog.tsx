"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, Activity } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";

export function AddRecurringExpenseDialog({ onShowSuccess }: { onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    amount: "",
    frequency: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    next_due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    auto_create: true
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await posService.getExpenseCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setFormData(prev => ({ ...prev, category_id: cats[0].id }));
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
      await posService.createRecurringExpense({
        ...formData,
        amount: parseFloat(parseCurrencyValue(formData.amount)) || 0
      });
      
      toast.success("Đã thiết lập chi phí định kỳ!");
      setOpen(false);
      if (onShowSuccess) onShowSuccess();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message || "Không thể lưu"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600">
          <Activity className="h-4 w-4" />
          Thiết lập định kỳ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Chi phí định kỳ mới
            </DialogTitle>
            <DialogDescription>
              Tự động tạo chi phí hàng tháng/quý cho các khoản cố định.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Tiêu đề khoản chi</Label>
              <Input 
                id="title" 
                placeholder="Ví dụ: Tiền thuê mặt bằng" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Số tiền cố định (₫)</Label>
                <Input 
                  id="amount" 
                  type="text" 
                  value={formatCurrencyValue(formData.amount)}
                  onChange={(e) => setFormData({ ...formData, amount: parseCurrencyValue(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="freq">Chu kỳ</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(val) => setFormData({ ...formData, frequency: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Hàng ngày</SelectItem>
                    <SelectItem value="weekly">Hàng tuần</SelectItem>
                    <SelectItem value="monthly">Hàng tháng</SelectItem>
                    <SelectItem value="quarterly">Hàng quý</SelectItem>
                    <SelectItem value="yearly">Hàng năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="next_due">Ngày chi tiếp theo</Label>
                <Input 
                  id="next_due" 
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kích hoạt định kỳ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
