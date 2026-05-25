"use client";

import React from "react";
import Link from "next/link";
import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { createClient } from "@/utils/supabase/client";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { getRequiredPermissionForPath } from "@/utils/permission-check";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { SidebarSupportCard } from "./sidebar-support-card";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const { hasPermission, loading } = usePermissions();

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const [currentUser, setCurrentUser] = React.useState({
    name: "Chủ doanh nghiệp",
    email: "loading...",
    avatar: "",
  });

  React.useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

          setCurrentUser({
            name: profile?.full_name || user.user_metadata?.full_name || "Chủ doanh nghiệp",
            email: user.email || "",
            avatar:
              profile?.avatar_url ||
              user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || user.user_metadata?.full_name || "User")}`,
          });
          return;
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };

    void loadUser();
  }, []);

  // Filter sidebar groups and sub-items based on active permissions
  const filteredSidebarItems = React.useMemo(() => {
    if (loading) return []; // Keep empty while loading to avoid layout shift

    return sidebarItems
      .map((group) => {
        const filteredItems = group.items
          .map((item) => {
            const requiredPerm = getRequiredPermissionForPath(item.url);

            // Hide if unauthorized
            if (requiredPerm && !hasPermission(requiredPerm)) {
              return null;
            }

            // Filter subitems if any
            if (item.subItems) {
              const filteredSub = item.subItems.filter((sub) => {
                const subPerm = getRequiredPermissionForPath(sub.url);
                return !subPerm || hasPermission(subPerm);
              });
              return {
                ...item,
                subItems: filteredSub,
              };
            }

            return item;
          })
          .filter((item): item is (typeof group.items)[number] => item !== null);

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [loading, hasPermission]);

  return (
    <Sidebar className="print:hidden" {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link prefetch={false} href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ZPOS</span>
                  <span className="truncate text-xs">Nền tảng ZPOS SaaS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredSidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSupportCard />
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
