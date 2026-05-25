"use client";

import React, { useState, useEffect } from "react";
import { HandCoins, Loader2 } from "lucide-react";
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

export function SalaryAdvanceDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    staff_id: "",
    amount: "",
    advance_date: new Date().toISOString().split("T")[0],
    note: "",
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await posService.getEmployees();
        setEmployees(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({ ...prev, staff_id: data[0].id }));
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (open) loadEmployees();
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
      await posService.createSalaryAdvance({
        staff_id: formData.staff_id,
        amount: parseFloat(parseCurrencyValue(formData.amount)) || 0,
        advance_date: formData.advance_date,
        note: formData.note,
      });

      toast.success("Đã ghi nhận tạm ứng thành công!");
      setOpen(false);
      setFormData({
        staff_id: employees[0]?.id || "",
        amount: "",
        advance_date: new Date().toISOString().split("T")[0],
        note: "",
      });
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi: ${error.message || "Không thể ghi nhận tạm ứng"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HandCoins className="h-4 w-4 text-orange-500" />
          Tạm ứng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-orange-500" />
              Tạm ứng lương
            </DialogTitle>
            <DialogDescription>
              Ghi nhận nhân viên ứng tiền trước trong tháng. Khoản này sẽ tự động được đưa vào Khấu trừ khi chốt lương.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Nhân viên</Label>
              <Select value={formData.staff_id} onValueChange={(val) => setFormData({ ...formData, staff_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Số tiền tạm ứng (₫)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="1,000,000"
                value={formatCurrencyValue(formData.amount)}
                onChange={(e) => setFormData({ ...formData, amount: parseCurrencyValue(e.target.value) })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="advance_date">Ngày tạm ứng</Label>
              <Input
                id="advance_date"
                type="date"
                value={formData.advance_date}
                onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú (Tùy chọn)</Label>
              <Input
                id="note"
                placeholder="Lý do tạm ứng..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ghi nhận tạm ứng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
