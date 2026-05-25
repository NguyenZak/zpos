import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { isSuperAdminEmail } from "@/utils/super-admin";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

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

function cleanMemoPrefix(value: unknown) {
  return String(value || "ZPOS")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const authClient = createServerSupabase(cookieStore);
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Thiếu SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const tenantId = String(body.tenant_id || "");
    const accountNo = String(body.account_no || "").replace(/\s+/g, "");
    const accountName = String(body.account_name || "")
      .toUpperCase()
      .trim();

    if (!tenantId || tenantId === EMPTY_UUID) {
      return NextResponse.json(
        {
          success: false,
          error: "Không xác định được tenant hiện tại. Hãy đăng nhập lại hoặc vào đúng subdomain cửa hàng.",
        },
        { status: 400 },
      );
    }

    if (!accountNo || !accountName) {
      return NextResponse.json({ success: false, error: "Thiếu số tài khoản hoặc chủ tài khoản." }, { status: 400 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id, role")
      .eq("organization_id", tenantId)
      .eq("profile_id", user.id)
      .maybeSingle();

    const role = String(membership?.role || "").toLowerCase();
    const canManageBankAccount = isSuperAdminEmail(user.email) || ["owner", "admin", "manager"].includes(role);

    if (membershipError || !canManageBankAccount) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hiện tại chưa có quyền cấu hình tài khoản ngân hàng cho tenant này." },
        { status: 403 },
      );
    }

    const accountId = body.id ? String(body.id) : null;
    const payload = {
      tenant_id: tenantId,
      bank_id: String(body.bank_id || "VCB"),
      bank_name: body.bank_name ? String(body.bank_name) : null,
      bank_short_name: body.bank_short_name ? String(body.bank_short_name) : null,
      bank_logo: body.bank_logo ? String(body.bank_logo) : null,
      account_no: accountNo,
      account_name: accountName,
      memo_prefix: cleanMemoPrefix(body.memo_prefix),
      is_default: Boolean(body.is_default),
      is_active: body.is_active !== false,
      webhook_provider: body.webhook_provider || "manual",
      webhook_secret: body.webhook_secret ? String(body.webhook_secret) : null,
      notes: body.notes ? String(body.notes) : null,
    };

    if (payload.is_default) {
      const { error } = await supabase.from("bank_accounts").update({ is_default: false }).eq("tenant_id", tenantId);
      if (error) throw error;
    }

    if (accountId) {
      const { data, error } = await supabase
        .from("bank_accounts")
        .update(payload)
        .eq("id", accountId)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (payload.webhook_provider !== "manual" && !payload.webhook_secret) {
      payload.webhook_secret = `whk_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
    }

    const { data, error } = await supabase.from("bank_accounts").insert([payload]).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("save bank account failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể lưu tài khoản ngân hàng." },
      { status: 500 },
    );
  }
}
