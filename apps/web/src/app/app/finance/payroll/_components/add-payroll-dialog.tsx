"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2, UserCheck, DollarSign } from "lucide-react";
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

export function AddPayrollDialog({ onShowSuccess }: { onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    staff_id: "",
    base_salary: "",
    bonus: "0",
    allowance: "0",
    deduction: "0",
    payment_status: "pending",
    payment_date: new Date().toISOString().split('T')[0],
    note: ""
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await posService.getEmployees();
        setEmployees(data || []);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, staff_id: data[0].id }));
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
    
    const base = parseFloat(parseCurrencyValue(formData.base_salary)) || 0;
    const bonus = parseFloat(parseCurrencyValue(formData.bonus)) || 0;
    const allowance = parseFloat(parseCurrencyValue(formData.allowance)) || 0;
    const deduction = parseFloat(parseCurrencyValue(formData.deduction)) || 0;
    const finalSalary = base + bonus + allowance - deduction;

    try {
      await posService.createPayroll({
        staff_id: formData.staff_id,
        base_salary: base,
        bonus,
        allowance,
        deduction,
        final_salary: finalSalary,
        payment_status: formData.payment_status,
        payment_date: formData.payment_status === 'paid' ? formData.payment_date : null,
        note: formData.note
      });
      
      toast.success("Đã lập bảng lương thành công!");
      setOpen(false);
      setFormData({
        staff_id: employees[0]?.id || "",
        base_salary: "",
        bonus: "0",
        allowance: "0",
        deduction: "0",
        payment_status: "pending",
        payment_date: new Date().toISOString().split('T')[0],
        note: ""
      });
      if (onShowSuccess) onShowSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi: ${error.message || "Không thể lưu bảng lương"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Tính lương nhân viên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Tính lương & Thưởng
            </DialogTitle>
            <DialogDescription>
              Tạo phiếu chi lương cho nhân viên thuộc hệ thống cửa hàng.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff">Nhân viên</Label>
                <Select 
                  value={formData.staff_id} 
                  onValueChange={(val) => setFormData({ ...formData, staff_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="base_salary">Lương cơ bản (₫)</Label>
                <Input 
                  id="base_salary" 
                  type="text" 
                  placeholder="5,000,000" 
                  value={formatCurrencyValue(formData.base_salary)}
                  onChange={(e) => setFormData({ ...formData, base_salary: parseCurrencyValue(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bonus">Khen thưởng (₫)</Label>
                <Input 
                  id="bonus" 
                  type="text" 
                  value={formatCurrencyValue(formData.bonus)}
                  onChange={(e) => setFormData({ ...formData, bonus: parseCurrencyValue(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="allowance">Phụ cấp (₫)</Label>
                <Input 
                  id="allowance" 
                  type="text" 
                  value={formatCurrencyValue(formData.allowance)}
                  onChange={(e) => setFormData({ ...formData, allowance: parseCurrencyValue(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deduction">Khấu trừ / Phạt (₫)</Label>
                <Input 
                  id="deduction" 
                  type="text" 
                  value={formatCurrencyValue(formData.deduction)}
                  onChange={(e) => setFormData({ ...formData, deduction: parseCurrencyValue(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái thanh toán</Label>
                <Select 
                  value={formData.payment_status} 
                  onValueChange={(val) => setFormData({ ...formData, payment_status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="paid">Đã chi trả</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.payment_status === 'paid' && (
                <div className="grid gap-2">
                  <Label htmlFor="date">Ngày thanh toán</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú chi tiết</Label>
              <Input 
                id="note" 
                placeholder="Ghi chú thêm về ca trực, ngày công..." 
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận lương
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
