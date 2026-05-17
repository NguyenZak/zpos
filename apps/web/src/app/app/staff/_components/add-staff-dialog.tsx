"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck,
  Building
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

interface AddStaffDialogProps {
  onShowSuccess: () => void;
}

export function AddStaffDialog({ onShowSuccess }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    status: 'active',
    branch_id: '00000000-0000-0000-0000-000000000000' // Placeholder
  });

  useEffect(() => {
    if (open) {
      const fetchRoles = async () => {
        try {
          const list = await permissionService.getRoles();
          setRoles(list || []);
          
          // Set default selected role to Manager or Cashier if available, else standard fallback
          if (list && list.length > 0) {
            const hasStaff = list.some(r => r.name.toLowerCase() === 'staff');
            if (hasStaff) {
              setFormData(prev => ({ ...prev, role: 'staff' }));
            } else {
              setFormData(prev => ({ ...prev, role: list[0].name.toLowerCase() }));
            }
          }
        } catch (e) {
          console.error("Lỗi khi tải vai trò trong đối thoại:", e);
        }
      };
      fetchRoles();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create employee in standard system
      const employee = await posService.createEmployee(formData);
      
      // If we have dynamic custom roles, find matching role object and assign role_id
      const selectedRoleObj = roles.find(r => r.name.toLowerCase() === formData.role.toLowerCase());
      if (selectedRoleObj && employee && employee.id) {
        await permissionService.assignStaffRole(employee.id, selectedRoleObj.id);
      }

      toast.success("Đã thêm nhân viên mới thành công!");
      setOpen(false);
      onShowSuccess();
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        status: 'active',
        branch_id: '00000000-0000-0000-0000-000000000000'
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Lỗi khi thêm nhân viên: " + error.message);
    } finally {
      setLoading(false);
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Vai trò / Phân quyền</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map(r => (
                        <SelectItem key={r.id} value={r.name.toLowerCase()}>
                          {r.name} {r.is_system ? '(Hệ thống)' : '(Tùy chỉnh)'}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                        <SelectItem value="manager">Quản lý chi nhánh</SelectItem>
                        <SelectItem value="staff">Nhân viên bán hàng</SelectItem>
                        <SelectItem value="warehouse">Nhân viên kho</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch">Chi nhánh làm việc</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Chọn chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Chi nhánh mặc định</SelectItem>
                    <SelectItem value="hcm">Chi nhánh TP.HCM</SelectItem>
                    <SelectItem value="hn">Chi nhánh Hà Nội</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu nhân viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
