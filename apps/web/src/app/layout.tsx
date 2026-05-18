import Script from 'next/script';
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { fontVars } from "@/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;
    
  return (
    <html
      lang="en"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var root = document.documentElement;
                function readCookie(name) {
                  var match = document.cookie.split("; ").find(function(c) {
                    return c.startsWith(name + "=");
                  });
                  return match ? decodeURIComponent(match.split("=")[1]) : null;
                }
                function readLocal(name) {
                  try { return window.localStorage.getItem(name); } catch (e) { return null; }
                }
                function readPreference(key, fallback) {
                  var defaults = {
                    theme_mode: "light",
                    theme_preset: "default",
                    font: "inter",
                    content_layout: "wide",
                    navbar_style: "sticky",
                    sidebar_variant: "inset",
                    sidebar_collapsible: "icon"
                  };
                  return readLocal(key) || readCookie(key) || defaults[key];
                }
                var mode = readPreference("theme_mode", "light");
                var resolvedMode = mode === "system" 
                  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                  : mode;
                root.classList.toggle("dark", resolvedMode === "dark");
                root.setAttribute("data-theme-mode", mode);
                root.setAttribute("data-theme-preset", readPreference("theme_preset", "default"));
                root.setAttribute("data-font", readPreference("font", "inter"));
                root.setAttribute("data-content-layout", readPreference("content_layout", "wide"));
                root.setAttribute("data-navbar-style", readPreference("navbar_style", "sticky"));
                root.setAttribute("data-sidebar-variant", readPreference("sidebar_variant", "inset"));
                root.setAttribute("data-sidebar-collapsible", readPreference("sidebar_collapsible", "icon"));
                root.style.colorScheme = resolvedMode === "dark" ? "dark" : "light";
                
                var savedFontSize = readLocal("zpos_font_size") || "md";
                var scale = "100%";
                if (savedFontSize === "sm") scale = "90%";
                else if (savedFontSize === "lg") scale = "110%";
                else if (savedFontSize === "xl") scale = "120%";
                root.style.fontSize = scale;
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider
            themeMode={theme_mode}
            themePreset={theme_preset}
            contentLayout={content_layout}
            navbarStyle={navbar_style}
            font={font}
          >
            {children}
            <Toaster />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
