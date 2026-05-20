"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Coins, AlertTriangle, CheckCircle2 } from "lucide-react";
import { shiftService, type Shift } from "@/services/shift.service";
import { CashCountForm } from "./cash-count-form";
import { fmtVND } from "./format";

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shift: Shift;
  onClosed?: () => void;
}

export function CloseShiftDialog({ open, onOpenChange, shift, onClosed }: CloseShiftDialogProps) {
  const denominations = shiftService.vndDenominations();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [countedManual, setCountedManual] = useState<number>(0);
  const [useDenominations, setUseDenominations] = useState<boolean>(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [aggregating, setAggregating] = useState(true);
  const [expected, setExpected] = useState<number>(shift.expected_cash_amount || 0);

  useEffect(() => {
    if (!open) return;
    setAggregating(true);
    shiftService.aggregateShift(shift.id).then(async () => {
      const fresh = await shiftService.getShift(shift.id);
      if (fresh) setExpected(Number(fresh.expected_cash_amount || 0));
      setAggregating(false);
    });
  }, [open, shift.id]);

  const countedFromDenominations = useMemo(
    () => denominations.reduce((sum, d) => sum + d * (counts[d] || 0), 0),
    [counts, denominations]
  );
  const counted = useDenominations ? countedFromDenominations : countedManual;
  const difference = counted - expected;

  const submit = async () => {
    setSaving(true);
    try {
      const cashCounts = useDenominations
        ? denominations.map((d) => ({ denomination: d, quantity: counts[d] || 0 })).filter((c) => c.quantity > 0)
        : undefined;
      const res = await shiftService.closeShift({
        shift_id: shift.id,
        counted_cash_amount: counted,
        note,
        cash_counts: cashCounts,
      });
      if (!res.ok) {
        toast.error(res.error || "Không thể đóng ca");
        return;
      }
      toast.success(`Đã đóng ca · ${difference === 0 ? "khớp tiền" : difference > 0 ? "dư " + fmtVND(difference) : "thiếu " + fmtVND(Math.abs(difference))}`);
      onOpenChange(false);
      onClosed?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Coins className="size-5 text-amber-600" /> Đóng ca làm việc</DialogTitle>
          <DialogDescription>Đếm tiền cuối ca và đối soát với số liệu hệ thống.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Đầu ca</p>
              <p className="font-semibold">{fmtVND(shift.opening_cash_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hệ thống dự kiến</p>
              <p className="font-semibold text-emerald-600">{aggregating ? "..." : fmtVND(expected)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bạn đếm</p>
              <p className="font-semibold">{fmtVND(counted)}</p>
            </div>
          </div>

          <Tabs value={useDenominations ? "denom" : "manual"} onValueChange={(v) => setUseDenominations(v === "denom")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="denom">Đếm theo mệnh giá</TabsTrigger>
              <TabsTrigger value="manual">Nhập số tổng</TabsTrigger>
            </TabsList>
            <TabsContent value="denom" className="pt-3">
              <CashCountForm denominations={denominations} value={counts} onChange={setCounts} />
            </TabsContent>
            <TabsContent value="manual" className="pt-3">
              <div className="space-y-1">
                <Label>Tổng tiền mặt đếm được</Label>
                <Input
                  type="number"
                  min={0}
                  value={countedManual || ""}
                  onChange={(e) => setCountedManual(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className={`flex items-center gap-2 rounded-lg border p-3 ${difference === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700"}`}>
            {difference === 0 ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            <div className="flex-1 text-sm">
              {difference === 0 && "Khớp tiền — không có chênh lệch."}
              {difference > 0 && `Dư ${fmtVND(difference)} so với dự kiến.`}
              {difference < 0 && `Thiếu ${fmtVND(Math.abs(difference))} so với dự kiến.`}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Ghi chú đóng ca</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Lý do chênh lệch, bàn giao..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Huỷ</Button>
          <Button onClick={submit} disabled={saving || aggregating}>{saving ? "Đang đóng..." : "Đóng ca"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
