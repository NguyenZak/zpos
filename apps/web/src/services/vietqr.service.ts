import { getActiveOrganizationId } from "@/services/pos.service";
import { createClient } from "@/utils/supabase/client";

export type WebhookProvider = "sepay" | "casso" | "generic" | "manual";

export interface BankAccount {
  id: string;
  tenant_id: string;
  bank_id: string;
  bank_name?: string | null;
  bank_short_name?: string | null;
  bank_logo?: string | null;
  account_no: string;
  account_name: string;
  memo_prefix: string;
  is_default: boolean;
  is_active: boolean;
  webhook_provider: WebhookProvider;
  webhook_secret?: string | null;
  webhook_token?: string | null;
  daily_limit?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = "pending" | "paid" | "partial" | "refunded" | "failed" | "cancelled";

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  bank_account_id?: string | null;
  order_id?: string | null;
  provider: string;
  external_id?: string | null;
  reference_code?: string | null;
  amount: number;
  transfer_type: "in" | "out";
  counterparty_name?: string | null;
  counterparty_account?: string | null;
  description?: string | null;
  status: "unmatched" | "matched" | "manual" | "duplicate" | "ignored" | "failed";
  matched_at?: string | null;
  matched_by?: string | null;
  raw_payload?: Record<string, any>;
  received_at?: string;
  created_at?: string;
}

// VietQR open API: https://api.vietqr.io/v2/banks
export interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

const VIETQR_BANK_LIST_URL = "https://api.vietqr.io/v2/banks";
const VIETQR_IMG_BASE = "https://img.vietqr.io/image";

/**
 * Build a VietQR image URL for embedding in checkout UI.
 * `bankId` here can be either the bank "code" (e.g. "VCB") or the BIN number.
 * VietQR accepts either; we prefer BIN where possible for stable URLs.
 */
export function buildVietQRImageUrl(opts: {
  bankBin: string;
  accountNo: string;
  amount: number;
  addInfo?: string;
  accountName?: string;
  template?: "compact" | "compact2" | "qr_only" | "print";
}): string {
  const tpl = opts.template ?? "compact2";
  const params = new URLSearchParams();
  if (opts.amount > 0) params.set("amount", String(Math.round(opts.amount)));
  if (opts.addInfo) params.set("addInfo", opts.addInfo);
  if (opts.accountName) params.set("accountName", opts.accountName);
  return `${VIETQR_IMG_BASE}/${opts.bankBin}-${opts.accountNo}-${tpl}.png?${params.toString()}`;
}

/**
 * Generate a short, unique reference code that becomes the bank transfer memo.
 * Format: <PREFIX><yyMMddHHmm><RAND6> — must remain ≤ 25 chars to fit memo limits.
 */
export function generateReferenceCode(prefix = "ZPOS"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    String(now.getFullYear()).slice(2) +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes());
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const cleanPrefix = (prefix || "ZPOS")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  return `${cleanPrefix}${stamp}${rand}`;
}

export const vietQRService = {
  // -------------------- Bank list (public API) --------------------
  async fetchVietQRBanks(): Promise<VietQRBank[]> {
    try {
      const res = await fetch(VIETQR_BANK_LIST_URL, { cache: "force-cache" });
      const json = await res.json();
      return (json?.data || []) as VietQRBank[];
    } catch (e) {
      console.warn("Failed to load VietQR bank list", e);
      return [];
    }
  },

  // -------------------- Bank Account CRUD --------------------
  async listBankAccounts(): Promise<BankAccount[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("tenant_id", orgId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("listBankAccounts failed:", error.message);
      return [];
    }
    return (data || []) as BankAccount[];
  },

  async getDefaultBankAccount(): Promise<BankAccount | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as BankAccount) || null;
  },

  async saveBankAccount(account: Partial<BankAccount> & { id?: string }): Promise<BankAccount> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    // High-visibility debug logging to diagnose RLS errors
    const { data: { user } } = await supabase.auth.getUser();
    console.log("%c=== ZPOS SAVE BANK ACCOUNT DEBUG ===", "background: #7c3aed; color: white; font-weight: bold; padding: 4px;");
    console.log("Active Organization ID (tenant_id):", orgId);
    console.log("Supabase Authenticated User:", user ? { id: user.id, email: user.email } : "NULL (Anonymous/Not Logged In)");
    console.log("Account Form Data:", account);
    console.log("========================================");

    const payload: Partial<BankAccount> = {
      ...account,
      tenant_id: orgId,
      account_name: (account.account_name || "").toUpperCase().trim(),
      account_no: (account.account_no || "").replace(/\s+/g, ""),
      memo_prefix: (account.memo_prefix || "ZPOS")
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8),
    };

    // If this becomes default, clear other defaults first
    if (payload.is_default) {
      await supabase.from("bank_accounts").update({ is_default: false }).eq("tenant_id", orgId);
    }

    if (account.id) {
      const { data, error } = await supabase
        .from("bank_accounts")
        .update(payload)
        .eq("id", account.id)
        .eq("tenant_id", orgId)
        .select()
        .single();
      if (error) throw error;
      return data as BankAccount;
    }

    // Generate a webhook secret if missing
    if (!payload.webhook_secret) {
      payload.webhook_secret = `whk_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
    }

    const { data, error } = await supabase.from("bank_accounts").insert([payload]).select().single();
    if (error) throw error;
    return data as BankAccount;
  },

  async deleteBankAccount(id: string): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id).eq("tenant_id", orgId);
    if (error) throw error;
  },

  async setDefaultBankAccount(id: string): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    await supabase.from("bank_accounts").update({ is_default: false }).eq("tenant_id", orgId);
    const { error } = await supabase
      .from("bank_accounts")
      .update({ is_default: true })
      .eq("id", id)
      .eq("tenant_id", orgId);
    if (error) throw error;
  },

  // -------------------- Order Payment Tracking --------------------
  /**
   * Attach a payment reference to an order at checkout time, so the
   * incoming bank webhook can be matched back to this order.
   */
  async attachPendingPayment(opts: { orderId: string; bankAccountId: string; referenceCode: string }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "pending",
        payment_reference: opts.referenceCode,
        bank_account_id: opts.bankAccountId,
      })
      .eq("id", opts.orderId);
    if (error) throw error;
  },

  async confirmOrderPaymentManually(orderId: string, amount: number): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const now = new Date().toISOString();

    const { error: updErr } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        payment_confirmed_at: now,
        payment_amount_received: amount,
      })
      .eq("id", orderId);
    if (updErr) throw updErr;

    await supabase.from("payment_transactions").insert([
      {
        tenant_id: orgId,
        order_id: orderId,
        provider: "manual",
        amount: amount,
        transfer_type: "in",
        status: "manual",
        matched_at: now,
        description: "Xác nhận thủ công bởi thu ngân",
      },
    ]);
  },

  /**
   * Subscribe to realtime updates for a specific order's payment_status.
   * Returns an unsubscribe function. Callers should invoke it on cleanup.
   */
  subscribeOrderPayment(orderId: string, onPaid: (order: any) => void): () => void {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-pay-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as any;
          if (next?.payment_status === "paid") onPaid(next);
        },
      )
      .subscribe();
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // best-effort cleanup; channel may already be torn down
      }
    };
  },

  /**
   * Listen for incoming bank transactions in case the order row update is missed
   * (e.g. when reference matching falls back to amount-only matching).
   */
  subscribeReferencePayments(referenceCode: string, onMatch: (tx: PaymentTransaction) => void): () => void {
    const supabase = createClient();
    const channel = supabase
      .channel(`pay-ref-${referenceCode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_transactions",
          filter: `reference_code=eq.${referenceCode}`,
        },
        (payload) => onMatch(payload.new as PaymentTransaction),
      )
      .subscribe();
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // best-effort cleanup; channel may already be torn down
      }
    };
  },

  // -------------------- Transactions list --------------------
  async listTransactions(opts?: {
    status?: PaymentTransaction["status"];
    bankAccountId?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<PaymentTransaction[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let q = supabase
      .from("payment_transactions")
      .select("*")
      .eq("tenant_id", orgId)
      .order("received_at", { ascending: false })
      .limit(opts?.limit ?? 100);
    if (opts?.status) q = q.eq("status", opts.status);
    if (opts?.bankAccountId) q = q.eq("bank_account_id", opts.bankAccountId);
    if (opts?.fromDate) q = q.gte("received_at", opts.fromDate);
    if (opts?.toDate) q = q.lte("received_at", opts.toDate);
    const { data, error } = await q;
    if (error) {
      console.warn("listTransactions failed:", error.message);
      return [];
    }
    return (data || []) as PaymentTransaction[];
  },

  /**
   * Build the public webhook URL the user pastes into Sepay/Casso dashboard.
   * The bank account id is passed in the URL so the webhook handler knows
   * which tenant + secret to validate against.
   */
  buildWebhookUrl(bankAccountId: string, provider: WebhookProvider = "sepay"): string {
    const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "";
    return `${origin}/api/payments/webhook/${provider}?account=${bankAccountId}`;
  },
};
