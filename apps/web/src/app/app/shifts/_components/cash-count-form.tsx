"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtVND } from "./format";

interface CashCountFormProps {
  denominations: number[];
  value: Record<number, number>;
  onChange: (next: Record<number, number>) => void;
}

export function CashCountForm({ denominations, value, onChange }: CashCountFormProps) {
  const total = useMemo(() => denominations.reduce((sum, d) => sum + d * (value[d] || 0), 0), [denominations, value]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {denominations.map((d) => (
          <div key={d} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fmtVND(d)}</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={value[d] || ""}
              onChange={(e) => {
                const q = Math.max(0, Number(e.target.value) || 0);
                onChange({ ...value, [d]: q });
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Tổng đếm</span>
        <span className="text-lg font-semibold text-foreground">{fmtVND(total)}</span>
      </div>
    </div>
  );
}
