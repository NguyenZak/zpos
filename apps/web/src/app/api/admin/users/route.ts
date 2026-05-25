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
    data: { user: adminUser },
  } = await authClient.auth.getUser();

  if (!isSuperAdminUser(adminUser)) {
    return NextResponse.json({ success: false, error: "Không có quyền tạo/cập nhật user." }, { status: 403 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Thiếu SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const organizationId = body.organizationId ? String(body.organizationId) : null;
    const role = String(body.role || "staff");
    const roleId = body.roleId && body.roleId !== "none" ? String(body.roleId) : null;
    const memberId = body.memberId ? String(body.memberId) : null;
    const profileIdFromBody = body.profileId ? String(body.profileId) : null;
    const avatarUrl =
      body.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || email || "User")}`;

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: "Thiếu họ tên hoặc email." }, { status: 400 });
    }
    if (!profileIdFromBody && password.length < 6) {
      return NextResponse.json({ success: false, error: "Mật khẩu ban đầu phải có ít nhất 6 ký tự." }, { status: 400 });
    }
    if (role !== "super_admin" && !organizationId) {
      return NextResponse.json({ success: false, error: "Thiếu organizationId cho user tenant." }, { status: 400 });
    }

    let profileId = profileIdFromBody;

    if (!profileId) {
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existingProfileError) throw existingProfileError;
      if (existingProfile?.id && role !== "super_admin" && organizationId) {
        const { data: existingMemberships, error: existingMembershipsError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("profile_id", existingProfile.id);
        if (existingMembershipsError) throw existingMembershipsError;

        const belongsToCurrentOrg = (existingMemberships || []).some((m) => m.organization_id === organizationId);
        const belongsToOtherOrg = (existingMemberships || []).some((m) => m.organization_id !== organizationId);

        if (belongsToOtherOrg && !belongsToCurrentOrg) {
          return NextResponse.json(
            {
              success: false,
              error: "Email này đã thuộc tenant khác. Dùng email khác để tránh lẫn tài khoản giữa tenant.",
            },
            { status: 409 },
          );
        }
      }
      profileId = existingProfile?.id || null;
    }

    if (!profileId) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          organization_id: organizationId,
          role,
        },
      });
      if (createError) throw createError;
      if (!created.user?.id) throw new Error("Supabase Auth không trả về user id.");
      profileId = created.user.id;
    } else {
      if (profileIdFromBody && role !== "super_admin" && organizationId) {
        const { data: member, error: memberError } = memberId
          ? await supabase
              .from("organization_members")
              .select("id, organization_id, profile_id, role")
              .eq("id", memberId)
              .eq("organization_id", organizationId)
              .maybeSingle()
          : await supabase
              .from("organization_members")
              .select("id, organization_id, profile_id, role")
              .eq("organization_id", organizationId)
              .eq("profile_id", profileId)
              .maybeSingle();

        if (memberError) throw memberError;
        if (!member) {
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

        const { data: memberships, error: membershipsError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("profile_id", profileId);
        if (membershipsError) throw membershipsError;

        const profileIsShared = (memberships || []).some((m) => m.organization_id !== organizationId);
        const userChanged =
          (currentProfile?.email || "").toLowerCase() !== email ||
          (currentProfile?.full_name || "") !== fullName ||
          (currentProfile?.avatar_url || "") !== avatarUrl;

        if (profileIsShared && userChanged) {
          const { data: existingTargetProfile, error: existingTargetError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (existingTargetError) throw existingTargetError;

          let targetProfileId = existingTargetProfile?.id || null;

          if (!targetProfileId) {
            if (password.length < 6) {
              return NextResponse.json(
                {
                  success: false,
                  error:
                    "User này đang dùng chung profile với tenant khác. Nhập mật khẩu mới tối thiểu 6 ký tự để tách thành tài khoản riêng.",
                },
                { status: 409 },
              );
            }

            const { data: created, error: createError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                full_name: fullName,
                organization_id: organizationId,
                role,
              },
            });
            if (createError) throw createError;
            if (!created.user?.id) throw new Error("Supabase Auth không trả về user id.");
            targetProfileId = created.user.id;

            const { error: profileError } = await supabase.from("profiles").upsert({
              id: targetProfileId,
              full_name: fullName,
              email,
              avatar_url: avatarUrl,
            });
            if (profileError) throw profileError;
          }

          const { error: moveMemberError } = await supabase
            .from("organization_members")
            .update({
              organization_id: organizationId,
              profile_id: targetProfileId,
              role,
              ...(roleId ? { role_id: roleId } : {}),
            })
            .eq("id", member.id)
            .eq("organization_id", organizationId);
          if (moveMemberError) throw moveMemberError;

          return NextResponse.json({ success: true, data: { profileId: targetProfileId, isolated: true } });
        }
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

      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(profileId, {
        email,
        ...(password.length >= 6 ? { password } : {}),
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          organization_id: organizationId,
          role,
        },
      } as any);
      if (updateAuthError) throw updateAuthError;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: profileId,
      full_name: fullName,
      email,
      avatar_url: avatarUrl,
    });
    if (profileError) throw profileError;

    if (role !== "super_admin" && organizationId) {
      // organization_members.role is constrained to ('owner','admin','manager','staff').
      // Custom roles live in roles table (role_id); collapse anything else to 'staff' tier.
      const ALLOWED_ROLE_TIERS = new Set(["owner", "admin", "manager", "staff"]);
      const roleTier = ALLOWED_ROLE_TIERS.has(role.toLowerCase()) ? role.toLowerCase() : "staff";
      const membershipPayload = {
        organization_id: organizationId,
        profile_id: profileId,
        role: roleTier,
        ...(roleId ? { role_id: roleId } : {}),
      };

      if (memberId) {
        const { error: memberError } = await supabase
          .from("organization_members")
          .update(membershipPayload)
          .eq("id", memberId)
          .eq("organization_id", organizationId);
        if (memberError) throw memberError;
      } else {
        const { data: existingMember, error: existingMemberError } = await supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("profile_id", profileId)
          .maybeSingle();
        if (existingMemberError) throw existingMemberError;

        if (existingMember?.id) {
          const { error: memberError } = await supabase
            .from("organization_members")
            .update(membershipPayload)
            .eq("id", existingMember.id);
          if (memberError) throw memberError;
        } else {
          const { error: memberError } = await supabase.from("organization_members").insert(membershipPayload);
          if (memberError) throw memberError;
        }
      }
    }

    return NextResponse.json({ success: true, data: { profileId } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể tạo/cập nhật user.", code: error?.code },
      { status: 500 },
    );
  }
}
