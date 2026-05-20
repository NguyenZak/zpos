import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { isSuperAdminUser } from "@/utils/super-admin";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/console");
  }

  if (!isSuperAdminUser(user)) {
    redirect("/unauthorized");
  }

  return children;
}
