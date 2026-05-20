import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { isSuperAdminUser } from "@/utils/super-admin";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const authClient = createServerSupabase(cookieStore);
  const {
    data: { user: caller },
  } = await authClient.auth.getUser();

  if (!caller) {
    return NextResponse.json({ success: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Thiếu SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();
    const organizationId = String(body.organizationId || "");
    const roleName = String(body.role || "staff").toLowerCase();
    const roleId = body.roleId && body.roleId !== "none" ? String(body.roleId) : null;
    const branchId = body.branchId ? String(body.branchId) : null;
    const status = String(body.status || "active");

    // organization_members.role is constrained to ('owner','admin','manager','staff').
    // Custom roles live in roles table and are referenced via role_id, so collapse any
    // non-system role name to 'staff' for the legacy tier column.
    const ALLOWED_ROLE_TIERS = new Set(["owner", "admin", "manager", "staff"]);
    const roleTier = ALLOWED_ROLE_TIERS.has(roleName) ? roleName : "staff";

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: "Thiếu họ tên hoặc email." }, { status: 400 });
    }
    if (!organizationId) {
      return NextResponse.json({ success: false, error: "Thiếu organizationId." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Mật khẩu ban đầu phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    // Owner / super-admin authorization
    const isSuperAdmin = isSuperAdminUser(caller);
    let isOwner = false;
    if (!isSuperAdmin) {
      const { data: callerMember, error: callerMemberError } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("profile_id", caller.id)
        .maybeSingle();
      if (callerMemberError) throw callerMemberError;
      isOwner = String(callerMember?.role || "").toLowerCase() === "owner";
    }
    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Chỉ chủ doanh nghiệp (Owner) mới được cấp tài khoản nhân viên." },
        { status: 403 },
      );
    }

    // Lookup org slug để prefix tên nhân viên (giữ tương thích với getEmployees() ở client)
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", organizationId)
      .maybeSingle();
    if (orgError) throw orgError;
    if (!org?.slug) {
      return NextResponse.json({ success: false, error: "Không xác định được tenant." }, { status: 404 });
    }
    const tenantSlug = String(org.slug);

    // Email không được trùng với tenant khác
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;
    if (existingProfile?.id) {
      const { data: otherMemberships, error: otherMembershipsError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("profile_id", existingProfile.id);
      if (otherMembershipsError) throw otherMembershipsError;
      const belongsToOtherOrg = (otherMemberships || []).some((m) => m.organization_id !== organizationId);
      if (belongsToOtherOrg) {
        return NextResponse.json(
          { success: false, error: "Email này đã thuộc tenant khác. Vui lòng dùng email khác cho nhân viên." },
          { status: 409 },
        );
      }
    }

    // 1) Tạo (hoặc tái sử dụng) Supabase Auth user
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    let profileId = existingProfile?.id || null;

    if (!profileId) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          organization_id: organizationId,
          role: roleName,
        },
      });
      if (createError) throw createError;
      if (!created.user?.id) throw new Error("Supabase Auth không trả về user id.");
      profileId = created.user.id;
    } else {
      // Cho phép Owner reset mật khẩu của nhân viên cùng tenant
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(profileId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          organization_id: organizationId,
          role: roleName,
        },
      } as any);
      if (updateAuthError) throw updateAuthError;
    }

    // 2) Upsert profiles
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: profileId,
      full_name: fullName,
      email,
      avatar_url: avatarUrl,
    });
    if (profileError) throw profileError;

    // 3) Upsert organization_members
    const { data: existingMember, error: existingMemberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (existingMemberError) throw existingMemberError;

    const membershipPayload: Record<string, any> = {
      organization_id: organizationId,
      profile_id: profileId,
      role: roleTier,
    };
    if (roleId) membershipPayload.role_id = roleId;

    if (existingMember?.id) {
      const { error: memberUpdateError } = await supabase
        .from("organization_members")
        .update(membershipPayload)
        .eq("id", existingMember.id);
      if (memberUpdateError) throw memberUpdateError;
    } else {
      const { error: memberInsertError } = await supabase
        .from("organization_members")
        .insert(membershipPayload);
      if (memberInsertError) throw memberInsertError;
    }

    // 4) Tạo bản ghi employees để giữ tương thích với UI hiện tại
    const employeePayload: Record<string, any> = {
      name: `${tenantSlug}::${fullName}`,
      email,
      phone: phone || null,
      role: roleName,
      status,
      profile_id: profileId,
    };
    if (branchId) employeePayload.branch_id = branchId;

    const { data: existingEmployee, error: existingEmployeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let employeeRow: any = null;
    if (existingEmployeeError && existingEmployeeError.code !== "PGRST116") {
      // Bỏ qua nếu cột email không tồn tại hoặc không tìm thấy, để insert bên dưới chạy bình thường
      console.warn("employees lookup warning:", existingEmployeeError);
    }

    if (existingEmployee?.id) {
      const { data: updated, error: updateEmployeeError } = await supabase
        .from("employees")
        .update(employeePayload)
        .eq("id", existingEmployee.id)
        .select()
        .maybeSingle();
      if (updateEmployeeError) throw updateEmployeeError;
      employeeRow = updated;
    } else {
      const { data: inserted, error: insertEmployeeError } = await supabase
        .from("employees")
        .insert(employeePayload)
        .select()
        .maybeSingle();
      if (insertEmployeeError) throw insertEmployeeError;
      employeeRow = inserted;
    }

    return NextResponse.json({
      success: true,
      data: {
        profileId,
        employeeId: employeeRow?.id || null,
        loginEmail: email,
        loginUrl: `https://${tenantSlug}.${process.env.NEXT_PUBLIC_MAIN_DOMAIN || "zpos.click"}/login`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể tạo tài khoản nhân viên.", code: error?.code },
      { status: 500 },
    );
  }
}
