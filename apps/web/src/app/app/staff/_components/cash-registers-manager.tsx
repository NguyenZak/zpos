"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, MonitorCog, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { shiftService, type CashRegister } from "@/services/shift.service";
import { posService } from "@/services/pos.service";

const STATUS_META: Record<CashRegister["status"], { label: string; className: string }> = {
  active: { label: "Hoạt động", className: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Tạm tắt", className: "bg-slate-100 text-slate-700" },
  maintenance: { label: "Bảo trì", className: "bg-amber-100 text-amber-700" },
};

export function CashRegistersManager() {
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [filterBranchId, setFilterBranchId] = useState<string>("");
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CashRegister | null>(null);
  const [form, setForm] = useState<{ branch_id: string; name: string; code: string; status: CashRegister["status"] }>({
    branch_id: "",
    name: "",
    code: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadBranches = async () => {
    try {
      const list = await posService.getBranches();
      const mapped = (list || []).map((b: any) => ({ id: b.id, name: b.name }));
      setBranches(mapped);
      setFilterBranchId((prev) => prev || (mapped[0]?.id ?? ""));
    } catch {
      setBranches([]);
    }
  };

  const loadRegisters = async (branchId?: string) => {
    setLoading(true);
    try {
      const list = await shiftService.getRegisters(branchId || undefined);
      setRegisters(list);
    } finally {
      setLoading(false);
    }
  };

  // Initial: load branches + all registers in parallel so the table never
  // gets stuck on "Đang tải..." even if branches haven't resolved yet.
  useEffect(() => {
    loadBranches();
    loadRegisters();
  }, []);

  // Re-filter registers when the chosen branch changes
  useEffect(() => {
    if (filterBranchId) loadRegisters(filterBranchId);
  }, [filterBranchId]);

  const openCreate = () => {
    if (branches.length === 0) {
      toast.error("Chưa có chi nhánh nào", {
        description: "Vào Cài đặt > Chi nhánh để tạo chi nhánh trước khi thêm máy thu ngân.",
        duration: 7000,
      });
      return;
    }
    setEditing(null);
    setForm({ branch_id: filterBranchId || (branches[0]?.id ?? ""), name: "", code: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (r: CashRegister) => {
    setEditing(r);
    setForm({ branch_id: r.branch_id, name: r.name, code: r.code || "", status: r.status });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên máy thu ngân");
      return;
    }
    if (!form.branch_id) {
      toast.error("Vui lòng chọn chi nhánh");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await shiftService.updateRegister(editing.id, {
          branch_id: form.branch_id,
          name: form.name.trim(),
          code: form.code.trim() || null,
          status: form.status,
        });
        toast.success("Đã cập nhật máy thu ngân");
      } else {
        await shiftService.createRegister({
          branch_id: form.branch_id,
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          status: form.status,
        });
        toast.success("Đã thêm máy thu ngân mới");
      }
      setDialogOpen(false);
      // Switch the filter to the branch we just saved into so the new row is
      // visible (the filter would otherwise hide rows from other branches).
      // Then reload — useEffect on filterBranchId handles the refetch when the
      // selected branch changes; force a manual reload for the same-branch case.
      if (filterBranchId === form.branch_id) {
        loadRegisters(form.branch_id);
      } else {
        setFilterBranchId(form.branch_id);
      }
    } catch (e: any) {
      toast.error(e?.message || "Có lỗi xảy ra", { duration: 7000 });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await shiftService.deleteRegister(deleteId);
      toast.success("Đã xoá máy thu ngân");
      setDeleteId(null);
      loadRegisters();
    } catch (e: any) {
      toast.error(e?.message || "Không thể xoá");
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><MonitorCog className="size-5 text-primary" /> Máy thu ngân</CardTitle>
              <CardDescription>Quản lý quầy thu ngân theo chi nhánh. Mỗi máy có thể mở ca riêng để theo dõi tiền.</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Chi nhánh</Label>
                <Select value={filterBranchId} onValueChange={setFilterBranchId}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Chọn chi nhánh" /></SelectTrigger>
                  <SelectContent>
                    {branches.length === 0 && <SelectItem value="__none__" disabled>Chưa có chi nhánh</SelectItem>}
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreate}>
                <Plus className="size-4" /> Thêm máy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-xs">Tên máy</TableHead>
                <TableHead className="font-semibold text-xs">Mã</TableHead>
                <TableHead className="font-semibold text-xs">Chi nhánh</TableHead>
                <TableHead className="font-semibold text-xs">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold text-xs">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Đang tải...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : registers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                      <Store className="size-8" />
                      <span className="text-sm">Chưa có máy thu ngân nào ở chi nhánh này.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                registers.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.active;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.code || "—"}</TableCell>
                      <TableCell className="text-sm">{r.branch?.name || branches.find((b) => b.id === r.branch_id)?.name || "—"}</TableCell>
                      <TableCell><Badge className={meta.className} variant="secondary">{meta.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit2 className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="size-4 text-rose-600" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa máy thu ngân" : "Thêm máy thu ngân"}</DialogTitle>
            <DialogDescription>Máy thu ngân thuộc về 1 chi nhánh và là điểm mở ca cho thu ngân đứng quầy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Chi nhánh</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn chi nhánh" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tên máy</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Quầy 1" />
            </div>
            <div className="space-y-1">
              <Label>Mã (tuỳ chọn)</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CR-01" />
            </div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CashRegister["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm tắt</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Huỷ</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá máy thu ngân?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Các ca đã đóng vẫn được giữ trong lịch sử nhưng tham chiếu máy sẽ bị xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
