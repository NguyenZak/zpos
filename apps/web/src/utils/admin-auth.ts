import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { isSuperAdminUser } from "@/utils/super-admin";

export async function requireSuperAdmin() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ success: false, error: "Chưa đăng nhập." }, { status: 401 }),
    };
  }

  if (!isSuperAdminUser(user)) {
    return {
      user,
      error: NextResponse.json({ success: false, error: "Không có quyền truy cập Console." }, { status: 403 }),
    };
  }

  return { user, error: null };
}
