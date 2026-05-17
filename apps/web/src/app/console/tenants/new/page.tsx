"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function NewTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    subscription_plan: "basic",
    subscription_status: "active",
    owner_email: "",
    owner_password: "",
    owner_name: "",
  });

  const handleCreate = async () => {
    if (!newTenant.name || !newTenant.slug) {
      toast.error("Vui lòng điền đầy đủ tên và đường dẫn subdomain!");
      return;
    }

    if (!newTenant.owner_name || !newTenant.owner_email || !newTenant.owner_password) {
      toast.error("Vui lòng điền đầy đủ thông tin Tài khoản chủ sở hữu để truy cập App Tenant!");
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newTenant.slug)) {
      toast.error("Đường dẫn subdomain chỉ được chứa chữ thường không dấu, số và dấu gạch ngang (-)!");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Create Organization
      const { data, error } = await supabase
        .from("organizations")
        .insert([
          {
            name: newTenant.name,
            slug: newTenant.slug,
            subscription_plan: newTenant.subscription_plan,
            subscription_status: newTenant.subscription_status,
          },
        ])
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Subdomain này đã tồn tại trên hệ thống. Vui lòng chọn subdomain khác.");
        }
        throw error;
      }

      if (data && data[0]) {
        const orgId = data[0].id;

        // If owner account details are provided, sign them up
        if (newTenant.owner_email && newTenant.owner_password) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: newTenant.owner_email,
            password: newTenant.owner_password,
            options: {
              data: {
                full_name: newTenant.owner_name || "Chủ doanh nghiệp",
                organization_id: orgId,
                role: "tenant_owner",
              }
            }
          });

          if (authError) {
            console.error("Supabase Auth sign up error:", authError.message);
          } else if (authData.user) {
            // Create user profile
            const { error: profileError } = await supabase
              .from("profiles")
              .upsert({
                id: authData.user.id,
                full_name: newTenant.owner_name || "Chủ doanh nghiệp",
                email: newTenant.owner_email,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newTenant.owner_name || 'Owner')}`,
              });

            if (profileError) console.error("Profile creation error:", profileError.message);

            // Create organization member
            try {
              const { error: memberError } = await supabase
                .from("organization_members")
                .insert({
                  organization_id: orgId,
                  profile_id: authData.user.id,
                  role: "owner",
                });
              if (memberError) console.error("Member creation error:", memberError.message);
            } catch (memberErr: any) {
              console.warn("Could not insert member record:", memberErr.message);
            }
          }
        }

        toast.success("Tạo doanh nghiệp mới thành công!", {
          description: `Subdomain: ${newTenant.slug}.localhost:3000 đã hoạt động và dữ liệu đã được lưu vào DB.`,
        });

        // Redirect back to console dashboard (root of console subdomain)
        router.push("/console");
      }
    } catch (e: any) {
      console.error("Lỗi khi lưu vào DB:", e.message);
      toast.error("Không thể lưu vào Database!", {
        description: e.message || "Bảng 'organizations' hoặc 'profiles' chưa được tạo trên Supabase.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-slate-900">
      {/* 🔮 Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/console")}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Trở lại Console
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
              ZPOS Core
            </span>
            <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
              PROVISIONING
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-teal-400" />
            Khởi Tạo Doanh Nghiệp Mới
          </h1>
          <p className="text-slate-400 mt-2">
            Hệ thống sẽ cấp phát tài nguyên, tạo subdomain riêng và cấu hình thông tin định danh ban đầu cho khách hàng.
          </p>
        </div>

        <div className="space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          
          {/* Tenant Info */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="h-5 w-5 text-teal-500" />
              Thông tin định danh
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Tên doanh nghiệp / Cửa hàng</label>
                <Input
                  placeholder="Ví dụ: Siêu thị Điện máy Chợ Lớn"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-200 h-11"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Đường dẫn subdomain thương hiệu</label>
                <div className="flex items-center">
                  <Input
                    placeholder="dienmaycholon"
                    value={newTenant.slug}
                    onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase() })}
                    className="bg-slate-950 border-slate-800 text-slate-200 rounded-r-none border-r-0 h-11"
                  />
                  <span className="bg-slate-800 border border-slate-800 text-slate-400 text-sm font-mono px-4 h-11 flex items-center rounded-r-md">
                    .zpos.vn
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Chỉ chứa ký tự thường không dấu, số và gạch ngang (-)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Gói dịch vụ đăng ký</label>
                  <Select
                    value={newTenant.subscription_plan}
                    onValueChange={(val) => setNewTenant({ ...newTenant, subscription_plan: val })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-11">
                      <SelectValue placeholder="Chọn gói cước" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectItem value="free">Free (Miễn phí)</SelectItem>
                      <SelectItem value="basic">Basic (Khởi nghiệp)</SelectItem>
                      <SelectItem value="pro">Pro (Chuyên nghiệp)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Chuỗi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Trạng thái kích hoạt</label>
                  <Select
                    value={newTenant.subscription_status}
                    onValueChange={(val) => setNewTenant({ ...newTenant, subscription_status: val })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-11">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectItem value="active">Hoạt động (Active)</SelectItem>
                      <SelectItem value="past_due">Quá hạn thanh toán</SelectItem>
                      <SelectItem value="suspended">Tạm khóa (Suspended)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Owner Info */}
          <section className="space-y-6 pt-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="h-5 w-5 text-teal-500" />
              Tài khoản chủ sở hữu (Owner)
              <span className="text-xs font-normal text-rose-400 ml-2 tracking-wide">*Bắt buộc để đăng nhập</span>
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Họ và tên chủ sở hữu <span className="text-rose-500">*</span></label>
                <Input
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newTenant.owner_name}
                  onChange={(e) => setNewTenant({ ...newTenant, owner_name: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-200 h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Email đăng nhập <span className="text-rose-500">*</span></label>
                  <Input
                    type="email"
                    placeholder="owner@zpos.vn"
                    value={newTenant.owner_email}
                    onChange={(e) => setNewTenant({ ...newTenant, owner_email: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-200 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Mật khẩu ban đầu <span className="text-rose-500">*</span></label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newTenant.owner_password}
                    onChange={(e) => setNewTenant({ ...newTenant, owner_password: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-slate-200 h-11"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/console")}
              className="text-slate-400 hover:text-white"
            >
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting}
              className="bg-teal-500 text-slate-950 hover:bg-teal-400 font-bold px-8 h-11 text-base shadow-lg shadow-teal-500/20"
            >
              {isSubmitting ? "Đang xử lý..." : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Khởi tạo tài nguyên
                </>
              )}
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
