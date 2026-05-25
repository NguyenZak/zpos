import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { users } from "@/data/users";
import { getPreference } from "@/server/server-actions";
import { StorefrontStandaloneLayout } from "./_components/storefront-standalone-layout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function StorefrontLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", ["sidebar", "inset"], "inset"),
    getPreference("sidebar_collapsible", ["offcanvas", "icon", "none"], "icon"),
  ]);

  return (
    <StorefrontStandaloneLayout variant={variant} collapsible={collapsible} users={users}>
      {children}
    </StorefrontStandaloneLayout>
  );
}
