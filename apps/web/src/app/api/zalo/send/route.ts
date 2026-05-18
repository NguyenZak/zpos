import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient as createServer } from "@/utils/supabase/server";

// Zalo ZNS endpoint
const ZNS_URL = "https://business.openapi.zalo.me/message/template";

function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D+/g, "");
  if (digits.startsWith("84")) return digits;
  if (digits.startsWith("0")) return "84" + digits.slice(1);
  return digits;
}

export async function POST(req: Request) {
  const supabase = createServer(await cookies());
  const { data: userResp } = await supabase.auth.getUser();
  const user = userResp?.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { phone, templateEvent, templateZaloId, templateData, orderId, invoiceId, customerId } = body || {};

  if (!phone) {
    return NextResponse.json({ ok: false, error: "missing_phone" }, { status: 400 });
  }

  // Resolve the tenant the user belongs to (first membership)
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();
  const tenantId = membership?.organization_id;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "no_tenant" }, { status: 403 });
  }

  // Load active default Zalo config
  const { data: cfg } = await supabase
    .from("zalo_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cfg) {
    return NextResponse.json({ ok: false, error: "zalo_not_configured" }, { status: 412 });
  }

  // Resolve template id — either passed explicitly or by event
  let zaloTemplateId: string | undefined = templateZaloId;
  let templateRowId: string | undefined;
  if (!zaloTemplateId && templateEvent) {
    const { data: tpl } = await supabase
      .from("zalo_templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("trigger_event", templateEvent)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tpl) {
      zaloTemplateId = tpl.template_id;
      templateRowId = tpl.id;
    }
  }

  if (!zaloTemplateId) {
    return NextResponse.json({ ok: false, error: "template_not_found" }, { status: 404 });
  }

  const phoneE164 = normalizePhone(phone);

  // Log the attempt (status=pending) so the UI can show queued messages
  const { data: msg, error: insErr } = await supabase
    .from("zalo_messages")
    .insert([
      {
        tenant_id: tenantId,
        zalo_config_id: cfg.id,
        template_id: templateRowId || null,
        phone: phoneE164,
        customer_id: customerId || null,
        order_id: orderId || null,
        invoice_id: invoiceId || null,
        channel: "zns",
        template_zalo_id: zaloTemplateId,
        template_data: templateData || {},
        status: "pending",
      },
    ])
    .select()
    .single();

  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  // Call Zalo ZNS
  try {
    const resp = await fetch(ZNS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: cfg.access_token || "",
      },
      body: JSON.stringify({
        phone: phoneE164,
        template_id: zaloTemplateId,
        template_data: templateData || {},
        tracking_id: msg.id,
      }),
    });
    const json: any = await resp.json().catch(() => ({}));

    if (json?.error === 0 || json?.error === "0") {
      await supabase
        .from("zalo_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          zalo_message_id: json?.data?.msg_id || null,
          provider_payload: json,
        })
        .eq("id", msg.id);
      const { data: updated } = await supabase.from("zalo_messages").select("*").eq("id", msg.id).single();
      return NextResponse.json({ ok: true, message: updated });
    }

    const errCode = String(json?.error ?? "unknown");
    const errMsg = String(json?.message ?? "Send failed");
    await supabase
      .from("zalo_messages")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        zalo_error_code: errCode,
        zalo_error_message: errMsg,
        provider_payload: json,
      })
      .eq("id", msg.id);

    return NextResponse.json({ ok: false, error: errMsg, code: errCode, message_id: msg.id }, { status: 502 });
  } catch (e: any) {
    await supabase
      .from("zalo_messages")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        zalo_error_message: e?.message || "Network error",
      })
      .eq("id", msg.id);
    return NextResponse.json({ ok: false, error: e?.message || "Network error" }, { status: 502 });
  }
}
