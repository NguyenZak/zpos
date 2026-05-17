import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { users } from "@/data/users";
import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { getPreference } from "@/server/server-actions";
import { ResponsiveLayout } from "./_components/responsive-layout";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
  ]);

  return (
    <ResponsiveLayout
      defaultOpen={defaultOpen}
      variant={variant}
      collapsible={collapsible}
      users={users}
    >
      {children}
    </ResponsiveLayout>
  );
}

