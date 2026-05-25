"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Command,
  LayoutDashboard,
  Layout,
  FileText,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  ExternalLink,
  Ruler,
  Package,
  Palette,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { createClient } from "@/utils/supabase/client";
import { NavUser } from "@/app/app/_components/sidebar/nav-user";
import { SidebarSupportCard } from "@/app/app/_components/sidebar/sidebar-support-card";

export function CMSSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const pathname = usePathname();

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const [activeHash, setActiveHash] = React.useState("#dashboard");

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash || "#dashboard");
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // --- Real User Session loading identical to app-sidebar.tsx ---
  const [currentUser, setCurrentUser] = React.useState({
    name: "Chủ doanh nghiệp",
    email: "loading...",
    avatar: "",
  });

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Query profile for actual name and details
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

          setCurrentUser({
            name: profile?.full_name || user.user_metadata?.full_name || "Chủ doanh nghiệp",
            email: user.email || "",
            avatar:
              profile?.avatar_url ||
              user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || user.user_metadata?.full_name || "User")}`,
          });
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };

    void loadUser();
  }, []);

  const menuItems = [
    { title: "Tổng quan", icon: LayoutDashboard, hash: "#dashboard" },
    { title: "Thiết kế UI", icon: Palette, hash: "#ui-design" },
    { title: "Landing Page", icon: Layout, hash: "#landing-page" },
    { title: "Bài viết (Blog)", icon: FileText, hash: "#blog" },
    { title: "Sản phẩm (Storefront)", icon: Package, hash: "#products" },
    { title: "Hướng dẫn chọn size", icon: Ruler, hash: "#sizeguide" },
    { title: "SEO toàn trang", icon: Globe, hash: "#seo" },
    { title: "Thư viện Media", icon: ImageIcon, hash: "#media" },
    { title: "Yêu cầu tư vấn", icon: MessageSquare, hash: "#inquiries" },
    { title: "Cài đặt CMS", icon: Settings, hash: "#settings" },
  ];

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      {/* Brand Header identical in branding layout to app-sidebar */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link prefetch={false} href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ZPOS CMS</span>
                  <span className="truncate text-xs">Marketing & Content</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Xem Website premium action button */}
        <div className="px-2 pt-1 pb-1">
          <Link
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Xem Website</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-80" />
          </Link>
        </div>
      </SidebarHeader>

      {/* Sidebar navigation list identical to app-sidebar */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý Nội dung</SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === "/cms" && activeHash === item.hash;
                return (
                  <SidebarMenuItem key={item.hash}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <a href={`/cms${item.hash}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer containing support ticket card & NavUser matching app-sidebar 100% */}
      <SidebarFooter>
        <SidebarSupportCard />
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
