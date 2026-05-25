"use client";

import { AlertTriangle, RotateCcw, Save, Search, ShieldCheck, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Permission } from "@/services/permission.service";

type PermissionMatrixProps = {
  permissions: Permission[];
  selected: string[];
  initialSelected: string[];
  search: string;
  locked?: boolean;
  saving?: boolean;
  onSearchChange: (value: string) => void;
  onSelectedChange: (next: string[]) => void;
  onSave: () => void;
  onReset: () => void;
};

const GROUP_DESCRIPTIONS: Record<string, string> = {
  "Tổng quan": "Bảng điều khiển kinh doanh, doanh số và doanh thu tổng quan.",
  "POS - Bán hàng": "Giao diện bán hàng tại quầy, chiết khấu, in bill, hủy đơn và hoàn tiền.",
  "Ca làm việc": "Mở/đóng ca làm việc, quản lý quỹ tiền mặt tại quầy và điều chỉnh chênh lệch.",
  "Sản phẩm": "Danh mục hàng hóa, barcode, giá bán và nhập/xuất dữ liệu sản phẩm.",
  "Danh mục": "Quản lý nhóm sản phẩm, danh mục hàng hóa.",
  "Tồn kho": "Tồn chi nhánh, nhập xuất, chuyển kho, điều chỉnh và kiểm kê.",
  "Đơn hàng": "Hóa đơn bán hàng, hoàn tiền, in hóa đơn và xuất dữ liệu đơn.",
  "Trả hàng": "Xử lý trả hàng từ khách hàng và hoàn tiền hàng trả.",
  "Khách hàng": "Quản lý thông tin khách hàng, lịch sử mua hàng và công nợ khách hàng.",
  "Nhà cung cấp": "Quản lý thông tin nhà cung cấp và công nợ với nhà cung cấp.",
  "Nhập hàng": "Tạo và duyệt đơn nhập hàng từ nhà cung cấp, nhận hàng vào kho.",
  "Tài chính": "Chi phí, dòng tiền, báo cáo lợi nhuận và quyền tài chính nhạy cảm.",
  "Công nợ": "Quản lý và ghi nhận công nợ, thu nợ, xóa nợ khó đòi.",
  "Hóa đơn điện tử": "Phát hành và cấu hình kết nối hóa đơn điện tử.",
  "Thanh toán VietQR": "Cấu hình tài khoản ngân hàng và đối soát giao dịch VietQR.",
  "Báo cáo": "Xem và xuất báo cáo bán hàng, kho, doanh thu và nhân viên.",
  "Nhân viên": "Tài khoản nhân sự, trạng thái làm việc và gán vai trò.",
  "Vai trò & Phân quyền": "Tạo vai trò, chỉnh ma trận quyền và bảo vệ Owner.",
  "Tích điểm & Loyalty": "Cấu hình tích điểm, đổi điểm thanh toán và hạng thành viên.",
  "Tin nhắn Zalo": "Gửi tin nhắn chăm sóc khách hàng qua Zalo OA.",
  "Trợ lý AI": "Trò chuyện với chatbot AI và sử dụng các tính năng thông minh bằng AI.",
  "Đồng bộ offline": "Xem trạng thái và kiểm soát đồng bộ dữ liệu ngoại tuyến.",
  "Cài đặt": "Thiết lập doanh nghiệp, chi nhánh, máy in, thanh toán và bảo mật.",
  "Nhật ký & Bảo mật": "Xem lịch sử hoạt động hệ thống và quản lý phiên đăng nhập.",
};

function describeGroup(group: string) {
  return GROUP_DESCRIPTIONS[group] || "Các quyền thao tác chi tiết cho module này.";
}

function includesPermission(permission: Permission, group: string, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [
    permission.name,
    permission.description,
    permission.id,
    permission.key,
    permission.module,
    permission.action,
    group,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function PermissionMatrix({
  permissions,
  selected,
  initialSelected,
  search,
  locked = false,
  saving = false,
  onSearchChange,
  onSelectedChange,
  onSave,
  onReset,
}: PermissionMatrixProps) {
  const selectedSet = new Set(selected);
  const initialSet = new Set(initialSelected);
  const allIds = permissions.map((permission) => permission.id);
  const changedOn = selected.filter((id) => !initialSet.has(id));
  const changedOff = initialSelected.filter((id) => !selectedSet.has(id));
  const changedCount = changedOn.length + changedOff.length;

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    const group = permission.group_name || permission.module || "Khác";
    if (!acc[group]) acc[group] = [];
    acc[group].push(permission);
    return acc;
  }, {});

  const setOne = (permissionId: string, checked: boolean) => {
    if (locked) return;
    onSelectedChange(
      checked ? Array.from(new Set([...selected, permissionId])) : selected.filter((id) => id !== permissionId),
    );
  };

  const setGroup = (groupPermissions: Permission[], checked: boolean) => {
    if (locked) return;
    const groupIds = groupPermissions.map((permission) => permission.id);
    onSelectedChange(
      checked ? Array.from(new Set([...selected, ...groupIds])) : selected.filter((id) => !groupIds.includes(id)),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Ma trận phân quyền chi tiết</h2>
          <p className="text-xs text-muted-foreground">
            Đã chọn{" "}
            <span className="font-semibold text-foreground">{locked ? permissions.length : selected.length}</span> /{" "}
            {permissions.length} quyền.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectedChange(allIds)}
            disabled={locked || permissions.length === 0}
          >
            Chọn tất cả quyền
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectedChange([])}
            disabled={locked || selected.length === 0}
          >
            Xóa tất cả
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={locked || changedCount === 0}>
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={locked || saving || changedCount === 0}>
            <Save className="mr-2 size-4" />
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm quyền theo tên, mô tả, module hoặc key..."
          className="h-10 pl-10"
        />
      </div>

      {changedCount > 0 && !locked && (
        <div className="rounded-xl border bg-muted/25 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            Thay đổi chờ lưu ({changedCount})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {changedOn.slice(0, 12).map((id) => (
              <Badge key={`on-${id}`} variant="secondary" className="gap-1 text-[10px]">
                + {id}
              </Badge>
            ))}
            {changedOff.slice(0, 12).map((id) => (
              <Badge key={`off-${id}`} variant="outline" className="gap-1 text-[10px] text-destructive">
                <X className="size-3" />
                {id}
              </Badge>
            ))}
            {changedCount > 24 && <Badge variant="outline">+{changedCount - 24} quyền khác</Badge>}
          </div>
        </div>
      )}

      {locked && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Owner có toàn quyền hệ thống. Các quyền này bị khóa và không thể chỉnh sửa.
        </div>
      )}

      <Accordion type="multiple" defaultValue={Object.keys(grouped).slice(0, 3)} className="gap-3">
        {Object.entries(grouped).map(([group, groupPermissions]) => {
          const visible = groupPermissions.filter((permission) => includesPermission(permission, group, search));
          if (visible.length === 0) return null;

          const groupIds = groupPermissions.map((permission) => permission.id);
          const checkedInGroup = locked ? groupIds.length : groupIds.filter((id) => selectedSet.has(id)).length;
          const allChecked = checkedInGroup === groupIds.length;

          return (
            <AccordionItem key={group} value={group} className="rounded-xl border bg-card px-4 shadow-xs">
              <AccordionTrigger className="hover:no-underline">
                <div className="mr-4 flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{group}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {checkedInGroup}/{groupIds.length}
                    </Badge>
                  </div>
                  <p className="text-xs font-normal leading-relaxed text-muted-foreground">{describeGroup(group)}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                    <Checkbox
                      checked={allChecked}
                      disabled={locked}
                      onCheckedChange={(checked) => setGroup(groupPermissions, Boolean(checked))}
                    />
                    Chọn tất cả trong nhóm
                  </label>
                  <span className="text-[11px] text-muted-foreground">{visible.length} quyền hiển thị</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {visible.map((permission) => {
                    const checked = locked || selectedSet.has(permission.id);
                    const sensitive = /nhạy cảm|delete|approve|payroll|profit|security|manage/i.test(
                      `${permission.id} ${permission.description}`,
                    );

                    return (
                      <label
                        key={permission.id}
                        className={`flex min-h-24 cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${checked ? "border-primary/25 bg-primary/5" : "border-muted bg-background"} ${locked ? "cursor-not-allowed opacity-80" : "hover:bg-muted/30"}`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={locked}
                          onCheckedChange={(value) => setOne(permission.id, Boolean(value))}
                          className="mt-1"
                        />
                        <span className="grid gap-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                            {permission.name}
                            {sensitive && (
                              <Badge className="bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-700 hover:bg-amber-500/10">
                                Nhạy cảm
                              </Badge>
                            )}
                          </span>
                          <span className="text-xs leading-relaxed text-muted-foreground">
                            {permission.description}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            {permission.key || permission.id}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
