"use client";

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Loader2,
  User,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { posService } from '@/services/pos.service';
import { permissionService, Role } from '@/services/permission.service';

function generateInitialPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "!";
}

interface AddStaffDialogProps {
  onShowSuccess: () => void;
}

interface Branch {
  id: string;
  name: string;
  is_main_branch?: boolean;
  status?: string;
}

export function AddStaffDialog({ onShowSuccess }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'active',
    branch_id: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchMeta = async () => {
      setLoadingMeta(true);
      try {
        const [roleList, branchList] = await Promise.all([
          permissionService.getRoles(),
          posService.getBranches(),
        ]);

        const safeRoles = roleList || [];
        const safeBranches = (branchList || []) as Branch[];
        setRoles(safeRoles);
        setBranches(safeBranches);

        // Default role: prefer "staff" if present, otherwise first role
        const defaultRole = safeRoles.find(r => r.name.toLowerCase() === 'staff') || safeRoles[0];

        // Default branch: prefer main branch, otherwise first branch
        const defaultBranch =
          safeBranches.find(b => b.is_main_branch || b.status === 'Chính') || safeBranches[0];

        setFormData(prev => ({
          ...prev,
          role: defaultRole ? defaultRole.name.toLowerCase() : '',
          branch_id: defaultBranch ? defaultBranch.id : '',
          password: prev.password || generateInitialPassword(),
        }));
      } catch (e) {
        console.error("Lỗi khi tải dữ liệu vai trò / chi nhánh:", e);
        toast.error("Không thể tải vai trò hoặc chi nhánh từ máy chủ.");
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
      toast.error("Vui lòng chọn vai trò cho nhân viên.");
      return;
    }
    if (!formData.branch_id) {
      toast.error("Vui lòng chọn chi nhánh làm việc.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const selectedRoleObj = roles.find(r => r.name.toLowerCase() === formData.role.toLowerCase());
      const organizationId = await permissionService.getActiveOrgId();

      if (!organizationId || organizationId === "00000000-0000-0000-0000-000000000000") {
        throw new Error("Không xác định được tenant hiện tại. Vui lòng truy cập từ subdomain cửa hàng (vd: shop.zpos.click).");
      }

      const res = await fetch("/api/tenant/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          organizationId,
          role: formData.role,
          roleId: selectedRoleObj?.id || null,
          branchId: formData.branch_id || null,
          status: formData.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || "Không thể cấp tài khoản nhân viên.");
      }

      toast.success("Đã tạo tài khoản nhân viên!", {
        description: `Nhân viên có thể đăng nhập tại ${result.data?.loginUrl || "trang đăng nhập cửa hàng"} bằng email + mật khẩu vừa cấp.`,
      });
      setOpen(false);
      onShowSuccess();
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        branch_id: '',
        password: ''
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Lỗi khi thêm nhân viên: " + (error?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleRegeneratePassword = () => {
    const next = generateInitialPassword();
    setFormData(prev => ({ ...prev, password: next }));
  };

  const handleCopyPassword = async () => {
    if (!formData.password) return;
    try {
      await navigator.clipboard.writeText(formData.password);
      toast.success("Đã sao chép mật khẩu");
    } catch {
      toast.error("Trình duyệt không hỗ trợ sao chép");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Thêm nhân viên mới
            </DialogTitle>
            <DialogDescription>
              Thiết lập tài khoản và phân quyền cho nhân viên mới.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input 
                id="name" 
                placeholder="Ví dụ: Nguyễn Văn Nhân" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email công việc</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="nhanvien@zpos.click" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input 
                  id="phone" 
                  placeholder="09xx xxx xxx" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                  Mật khẩu khởi tạo
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary"
                    onClick={handleRegeneratePassword}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Sinh mật khẩu mới
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary"
                    onClick={handleCopyPassword}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-primary/5 border border-primary/10 rounded-md p-2">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Nhân viên sẽ đăng nhập bằng email và mật khẩu này tại trang đăng nhập của cửa hàng. Hãy gửi thông tin cho nhân viên qua kênh an toàn.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Vai trò / Phân quyền</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                  disabled={loadingMeta || roles.length === 0}
                >
                  <SelectTrigger id="role">
                    <SelectValue
                      placeholder={
                        loadingMeta
                          ? 'Đang tải vai trò...'
                          : roles.length === 0
                            ? 'Chưa có vai trò'
                            : 'Chọn vai trò'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.name.toLowerCase()}>
                        {r.name} {r.is_system ? '(Hệ thống)' : '(Tùy chỉnh)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch">Chi nhánh làm việc</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(val) => setFormData({ ...formData, branch_id: val })}
                  disabled={loadingMeta || branches.length === 0}
                >
                  <SelectTrigger id="branch">
                    <SelectValue
                      placeholder={
                        loadingMeta
                          ? 'Đang tải chi nhánh...'
                          : branches.length === 0
                            ? 'Chưa có chi nhánh'
                            : 'Chọn chi nhánh'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                        {(b.is_main_branch || b.status === 'Chính') ? ' (Chính)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || loadingMeta || !formData.role || !formData.branch_id}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu nhân viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
