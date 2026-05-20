"use client";

import { useEffect, useMemo, useState } from "react";

import { Banknote, Building2, CheckCircle2, Monitor, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { posService } from "@/services/pos.service";
import { type CashRegister, type Shift, shiftService } from "@/services/shift.service";

import { fmtVND } from "./format";

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultBranchId?: string;
  defaultRegisterId?: string;
  onOpened?: (shift: Shift) => void;
}

const QUICK_AMOUNTS = [0, 500000, 1000000, 2000000];

function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function formatCurrencyInput(value: number) {
  if (!value) return "";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function OpenShiftDialog({
  open,
  onOpenChange,
  defaultBranchId,
  defaultRegisterId,
  onOpened,
}: OpenShiftDialogProps) {
  const [branches, setBranches] = useState<
    Array<{ id: string; name: string; is_main_branch?: boolean; status?: string }>
  >([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [branchId, setBranchId] = useState<string>(defaultBranchId ?? "");
  const [registerId, setRegisterId] = useState<string>(defaultRegisterId ?? "");
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingRegisters, setLoadingRegisters] = useState(false);

  const selectedBranch = useMemo(() => branches.find((branch) => branch.id === branchId), [branches, branchId]);
  const selectedRegister = useMemo(
    () => registers.find((register) => register.id === registerId),
    [registers, registerId],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setLoadingBranches(true);
      try {
        const list = await posService.getBranches();
        if (cancelled) return;
        const safe = (list ?? []) as Array<{ id: string; name: string; is_main_branch?: boolean; status?: string }>;
        setBranches(safe);
        setBranchId((prev) => {
          if (prev) return prev;
          const main = safe.find((b) => b.is_main_branch || b.status === "Chính");
          return main?.id ?? safe[0]?.id ?? "";
        });
      } catch (e) {
        console.error("Không tải được chi nhánh:", e);
        toast.error("Không tải được danh sách chi nhánh");
      } finally {
        if (!cancelled) setLoadingBranches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!branchId) {
      setRegisters([]);
      return;
    }
    let cancelled = false;
    setLoadingRegisters(true);
    shiftService
      .getRegisters(branchId)
      .then((rs) => {
        if (cancelled) return;
        setRegisters(rs);
        setRegisterId((prev) => {
          if (prev && rs.some((r) => r.id === prev)) return prev;
          return rs[0]?.id || "";
        });
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("Không tải được máy thu ngân:", e);
        toast.error("Không tải được danh sách máy thu ngân");
      })
      .finally(() => {
        if (!cancelled) setLoadingRegisters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  const submit = async () => {
    if (!branchId) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }
    setSaving(true);
    try {
      const res = await shiftService.openShift({
        branch_id: branchId,
        cash_register_id: registerId || null,
        opening_cash_amount: openingCash,
        note,
      });
      if (!res.ok) {
        toast.error(res.error === "shift_already_open" ? "Bạn đã có ca đang mở" : res.error || "Không thể mở ca");
        return;
      }
      toast.success("Đã mở ca làm việc");
      onOpenChange(false);
      if (res.shift?.branch_id) setBranchId(res.shift.branch_id);
      if (res.shift && onOpened) onOpened(res.shift);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[120] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-muted/40 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Wallet className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-xl leading-7">Mở ca làm việc</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-5">
                Chọn điểm bán, nhập tiền mặt trong két và bắt đầu phiên bán hàng.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_240px] sm:px-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  Chi nhánh
                </Label>
                <Select
                  value={branchId}
                  onValueChange={setBranchId}
                  disabled={loadingBranches || branches.length === 0}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-background px-3">
                    <SelectValue
                      placeholder={
                        loadingBranches
                          ? "Đang tải chi nhánh..."
                          : branches.length === 0
                            ? "Chưa có chi nhánh"
                            : "Chọn chi nhánh"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                        {b.is_main_branch || b.status === "Chính" ? " (Chính)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold text-sm">
                  <Monitor className="size-4 text-muted-foreground" />
                  Máy thu ngân
                  <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
                </Label>
                <Select
                  value={registerId || "__none__"}
                  onValueChange={(v) => setRegisterId(v === "__none__" ? "" : v)}
                  disabled={loadingRegisters || !branchId}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-background px-3">
                    <SelectValue
                      placeholder={
                        loadingRegisters
                          ? "Đang tải máy thu ngân..."
                          : !branchId
                            ? "Chọn chi nhánh trước"
                            : registers.length === 0
                              ? "Chưa có máy thu ngân"
                              : "Chọn máy thu ngân"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không gán máy</SelectItem>
                    {registers.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.code ? ` (${r.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold text-sm">
                <Banknote className="size-4 text-muted-foreground" />
                Tiền mặt đầu ca
              </Label>
              <div className="relative">
                <Input
                  inputMode="numeric"
                  value={formatCurrencyInput(openingCash)}
                  onChange={(e) => setOpeningCash(parseCurrencyInput(e.target.value))}
                  placeholder="0"
                  className="h-14 rounded-2xl bg-background pr-12 pl-4 font-semibold text-2xl tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-medium text-muted-foreground text-sm">
                  đ
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={openingCash === amount ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-xl"
                    onClick={() => setOpeningCash(amount)}
                  >
                    {amount === 0 ? "0 đ" : fmtVND(amount)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-sm">Ghi chú</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="min-h-24 resize-none rounded-2xl bg-background p-3"
                placeholder="Ví dụ: ca sáng, két 1..."
              />
            </div>
          </div>

          <div className="rounded-3xl bg-muted/60 p-4">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Tóm tắt ca
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Chi nhánh</dt>
                <dd className="mt-1 font-medium">{selectedBranch?.name || "Chưa chọn"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Máy thu ngân</dt>
                <dd className="mt-1 font-medium">{selectedRegister?.name || "Không gán"}</dd>
              </div>
              <div className="rounded-2xl bg-background p-3">
                <dt className="text-muted-foreground">Tiền trong két</dt>
                <dd className="mt-1 font-semibold text-2xl tabular-nums">{fmtVND(openingCash)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <DialogFooter className="m-0 rounded-none px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            className="h-10 rounded-xl px-4"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Huỷ
          </Button>
          <Button className="h-10 rounded-xl px-5" onClick={submit} disabled={saving || loadingBranches || !branchId}>
            {saving ? "Đang mở..." : "Mở ca"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
