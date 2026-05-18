import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

// Webhook from Zalo delivers status updates: delivered, read, failed.
// We map them to record_zalo_delivery RPC (SECURITY DEFINER) so no service
// role key is required on the server.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function admin() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mapStatus(eventName?: string): string | undefined {
  if (!eventName) return undefined;
  const e = eventName.toLowerCase();
  if (e.includes("deliver")) return "delivered";
  if (e.includes("read")) return "read";
  if (e.includes("fail") || e.includes("error")) return "failed";
  if (e.includes("send")) return "sent";
  return undefined;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Zalo can send a single event or a list
  const events: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [body];

  const supabase = admin();
  const results: any[] = [];

  for (const ev of events) {
    const msgId: string | undefined = ev?.message_id || ev?.msg_id || ev?.tracking_id;
    if (!msgId) {
      results.push({ ok: false, error: "missing_message_id" });
      continue;
    }
    const status = mapStatus(ev?.event_name || ev?.status);
    const { data, error } = await supabase.rpc("record_zalo_delivery", {
      p_zalo_message_id: msgId,
      p_status: status || "sent",
      p_error_code: ev?.error ? String(ev.error) : null,
      p_error_message: ev?.message || null,
      p_raw: ev,
    });
    if (error) {
      results.push({ ok: false, error: error.message });
    } else {
      results.push(data);
    }
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "zpos-zalo-webhook" });
}
