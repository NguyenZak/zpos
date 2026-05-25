"use client";

import React, { useState, useEffect } from "react";
import { Edit, Loader2, UserCheck, DollarSign } from "lucide-react";
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

export function EditPayrollDialog({ payroll, onShowSuccess }: { payroll: any; onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salesData, setSalesData] = useState<{ revenue: number; bonus: number; rule: any; nextRule: any } | null>(null);
  const [shiftCount, setShiftCount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [salaryType, setSalaryType] = useState<"monthly" | "shift">("monthly");
  const [shiftWage, setShiftWage] = useState("150000");

  const [formData, setFormData] = useState({
    staff_id: "",
    base_salary: "",
    bonus: "0",
    allowance: "0",
    deduction: "0",
    payment_status: "pending",
    payment_date: new Date().toISOString().split("T")[0],
    note: "",
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await posService.getEmployees();
        setEmployees(data || []);
      } catch (error) {
        console.error(error);
      }
    };
    if (open) {
      loadEmployees();
      if (payroll) {
        setFormData({
          staff_id: payroll.staff_id || "",
          base_salary: payroll.base_salary?.toString() || "0",
          bonus: payroll.bonus?.toString() || "0",
          allowance: payroll.allowance?.toString() || "0",
          deduction: payroll.deduction?.toString() || "0",
          payment_status: payroll.payment_status || "pending",
          payment_date: payroll.payment_date
            ? new Date(payroll.payment_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          note: payroll.note || "",
        });
      }
    }
  }, [open, payroll]);

  useEffect(() => {
    const calculateBonus = async () => {
      if (!formData.staff_id || !open) return;
      setIsCalculating(true);
      try {
        const rules = await posService.getCommissionRules();
        const employee = employees.find((e) => e.id === formData.staff_id);
        if (!employee || !employee.profile_id) {
          setSalesData(null);
          return;
        }

        const [revenue, shifts, advances] = await Promise.all([
          posService.getEmployeeRevenueForMonth(employee.profile_id, selectedMonth, selectedYear),
          posService.getEmployeeShiftCountForMonth(employee.profile_id, selectedMonth, selectedYear),
          posService.getEmployeeAdvancesForMonth(employee.id, selectedMonth, selectedYear),
        ]);

        let calculatedBonus = 0;
        let matchedRule = null;
        let nextRule = null;

        // Rules are sorted DESC by min_revenue
        for (let i = 0; i < rules.length; i++) {
          if (revenue >= rules[i].min_revenue) {
            matchedRule = rules[i];
            break;
          }
        }

        // Find next rule if any
        if (!matchedRule && rules.length > 0) {
          nextRule = rules[rules.length - 1]; // lowest rule
        } else if (matchedRule) {
          const reversed = [...rules].reverse();
          nextRule = reversed.find((r) => r.min_revenue > revenue);
        }

        if (matchedRule) {
          calculatedBonus = (revenue * matchedRule.commission_percentage) / 100;
        }

        setSalesData({ revenue, bonus: calculatedBonus, rule: matchedRule, nextRule });
        setShiftCount(shifts);
        // Only auto-update if bonus is calculated or we had a previous calculation
        if (calculatedBonus > 0 || (salesData && salesData.bonus > 0)) {
          setFormData((prev) => ({ ...prev, bonus: calculatedBonus.toString() }));
        }

        if (advances > 0) {
          setFormData((prev) => ({ ...prev, deduction: advances.toString() }));
        }
      } catch (error) {
        console.error("Error calculating bonus:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    // Slight debounce so it doesn't spam on open
    const t = setTimeout(() => {
      calculateBonus();
    }, 300);
    return () => clearTimeout(t);
  }, [formData.staff_id, selectedMonth, selectedYear, open]); // Removed employees dependency to avoid loop if it references new array

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

    let base = parseFloat(parseCurrencyValue(formData.base_salary)) || 0;
    if (salaryType === "shift") {
      base = (parseFloat(parseCurrencyValue(shiftWage)) || 0) * (shiftCount || 0);
    }

    const bonus = parseFloat(parseCurrencyValue(formData.bonus)) || 0;
    const allowance = parseFloat(parseCurrencyValue(formData.allowance)) || 0;
    const deduction = parseFloat(parseCurrencyValue(formData.deduction)) || 0;
    const finalSalary = base + bonus + allowance - deduction;

    try {
      await posService.updatePayroll(payroll.id, {
        staff_id: formData.staff_id,
        base_salary: base,
        bonus,
        allowance,
        deduction,
        final_salary: finalSalary,
        payment_status: formData.payment_status,
        payment_date: formData.payment_status === "paid" ? formData.payment_date : null,
        note: formData.note,
      });

      toast.success("Đã cập nhật bảng lương thành công!");
      setOpen(false);
      if (onShowSuccess) onShowSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi: ${error.message || "Không thể cập nhật bảng lương"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Edit className="w-4 h-4" /> Sửa phiếu lương
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Sửa bảng lương & Thưởng
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin phiếu lương cho nhân viên.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                {shiftCount !== null && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Đã làm <strong className="text-emerald-600">{shiftCount}</strong> ca trong T{selectedMonth}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Kỳ lương</Label>
                <div className="flex gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Tháng {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Năm" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map((offset) => {
                        const y = new Date().getFullYear() - offset;
                        return (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-emerald-700">Lương cơ bản</Label>
                <Select value={salaryType} onValueChange={(val) => setSalaryType(val as "monthly" | "shift")}>
                  <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" className="text-xs">
                      Theo tháng cố định
                    </SelectItem>
                    <SelectItem value="shift" className="text-xs">
                      Theo số ca làm việc
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {salaryType === "monthly" ? (
                <div className="grid gap-2">
                  <Input
                    id="base_salary"
                    type="text"
                    placeholder="5,000,000"
                    value={formatCurrencyValue(formData.base_salary)}
                    onChange={(e) => setFormData({ ...formData, base_salary: parseCurrencyValue(e.target.value) })}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Nhập trực tiếp số tiền lương cố định trong tháng.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Tiền lương 1 ca (₫)</Label>
                    <Input
                      id="shift_wage"
                      type="text"
                      placeholder="150,000"
                      value={formatCurrencyValue(shiftWage)}
                      onChange={(e) => setShiftWage(parseCurrencyValue(e.target.value))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Tổng (Ca x Tiền/ca)</Label>
                    <div className="flex h-10 w-full rounded-md border border-input bg-zinc-100 px-3 py-2 text-sm font-bold items-center text-emerald-700">
                      {formatCurrencyValue((parseFloat(parseCurrencyValue(shiftWage)) || 0) * (shiftCount || 0))} ₫
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bonus">
                  Khen thưởng doanh thu (₫)
                  {isCalculating && <Loader2 className="inline w-3 h-3 animate-spin ml-2 text-emerald-600" />}
                </Label>
                <Input
                  id="bonus"
                  type="text"
                  value={formatCurrencyValue(formData.bonus)}
                  onChange={(e) => setFormData({ ...formData, bonus: parseCurrencyValue(e.target.value) })}
                />
                {salesData && (
                  <div className="text-[11px] text-muted-foreground leading-tight mt-1 bg-emerald-50 p-2 rounded border border-emerald-100">
                    Doanh thu T{selectedMonth}:{" "}
                    <strong className="text-emerald-600 font-medium">{formatCurrencyValue(salesData.revenue)}₫</strong>
                    {salesData.rule ? (
                      <span className="block text-emerald-600 mt-0.5">
                        Đạt mốc: {salesData.rule.name} (+{salesData.rule.commission_percentage}%)
                        {salesData.nextRule &&
                          ` • Cần thêm ${formatCurrencyValue(salesData.nextRule.min_revenue - salesData.revenue)}₫ đạt ${salesData.nextRule.name}`}
                      </span>
                    ) : salesData.nextRule ? (
                      <span className="block mt-0.5 text-zinc-500">
                        Chưa đạt thưởng • Cần thêm{" "}
                        {formatCurrencyValue(salesData.nextRule.min_revenue - salesData.revenue)}₫ đạt{" "}
                        {salesData.nextRule.name}
                      </span>
                    ) : (
                      <span className="block mt-0.5 text-zinc-500">Chưa có mốc thưởng nào</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              {formData.payment_status === "paid" && (
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
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
