"use client";

import React, { useState, useEffect } from "react";
import { Settings, Loader2, Plus, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { posService } from "@/services/pos.service";

interface CommissionRule {
  id?: string;
  name: string;
  min_revenue: string;
  commission_percentage: string;
}

export function ConfigBonusDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [rules, setRules] = useState<CommissionRule[]>([
    { name: "Mức 1", min_revenue: "50000000", commission_percentage: "1" }
  ]);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const fetchedRules = await posService.getCommissionRules();
        if (fetchedRules && fetchedRules.length > 0) {
          // Sort by min_revenue ASC for editing
          const sorted = fetchedRules.sort((a: any, b: any) => a.min_revenue - b.min_revenue);
          setRules(sorted.map((r: any) => ({
            id: r.id,
            name: r.name || "Mức thưởng",
            min_revenue: r.min_revenue.toString(),
            commission_percentage: r.commission_percentage.toString()
          })));
        } else {
          setRules([{ name: "Mức 1", min_revenue: "50000000", commission_percentage: "1" }]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (open) loadRules();
  }, [open]);

  const formatCurrencyValue = (value: string | number) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCurrencyValue = (value: string) => {
    return value.replace(/,/g, "");
  };

  const handleRuleChange = (index: number, field: keyof CommissionRule, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const addRule = () => {
    setRules([...rules, { name: `Mức ${rules.length + 1}`, min_revenue: "0", commission_percentage: "0" }]);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const parsedRules = rules.map(r => ({
        name: r.name,
        min_revenue: parseFloat(parseCurrencyValue(r.min_revenue)) || 0,
        commission_percentage: parseFloat(r.commission_percentage) || 0
      }));
      
      await posService.saveCommissionRules(parsedRules);
      
      toast.success("Đã lưu cấu hình thưởng thành công!");
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi: ${error.message || "Không thể lưu cấu hình"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4 text-emerald-600" />
          Cấu hình thưởng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              Cơ chế thưởng theo bậc (Multi-tier)
            </DialogTitle>
            <DialogDescription>
              Thiết lập nhiều mức thưởng tự động. Nhân viên đạt mức doanh thu cao nhất nào sẽ nhận % của mức đó.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="grid gap-2 flex-1">
                  <Label>Tên mốc</Label>
                  <Input 
                    placeholder="VD: Mức 1" 
                    value={rule.name}
                    onChange={(e) => handleRuleChange(index, "name", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2 flex-1">
                  <Label>Doanh thu tối thiểu (₫)</Label>
                  <Input 
                    placeholder="50,000,000" 
                    value={formatCurrencyValue(rule.min_revenue)}
                    onChange={(e) => handleRuleChange(index, "min_revenue", parseCurrencyValue(e.target.value))}
                    required
                  />
                </div>
                <div className="grid gap-2 w-[120px]">
                  <Label>Thưởng (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rule.commission_percentage}
                      onChange={(e) => handleRuleChange(index, "commission_percentage", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 mb-0.5"
                  onClick={() => removeRule(index)}
                  disabled={rules.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed gap-2"
              onClick={addRule}
            >
              <Plus className="h-4 w-4" />
              Thêm mốc thưởng mới
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
