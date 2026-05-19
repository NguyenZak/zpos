"use client";

import React, { useState, useEffect } from "react";
import { CMSSidebar } from "./cms-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SearchDialog } from "@/app/app/_components/sidebar/search-dialog";
import { LayoutControls } from "@/app/app/_components/sidebar/layout-controls";
import { ThemeSwitcher } from "@/app/app/_components/sidebar/theme-switcher";
import { AccountSwitcher } from "@/app/app/_components/sidebar/account-switcher";
import { createClient } from "@/utils/supabase/client";
import { CMSLoginForm } from "./cms-login-form";

interface CMSResponsiveLayoutProps {
  children: React.ReactNode;
  defaultOpen: boolean;
  variant: any;
  collapsible: any;
  users: any[];
}

export function CMSResponsiveLayout({
  children,
  defaultOpen,
  variant,
  collapsible,
  users
}: CMSResponsiveLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSession = async () => {
    setIsCheckingAuth(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error loading user profile in layout guard:", err);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkSession();
    
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!mounted || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Glow behind the loading spinner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg" />
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-slate-200 text-sm tracking-wider uppercase">ZPOS Securing...</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">TLS_AES_256_GCM</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <CMSLoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-300">
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-2 min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
    >
      <CMSSidebar variant={variant} collapsible={collapsible} />
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
              <span className="font-semibold text-sm hidden md:inline-flex text-muted-foreground">CMS Quản trị Web</span>
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
        <div className="h-full p-4 md:p-6 bg-slate-100 dark:bg-slate-950">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
