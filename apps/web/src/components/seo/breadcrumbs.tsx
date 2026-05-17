"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { BreadcrumbsJsonLd } from "./json-ld";
import { APP_CONFIG } from "@/config/app-config";

interface BreadcrumbsProps {
  customLabels?: Record<string, string>;
  className?: string;
}

/**
 * Modern, beautifully styled Breadcrumbs component with responsive Mobile-First design,
 * premium glassmorphism, hover animations, and automatic JSON-LD Breadcrumb Schema injection!
 */
export function Breadcrumbs({ customLabels = {}, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  // Split path into individual segments
  const pathSegments = pathname.split("/").filter((segment) => segment);

  // Generate breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
    
    // Determine the user-friendly label
    let label = segment;
    if (customLabels[segment]) {
      label = customLabels[segment];
    } else if (customLabels[url]) {
      label = customLabels[url];
    } else {
      // Auto-format segment text (replace hyphens with spaces, capitalize)
      label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return {
      name: label,
      item: `${APP_CONFIG.url}${url}`,
      path: url,
    };
  });

  // Prepend the Home item
  const allItems = [
    {
      name: "Trang chủ",
      item: APP_CONFIG.url,
      path: "/",
    },
    ...breadcrumbItems,
  ];

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex flex-col gap-2 py-3 px-4 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md shadow-sm transition-all duration-300 ${className}`}
    >
      {/* Dynamic JSON-LD Schema Auto Injection */}
      <BreadcrumbsJsonLd itemListElement={allItems} />

      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-350 dark:text-slate-650 shrink-0" />
              )}

              {isLast ? (
                <span className="text-slate-800 dark:text-slate-200 font-extrabold max-w-[200px] sm:max-w-none truncate animate-slideIn">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-[1.01] transition-all group duration-200"
                >
                  {index === 0 && (
                    <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                  )}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
export default Breadcrumbs;
