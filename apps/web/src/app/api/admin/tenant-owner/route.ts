import { type NextRequest, NextResponse } from "next/server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

import { requireSuperAdmin } from "@/utils/admin-auth";

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
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Thiếu SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const organizationId = String(body.organizationId || "");
    const profileId = String(body.profileId || "");
    const fullName = String(body.fullName || "").trim() || "Chủ doanh nghiệp";
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!organizationId || !profileId || !email) {
      return NextResponse.json(
        { success: false, error: "Thiếu organizationId, profileId hoặc email." },
        { status: 400 },
      );
    }

    const { data: ownerMember, error: ownerMemberError } = await supabase
      .from("organization_members")
      .select("id, organization_id, profile_id, role")
      .eq("organization_id", organizationId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (ownerMemberError) throw ownerMemberError;
    if (!ownerMember) {
      return NextResponse.json(
        { success: false, error: "Profile này không thuộc tenant hiện tại. Dừng để tránh sửa nhầm tenant khác." },
        { status: 409 },
      );
    }

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", profileId)
      .maybeSingle();

    if (currentProfileError) throw currentProfileError;

    const { data: profileMemberships, error: membershipsError } = await supabase
      .from("organization_members")
      .select("id, organization_id")
      .eq("profile_id", profileId);

    if (membershipsError) throw membershipsError;

    const profileIsShared = (profileMemberships || []).some((m) => m.organization_id !== organizationId);
    const ownerChanged =
      (currentProfile?.email || "").toLowerCase() !== email || (currentProfile?.full_name || "") !== fullName;

    if (profileIsShared && ownerChanged) {
      const { data: existingTargetProfile, error: existingTargetError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingTargetError) throw existingTargetError;

      let targetProfileId = existingTargetProfile?.id;

      if (!targetProfileId) {
        if (password.length < 6) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Owner hiện tại đang dùng chung profile với tenant khác. Nhập mật khẩu mới tối thiểu 6 ký tự để tạo tài khoản owner riêng.",
            },
            { status: 409 },
          );
        }

        const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            organization_id: organizationId,
            role: "tenant_owner",
          },
        });

        if (createUserError) throw createUserError;
        if (!createdUser.user?.id) throw new Error("Không tạo được auth user cho owner tenant.");

        targetProfileId = createdUser.user.id;
        const { error: profileInsertError } = await supabase.from("profiles").upsert({
          id: targetProfileId,
          full_name: fullName,
          email,
          avatar_url:
            currentProfile?.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        });

        if (profileInsertError) throw profileInsertError;
      }

      const { error: moveMemberError } = await supabase
        .from("organization_members")
        .update({ profile_id: targetProfileId, role: ownerMember.role || "owner" })
        .eq("id", ownerMember.id)
        .eq("organization_id", organizationId);

      if (moveMemberError) throw moveMemberError;

      return NextResponse.json({ success: true, data: { profileId: targetProfileId, isolated: true } });
    }

    const { data: existingEmailProfile, error: existingEmailError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmailError) throw existingEmailError;
    if (existingEmailProfile && existingEmailProfile.id !== profileId) {
      return NextResponse.json(
        { success: false, error: "Email này đã thuộc profile khác. Không thể ghi đè profile hiện tại." },
        { status: 409 },
      );
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(profileId, {
      email,
      user_metadata: { full_name: fullName, organization_id: organizationId, role: "tenant_owner" },
    });

    if (authUpdateError) throw authUpdateError;

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, email })
      .eq("id", profileId);

    if (profileUpdateError) throw profileUpdateError;

    return NextResponse.json({ success: true, data: { profileId, isolated: false } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể cập nhật owner tenant.", code: error?.code },
      { status: 500 },
    );
  }
}
