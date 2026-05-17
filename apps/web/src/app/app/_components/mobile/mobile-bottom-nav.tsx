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
  Bot
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
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface BottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      
      localStorage.removeItem("zpos_mock_user"); // Also clean up mock user
      
      // Clear mock session cookie from all subdomains
      const isLocal = window.location.hostname.includes("localhost");
      let cookieDomain = ".zpos.click";
      if (isLocal) {
        cookieDomain = ".localhost";
      } else if (window.location.hostname.endsWith("zpos-web.vercel.app")) {
        cookieDomain = ".zpos-web.vercel.app";
      }
      document.cookie = `zpos_mock_session=; path=/; domain=${cookieDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

      toast.success("Đã đăng xuất khỏi hệ thống!");
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
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
                  const isActive = theme === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setTheme(item.value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95",
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
              <button 
                onClick={() => toast.info("Tính năng hỗ trợ 24/7 đang mở rộng!")}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left active:bg-muted"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Hỗ trợ & Liên hệ kỹ thuật</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

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
