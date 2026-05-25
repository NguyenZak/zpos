"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  RefreshCw,
  Wallet,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  Lock,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { shiftService, type Shift, type ShiftAssignment, type ShiftStatus } from "@/services/shift.service";
import { posService } from "@/services/pos.service";
import { usePermissions } from "@/hooks/use-permissions";
import { ShiftStatusBadge } from "./_components/shift-status-badge";
import { OpenShiftDialog } from "./_components/open-shift-dialog";
import { fmtVND, fmtDate, fmtDuration } from "./_components/format";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ShiftsListPage() {
  const { hasPermission, loading: permLoading } = usePermissions();
  const canView = hasPermission("shifts.view");
  const canOpen = hasPermission("shifts.open");
  const canSchedule = hasPermission("shifts.adjust") || hasPermission("staff.update");

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | "all">("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    employee_id: "",
    branch_id: "",
    title: "Ca bán hàng",
    work_date: todayISO(),
    start_time: "08:00",
    end_time: "17:00",
    break_minutes: 60,
    note: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [list, mine, roster, staff, branchList] = await Promise.all([
        shiftService.listShifts({ limit: 100 }),
        shiftService.getActiveShift(),
        shiftService.listShiftAssignments({ from: todayISO() }),
        posService.getEmployees().catch(() => []),
        posService.getBranches().catch(() => []),
      ]);
      setShifts(list);
      setActiveShift(mine);
      setAssignments(roster);
      setEmployees(staff || []);
      setBranches(branchList || []);
      setAssignmentForm((prev) => ({
        ...prev,
        employee_id: prev.employee_id || staff?.[0]?.id || "",
        branch_id: prev.branch_id || branchList?.[0]?.id || "",
      }));
    } catch (e: any) {
      toast.error(e?.message || "Không tải được danh sách ca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permLoading) load();
  }, [permLoading]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return shifts;
    return shifts.filter((s) => s.status === statusFilter);
  }, [shifts, statusFilter]);

  const stats = useMemo(() => {
    let cash = 0,
      diff = 0,
      openCount = 0,
      hasDifference = 0,
      sales = 0;
    for (const s of shifts) {
      sales += Number(s.total_sales_amount || 0);
      cash += Number(s.cash_sales_amount || 0);
      diff += Number(s.cash_difference || 0);
      if (s.status === "open") openCount += 1;
      if (Math.abs(Number(s.cash_difference || 0)) > 0 && s.status !== "open") hasDifference += 1;
    }
    return { cash, diff, openCount, hasDifference, sales };
  }, [shifts]);

  const saveAssignment = async () => {
    if (!assignmentForm.employee_id) {
      toast.error("Vui lòng chọn nhân viên");
      return;
    }
    if (!assignmentForm.work_date || !assignmentForm.start_time || !assignmentForm.end_time) {
      toast.error("Vui lòng nhập ngày và giờ làm việc");
      return;
    }
    if (assignmentForm.end_time <= assignmentForm.start_time) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setSavingAssignment(true);
    try {
      await shiftService.createShiftAssignment({
        ...assignmentForm,
        break_minutes: Number(assignmentForm.break_minutes || 0),
      });
      toast.success("Đã phân ca làm việc");
      setAssignmentForm((prev) => ({ ...prev, note: "" }));
      const roster = await shiftService.listShiftAssignments({ from: todayISO() });
      setAssignments(roster);
    } catch (e: any) {
      toast.error(e?.message || "Không lưu được phân ca");
    } finally {
      setSavingAssignment(false);
    }
  };

  const updateAssignmentStatus = async (id: string, status: "confirmed" | "cancelled") => {
    await shiftService.updateShiftAssignmentStatus(id, status);
    setAssignments(await shiftService.listShiftAssignments({ from: todayISO() }));
  };

  if (!permLoading && !canView) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Bạn không có quyền truy cập</h2>
        <p className="text-sm text-muted-foreground">
          Cần quyền <code>shifts.view</code> để xem ca làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl tracking-tight">Quản lý ca làm việc</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tiền mặt đầu/cuối ca, đối soát doanh thu và duyệt ca.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shifts/reports">
              <BarChart3 className="size-4" /> Báo cáo
            </Link>
          </Button>
          {canOpen && !activeShift && (
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="size-4" /> Mở ca mới
            </Button>
          )}
        </div>
      </div>

      {activeShift && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-5 text-emerald-700" /> Ca của bạn đang mở
                </CardTitle>
                <CardDescription>
                  Mở lúc {fmtDate(activeShift.opened_at)} · Thời lượng {fmtDuration(activeShift.opened_at)} · Tiền đầu
                  ca {fmtVND(activeShift.opening_cash_amount)}
                </CardDescription>
              </div>
              <Button asChild>
                <Link href={`/shifts/${activeShift.id}`}>
                  Mở chi tiết <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tổng ca</p>
            <p className="mt-1 text-2xl font-semibold">{shifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Đang mở</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Doanh thu</p>
            <p className="mt-1 text-xl font-semibold">{fmtVND(stats.sales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tiền mặt</p>
            <p className="mt-1 text-xl font-semibold">{fmtVND(stats.cash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Chênh lệch</p>
            <p
              className={`mt-1 text-xl font-semibold ${stats.diff === 0 ? "" : stats.diff > 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {fmtVND(stats.diff)}
            </p>
            {stats.hasDifference > 0 && (
              <p className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="size-3" /> {stats.hasDifference} ca lệch
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Lịch sử ca</TabsTrigger>
              <TabsTrigger value="roster">Phân ca</TabsTrigger>
            </TabsList>
            <TabsContent value="roster" className="pt-4">
              <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                <Card className="border-muted shadow-xs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarDays className="size-4" />
                      Nhập từng ca làm việc
                    </CardTitle>
                    <CardDescription>Chọn nhân viên và nhập khung giờ cho ca dự kiến.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label>Nhân viên</Label>
                      <Select
                        value={assignmentForm.employee_id}
                        onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, employee_id: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn nhân viên" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name || employee.email || employee.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Chi nhánh</Label>
                      <Select
                        value={assignmentForm.branch_id || "__none__"}
                        onValueChange={(value) =>
                          setAssignmentForm((prev) => ({ ...prev, branch_id: value === "__none__" ? "" : value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chi nhánh" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Không gán chi nhánh</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Tên ca / vị trí</Label>
                      <Input
                        value={assignmentForm.title}
                        onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Ca bán hàng, Ca kho..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="grid gap-1.5">
                        <Label>Ngày</Label>
                        <Input
                          type="date"
                          value={assignmentForm.work_date}
                          onChange={(event) =>
                            setAssignmentForm((prev) => ({ ...prev, work_date: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Bắt đầu</Label>
                        <Input
                          type="time"
                          value={assignmentForm.start_time}
                          onChange={(event) =>
                            setAssignmentForm((prev) => ({ ...prev, start_time: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Kết thúc</Label>
                        <Input
                          type="time"
                          value={assignmentForm.end_time}
                          onChange={(event) => setAssignmentForm((prev) => ({ ...prev, end_time: event.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Nghỉ giữa ca (phút)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={assignmentForm.break_minutes}
                        onChange={(event) =>
                          setAssignmentForm((prev) => ({ ...prev, break_minutes: Number(event.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Ghi chú</Label>
                      <Textarea
                        value={assignmentForm.note}
                        onChange={(event) => setAssignmentForm((prev) => ({ ...prev, note: event.target.value }))}
                        placeholder="Khu vực làm việc, bàn giao, yêu cầu riêng..."
                      />
                    </div>
                    <Button
                      onClick={saveAssignment}
                      disabled={!canSchedule || savingAssignment || employees.length === 0}
                    >
                      <Plus className="size-4" />
                      Lưu phân ca
                    </Button>
                    {!canSchedule && (
                      <p className="text-xs text-muted-foreground">Cần quyền quản lý ca hoặc nhân viên để phân ca.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead>Ca</TableHead>
                        <TableHead>Chi nhánh</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                            Chưa có lịch phân ca.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignments.map((assignment) => {
                          const employee =
                            assignment.employee || employees.find((item) => item.id === assignment.employee_id);
                          const branch = assignment.branch || branches.find((item) => item.id === assignment.branch_id);
                          return (
                            <TableRow key={assignment.id}>
                              <TableCell className="font-medium">{assignment.work_date}</TableCell>
                              <TableCell>{employee?.name || employee?.email || assignment.employee_id}</TableCell>
                              <TableCell>
                                <div className="font-medium">{assignment.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {assignment.start_time} - {assignment.end_time} · nghỉ {assignment.break_minutes || 0}{" "}
                                  phút
                                </div>
                              </TableCell>
                              <TableCell>{branch?.name || "—"}</TableCell>
                              <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                                {assignment.note || "—"}
                              </TableCell>
                              <TableCell>
                                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                                  {assignment.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={!canSchedule || assignment.status === "confirmed"}
                                    onClick={() => updateAssignmentStatus(assignment.id, "confirmed")}
                                  >
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={!canSchedule || assignment.status === "cancelled"}
                                    onClick={() => updateAssignmentStatus(assignment.id, "cancelled")}
                                  >
                                    <XCircle className="size-4 text-rose-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="open">Đang mở</TabsTrigger>
                  <TabsTrigger value="closed">Đã đóng</TabsTrigger>
                  <TabsTrigger value="reviewed">Đã duyệt</TabsTrigger>
                  <TabsTrigger value="cancelled">Đã huỷ</TabsTrigger>
                </TabsList>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có ca nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã ca</TableHead>
                    <TableHead>Thu ngân</TableHead>
                    <TableHead>Chi nhánh / Máy</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Mở lúc</TableHead>
                    <TableHead>Thời lượng</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">Chênh lệch</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const diff = Number(s.cash_difference || 0);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id.slice(0, 8)}</TableCell>
                        <TableCell>{s.cashier?.full_name || s.cashier?.email || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {s.branch?.name || "—"}
                          {s.cash_register?.name && (
                            <span className="text-muted-foreground"> · {s.cash_register.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ShiftStatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(s.opened_at)}</TableCell>
                        <TableCell className="text-xs">{fmtDuration(s.opened_at, s.closed_at)}</TableCell>
                        <TableCell className="text-right font-medium">{fmtVND(s.total_sales_amount)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${diff === 0 ? "" : diff > 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {s.status === "open" ? "—" : fmtVND(diff)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/shifts/${s.id}`}>
                              <ChevronRight className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OpenShiftDialog open={openDialog} onOpenChange={setOpenDialog} onOpened={() => load()} />
    </div>
  );
}
