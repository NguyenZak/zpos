"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  ShoppingCart, 
  ClipboardList, 
  Package, 
  Menu,
  Settings,
  Users,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Laptop,
  Store,
  ChevronRight,
  TrendingUp,
  MapPin,
  Bot,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { persistPreference } from "@/lib/preferences/preferences-storage";
import { getTenantSlug } from "@/services/pos.service";
import { clearAllSessions } from "@/utils/clear-session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Dynamic route prefix detection for multi-tenant subdomains vs local path-based routing
  const prefix = pathname.startsWith("/app") ? "/app" : "";

  // Help map active routes
  const tabs = [
    {
      label: "Trang chủ",
      icon: Home,
      route: `${prefix}/dashboard`,
      isActive: pathname.includes("/dashboard"),
    },
    {
      label: "Bán hàng",
      icon: ShoppingCart,
      route: `${prefix}/pos`,
      isActive: pathname.includes("/pos"),
    },
    {
      label: "Đơn hàng",
      icon: ClipboardList,
      route: `${prefix}/orders`,
      isActive: pathname.includes("/orders"),
    },
    {
      label: "Kho hàng",
      icon: Package,
      route: `${prefix}/inventory`,
      isActive: pathname.includes("/inventory"),
    },
  ];


  const handleTabClick = (route: string) => {
    router.push(route);
  };

  const handleLogout = async () => {
    try {
      await clearAllSessions();
      toast.success("Đã đăng xuất khỏi hệ thống!");
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportTitle, setSupportTitle] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportCategory, setSupportCategory] = useState("Lỗi phần mềm");
  const [supportPriority, setSupportPriority] = useState("Trung bình");
  const [supportContactPhone, setSupportContactPhone] = useState("");

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTitle.trim() || !supportDescription.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung yêu cầu!");
      return;
    }

    setSupportLoading(true);
    try {
      const tenantSlug = getTenantSlug();
      const tenantName = tenantSlug === "app" 
        ? "Zpos Main System" 
        : tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) + " Store";

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantName,
          tenantSlug,
          title: supportTitle,
          description: supportDescription,
          category: supportCategory,
          priority: supportPriority,
          contactPhone: supportContactPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Gửi yêu cầu hỗ trợ thành công! Đội ngũ ZPOS sẽ liên hệ bạn sớm nhất.");
        setSupportOpen(false);
        setDrawerOpen(false); // Close main drawer
        // Reset form
        setSupportTitle("");
        setSupportDescription("");
        setSupportCategory("Lỗi phần mềm");
        setSupportPriority("Trung bình");
        setSupportContactPhone("");
      } else {
        toast.error(data.error || "Gửi yêu cầu thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!");
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t h-16 flex items-center justify-around px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.2)] md:hidden", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            onClick={() => handleTabClick(tab.route)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-muted-foreground transition-all active:scale-95",
              tab.isActive && "text-primary font-semibold"
            )}
            style={{ minHeight: "48px" }} // Large touch target
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-300",
              tab.isActive ? "bg-primary/10 text-primary scale-110" : "hover:text-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide leading-none">{tab.label}</span>
          </button>
        );
      })}

      {/* "More" Drawer Button */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-muted-foreground transition-all active:scale-95",
              drawerOpen && "text-primary"
            )}
            style={{ minHeight: "48px" }}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-300",
              drawerOpen ? "bg-primary/10 text-primary scale-110" : "hover:text-foreground"
            )}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide leading-none">Thêm</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="pb-8 max-h-[85vh] bg-background">
          <DrawerHeader className="text-left border-b pb-4 px-6">
            <div className="flex items-center gap-3.5 mt-2">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" />
                <AvatarFallback>ZM</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-base font-bold truncate">ZPOS Retail Merchant</DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span>Chi nhánh Quận 1, TP.HCM</span>
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Drawer Menu Items */}
          <div className="px-5 py-4 overflow-y-auto space-y-5">
            {/* Quick Stats Panel */}
            <div className="bg-muted/40 rounded-lg p-4 flex justify-between items-center border border-muted/50">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Doanh thu hôm nay</p>
                <p className="text-xl font-black text-primary">5,400,000 ₫</p>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 flex items-center gap-1 text-xs font-bold">
                <TrendingUp className="w-4 h-4" />
                +15.2%
              </div>
            </div>

            {/* Menu Group: Operations */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest px-3 mb-2">QUẢN LÝ VẬN HÀNH</p>
              
              {/* Temporarily hidden AI Assistant button on mobile */}
              {/* 
              <button 
                onClick={() => { setDrawerOpen(false); router.push("/app/ai"); }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group active:bg-muted"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Trợ lý ảo AI Assistant</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              */}

              <button 
                onClick={() => { setDrawerOpen(false); router.push(`${prefix}/customers`); }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group active:bg-muted"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Khách hàng (CRM)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button 
                onClick={() => { setDrawerOpen(false); router.push(`${prefix}/settings`); }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group active:bg-muted"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Cấu hình hệ thống</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Menu Group: Theme Selector */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest px-3 mb-1">GIAO DIỆN</p>
              <div className="grid grid-cols-3 gap-2 px-1">
                {[
                  { value: "light", icon: Sun, label: "Sáng" },
                  { value: "dark", icon: Moon, label: "Tối" },
                  { value: "system", icon: Laptop, label: "Hệ thống" },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = themeMode === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => {
                        setThemeMode(item.value as any);
                        void persistPreference("theme_mode", item.value as any);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95 cursor-pointer",
                        isActive 
                          ? "bg-primary/5 border-primary text-primary font-bold" 
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <ItemIcon className="w-4 h-4" />
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Support and Sign Out */}
            <div className="space-y-1.5 border-t pt-4">
              <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
                <DialogTrigger asChild>
                  <button 
                    className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left active:bg-muted cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Hỗ trợ & Liên hệ kỹ thuật</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[92vw] max-w-[450px] rounded-2xl p-5 gap-4">
                  <DialogHeader className="space-y-1">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                      <HelpCircle className="w-5 h-5 text-sky-500 animate-pulse" />
                      Yêu Cầu Hỗ Trợ Kỹ Thuật
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Gửi yêu cầu trực tiếp về hệ thống quản trị. Đội ngũ kỹ thuật viên của ZPOS sẽ phản hồi bạn qua số điện thoại sớm nhất.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSupportSubmit} className="space-y-3.5 py-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="support-category" className="text-[10px] font-bold text-muted-foreground uppercase">Loại yêu cầu</Label>
                        <NativeSelect
                          id="support-category"
                          value={supportCategory}
                          onChange={(e) => setSupportCategory(e.target.value)}
                          className="text-xs cursor-pointer h-9"
                        >
                          <option value="Lỗi phần mềm">🐞 Lỗi phần mềm</option>
                          <option value="Yêu cầu tính năng">✨ Yêu cầu tính năng</option>
                          <option value="Hỏi đáp/Tư vấn">💬 Hỏi đáp/Tư vấn</option>
                          <option value="Hóa đơn/Thanh toán">💳 Hóa đơn/Thanh toán</option>
                        </NativeSelect>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="support-priority" className="text-[10px] font-bold text-muted-foreground uppercase">Ưu tiên</Label>
                        <NativeSelect
                          id="support-priority"
                          value={supportPriority}
                          onChange={(e) => setSupportPriority(e.target.value)}
                          className="text-xs cursor-pointer h-9"
                        >
                          <option value="Thấp">🟢 Thấp</option>
                          <option value="Trung bình">🟡 Trung bình</option>
                          <option value="Cao">🔴 Cao (Gấp)</option>
                        </NativeSelect>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="support-phone" className="text-[10px] font-bold text-muted-foreground uppercase">Số điện thoại liên hệ</Label>
                      <Input
                        id="support-phone"
                        type="tel"
                        placeholder="Số điện thoại của bạn..."
                        value={supportContactPhone}
                        onChange={(e) => setSupportContactPhone(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="support-title" className="text-[10px] font-bold text-muted-foreground uppercase">Tiêu đề yêu cầu</Label>
                      <Input
                        id="support-title"
                        type="text"
                        placeholder="Ví dụ: Không in được hóa đơn bán hàng..."
                        value={supportTitle}
                        onChange={(e) => setSupportTitle(e.target.value)}
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="support-description" className="text-[10px] font-bold text-muted-foreground uppercase">Nội dung chi tiết</Label>
                      <Textarea
                        id="support-description"
                        rows={3}
                        placeholder="Mô tả chi tiết lỗi bạn gặp phải hoặc tính năng cần hỗ trợ..."
                        value={supportDescription}
                        onChange={(e) => setSupportDescription(e.target.value)}
                        className="text-xs resize-none"
                        required
                      />
                    </div>

                    <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setSupportOpen(false)} className="text-xs h-9 py-1 px-3 cursor-pointer">
                        Hủy bỏ
                      </Button>
                      <Button type="submit" disabled={supportLoading} className="text-xs h-9 font-bold gap-1.5 cursor-pointer py-1 px-4">
                        {supportLoading ? (
                          "Đang gửi..."
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Gửi ticket
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-left active:bg-destructive/20"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">Đăng xuất tài khoản</span>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
