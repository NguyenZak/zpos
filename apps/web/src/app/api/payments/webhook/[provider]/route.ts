import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

// We deliberately use the anon key + a SECURITY DEFINER RPC so this
// endpoint works without a service role key on the server.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface Normalized {
  external_id: string | null;
  amount: number;
  description: string | null;
  reference_code: string | null;
  transfer_type: "in" | "out";
  counterparty_name: string | null;
  counterparty_account: string | null;
}

// ---------- Provider Adapters ----------

function normalizeSepay(body: any): Normalized {
  // Sepay webhook example:
  // { id, gateway, transactionDate, accountNumber, code, content,
  //   transferType: 'in'|'out', transferAmount, accumulated,
  //   subAccount, referenceCode, description }
  return {
    external_id: body.id != null ? String(body.id) : body.referenceCode || null,
    amount: Number(body.transferAmount ?? body.amount ?? 0),
    description: body.content || body.description || null,
    reference_code: body.code || body.referenceCode || null,
    transfer_type: body.transferType === "out" ? "out" : "in",
    counterparty_name: body.counterAccountName || null,
    counterparty_account: body.counterAccountNumber || null,
  };
}

function normalizeCasso(item: any): Normalized {
  // Casso webhook example:
  // { id, tid, description, amount, when, bank_sub_acc_id,
  //   corresponsive_name, corresponsive_account, corresponsive_bank_id }
  // Casso amount may be negative for outgoing; we treat sign as direction.
  const amt = Number(item.amount ?? 0);
  return {
    external_id: item.tid != null ? String(item.tid) : item.id != null ? String(item.id) : null,
    amount: Math.abs(amt),
    description: item.description || null,
    reference_code: extractReference(item.description),
    transfer_type: amt < 0 ? "out" : "in",
    counterparty_name: item.corresponsive_name || null,
    counterparty_account: item.corresponsive_account || null,
  };
}

function normalizeGeneric(body: any): Normalized {
  return {
    external_id: body.transaction_id || body.id || null,
    amount: Number(body.amount ?? 0),
    description: body.description || body.memo || null,
    reference_code: body.reference || body.reference_code || extractReference(body.description),
    transfer_type: body.transfer_type === "out" ? "out" : "in",
    counterparty_name: body.counterparty_name || null,
    counterparty_account: body.counterparty_account || null,
  };
}

/** Find an alphanumeric reference code (e.g. "ZPOS25051712340000ABCDEF") inside
 *  a free-form bank memo. We look for the typical ZPOS pattern first, then any
 *  long uppercase alphanumeric run. */
function extractReference(text?: string | null): string | null {
  if (!text) return null;
  const upper = String(text).toUpperCase();
  // Project-style prefix match
  const m1 = upper.match(/[A-Z]{2,8}\d{10}[A-Z0-9]{4,8}/);
  if (m1) return m1[0];
  // Generic fallback: long alphanumeric token >= 12 chars
  const m2 = upper.match(/\b[A-Z0-9]{12,}\b/);
  return m2 ? m2[0] : null;
}

// ---------- Auth helpers ----------

function getAuthToken(req: Request): string {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("apikey ")) return auth.slice(7).trim();
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return (req.headers.get("secure-token") || req.headers.get("x-webhook-secret") || auth || "").trim();
}

// ---------- Route handler ----------

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const bankAccountId = url.searchParams.get("account") || "";

  if (!bankAccountId) {
    return NextResponse.json({ ok: false, error: "missing_account_param" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Build the list of transactions to process
  const items: any[] = (() => {
    if (provider === "casso") {
      // Casso wraps transactions in { error, data: [...] }
      if (Array.isArray(body?.data)) return body.data;
      if (Array.isArray(body)) return body;
      return [body];
    }
    return Array.isArray(body) ? body : [body];
  })();

  const token = getAuthToken(req);
  const supabase = adminClient();
  const results: any[] = [];

  for (const raw of items) {
    let n: Normalized;
    switch (provider) {
      case "sepay":
        n = normalizeSepay(raw);
        break;
      case "casso":
        n = normalizeCasso(raw);
        break;
      case "generic":
        n = normalizeGeneric(raw);
        break;
      default:
        return NextResponse.json({ ok: false, error: `unknown_provider:${provider}` }, { status: 400 });
    }

    if (!Number.isFinite(n.amount) || n.amount <= 0) {
      results.push({ ok: false, error: "invalid_amount" });
      continue;
    }

    const { data, error } = await supabase.rpc("record_payment_webhook", {
      p_bank_account_id: bankAccountId,
      p_webhook_secret: token,
      p_provider: provider,
      p_external_id: n.external_id,
      p_amount: n.amount,
      p_reference_code: n.reference_code,
      p_description: n.description,
      p_transfer_type: n.transfer_type,
      p_counterparty_name: n.counterparty_name,
      p_counterparty_account: n.counterparty_account,
      p_raw_payload: raw,
    });

    if (error) {
      console.error("record_payment_webhook RPC error:", error);
      results.push({ ok: false, error: error.message });
      continue;
    }

    if (data && (data as any).error === "invalid_secret") {
      return NextResponse.json({ ok: false, error: "invalid_secret" }, { status: 401 });
    }
    if (data && (data as any).error === "bank_account_not_found") {
      return NextResponse.json({ ok: false, error: "bank_account_not_found" }, { status: 404 });
    }
    results.push(data);
  }

  return NextResponse.json({ ok: true, results });
}

// Allow webhook providers that send a GET ping during setup
export async function GET() {
  return NextResponse.json({ ok: true, service: "zpos-payment-webhook" });
}
