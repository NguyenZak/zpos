"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/app/app/_components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BranchSwitcher } from "./sidebar/branch-switcher";
import { SearchDialog } from "./sidebar/search-dialog";
import { LayoutControls } from "./sidebar/layout-controls";
import { ThemeSwitcher } from "./sidebar/theme-switcher";
import { AccountSwitcher } from "./sidebar/account-switcher";
import { AIFloatingWidget } from "./ai-floating-widget";
import { PermissionGuard } from "@/components/permission-guard";
import { MobileBottomNav } from "./mobile/mobile-bottom-nav";
import { TelegramScheduler } from "./telegram-scheduler";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  defaultOpen: boolean;
  variant: any;
  collapsible: any;
  users: any[];
}

export function ResponsiveLayout({
  children,
  defaultOpen,
  variant,
  collapsible,
  users
}: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check initial match
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    // Listen for resize changes
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!mounted) {
    // Return placeholder skeleton to avoid hydration flash mismatch
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showAIWidget = pathname === "/app" || pathname === "/app/dashboard";

  // --- MOBILE ARCHITECTURE (NO SIDEBAR, BOTTOM NAV PINNED) ---
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-300">
        <TelegramScheduler />
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-2 min-h-screen">
          <PermissionGuard>
            {children}
          </PermissionGuard>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Portable Floating AI Widget on Mobile */}
        {showAIWidget && (
          <div className="bottom-20 right-4 z-40 hidden">
            <AIFloatingWidget />
          </div>
        )}
      </div>
    );
  }

  // --- DESKTOP ARCHITECTURE (SIDEBAR RENDERED) ---
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
    >
      <TelegramScheduler />
      <AppSidebar variant={variant} collapsible={collapsible} />
      <SidebarInset
        className="[html[data-content-layout=centered]_&>*]:mx-auto [html[data-content-layout=centered]_&>*]:w-full [html[data-content-layout=centered]_&>*]:max-w-screen-2xl peer-data-[variant=inset]:border"
      >
        <header
          className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md"
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <BranchSwitcher />
              <Separator
                orientation="vertical"
                className="mx-2 hidden md:block data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-2">
              <LayoutControls />
              <ThemeSwitcher />
              <AccountSwitcher users={users} />
            </div>
          </div>
        </header>
        <div className="h-full p-3 md:p-4">
          <PermissionGuard>
            {children}
          </PermissionGuard>
        </div>
        {showAIWidget && <AIFloatingWidget />}
      </SidebarInset>
    </SidebarProvider>
  );
}
