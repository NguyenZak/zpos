"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, List, Trash2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";

export function CategoryManagerDialog({ onCategoriesChange }: { onCategoriesChange?: () => void }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await posService.getExpenseCategories();
      setCategories(cats);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCategories();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
  };

  const handleEditClick = (cat: any) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await posService.updateExpenseCategory(editingId, formData);
        toast.success("Đã cập nhật danh mục");
      } else {
        await posService.createExpenseCategory(formData);
        toast.success("Đã thêm danh mục mới");
      }
      resetForm();
      await loadCategories();
      if (onCategoriesChange) onCategoriesChange();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message || "Không thể lưu danh mục"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    setLoading(true);
    try {
      await posService.deleteExpenseCategory(id);
      toast.success("Đã xóa danh mục");
      await loadCategories();
      if (onCategoriesChange) onCategoriesChange();
    } catch (error: any) {
      toast.error("Lỗi khi xóa danh mục. Có thể danh mục này đang được sử dụng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <List className="h-4 w-4" />
          Quản lý danh mục
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            Quản lý danh mục chi phí
          </DialogTitle>
          <DialogDescription>Thêm, sửa, xóa các danh mục để phân loại các khoản chi.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-medium text-sm">{editingId ? "Sửa danh mục" : "Thêm danh mục mới"}</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Tên danh mục..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className="flex-1"
                autoFocus
              />
              <Input
                placeholder="Mô tả ngắn (tùy chọn)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !formData.name.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Lưu" : "Thêm"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm} disabled={loading}>
                  Hủy
                </Button>
              )}
            </div>
          </form>

          <div className="border rounded-lg max-h-[300px] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                ) : (
                  "Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!"
                )}
              </div>
            ) : (
              <div className="divide-y">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => handleEditClick(cat)}
                        disabled={loading}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(cat.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
