import { createClient } from "@/utils/supabase/client";
import { getActiveOrganizationId } from "@/services/pos.service";

// ============================================================================
// Types
// ============================================================================

export type DebtTxKind =
  | "charge"
  | "payment"
  | "adjustment"
  | "write_off"
  | "refund";

export type DebtPaymentMethod = "cash" | "transfer" | "card" | "vietqr" | "other";

export type ReminderRule =
  | "upcoming_3d"
  | "upcoming_1d"
  | "on_due"
  | "overdue_1d"
  | "overdue_7d"
  | "overdue_14d"
  | "overdue_30d"
  | "manual"
  | "bulk";

export type ReminderChannel = "zalo" | "sms" | "email" | "print" | "phone";

export interface DebtSettings {
  id?: string;
  tenant_id?: string;
  default_credit_limit: number;
  default_due_days: number;
  late_fee_rate: number;
  allow_over_limit: boolean;
  auto_reminders_enabled: boolean;
  remind_before_due_days: number[];
  remind_after_overdue_days: number[];
  remind_channels: string[];
  block_pos_when_overdue: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreditAccount {
  id: string;
  tenant_id: string;
  customer_id: string;
  credit_limit: number;
  current_balance: number;
  due_amount: number;
  overdue_amount: number;
  due_days: number;
  last_charge_at?: string | null;
  last_payment_at?: string | null;
  last_reminder_at?: string | null;
  block_new_debt: boolean;
  notes?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
}

export interface DebtTransaction {
  id: string;
  tenant_id: string;
  customer_id: string;
  account_id: string;
  kind: DebtTxKind;
  amount: number;
  order_id?: string | null;
  payment_id?: string | null;
  balance_before: number;
  balance_after: number;
  due_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
  created_by?: string | null;
  created_at?: string;
}

export interface DebtPayment {
  id: string;
  tenant_id: string;
  customer_id: string;
  account_id: string;
  payment_no?: string;
  amount: number;
  method: DebtPaymentMethod;
  reference?: string | null;
  payment_date: string;
  bank_account_id?: string | null;
  notes?: string | null;
  receipt_pdf_url?: string | null;
  status: "pending" | "completed" | "cancelled";
  created_by?: string | null;
  created_at?: string;
  allocations?: Array<{ order_id: string; amount: number }>;
}

export interface DebtReminder {
  id: string;
  tenant_id: string;
  customer_id: string;
  account_id: string;
  rule: ReminderRule;
  channel: ReminderChannel;
  amount_at_send?: number;
  template_id?: string | null;
  message?: string | null;
  status: "sent" | "delivered" | "read" | "failed" | "skipped";
  error_message?: string | null;
  zalo_message_id?: string | null;
  sent_by?: string | null;
  created_at?: string;
}

export interface DebtOrder {
  id: string;
  order_number: string;
  total_amount: number;
  debt_amount: number;
  due_date?: string | null;
  payment_status: string;
  created_at: string;
  // computed
  days_overdue?: number;
  age_bucket?: "current" | "0-30" | "31-60" | "61-90" | "90+";
}

export interface DashboardStats {
  totalReceivable: number;
  dueWithin7Days: number;
  overdue: number;
  debtorCount: number;
  utilization: number; // overall % of limits used
}

export interface AgingBucket {
  customer_id: string;
  customer_name: string;
  phone?: string | null;
  current: number; // not yet due
  d0_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
}

// ============================================================================
// Helpers
// ============================================================================

function daysBetween(a: Date, b: Date): number {
  const ms = a.setHours(0, 0, 0, 0) - b.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function bucketOfOrder(o: { due_date?: string | null }): DebtOrder["age_bucket"] {
  if (!o.due_date) return "current";
  const overdue = daysBetween(new Date(), new Date(o.due_date));
  if (overdue <= 0) return "current";
  if (overdue <= 30) return "0-30";
  if (overdue <= 60) return "31-60";
  if (overdue <= 90) return "61-90";
  return "90+";
}

export function daysOverdue(dueDate?: string | null): number {
  if (!dueDate) return 0;
  const d = daysBetween(new Date(), new Date(dueDate));
  return Math.max(d, 0);
}

const DEFAULT_SETTINGS: DebtSettings = {
  default_credit_limit: 5_000_000,
  default_due_days: 30,
  late_fee_rate: 0,
  allow_over_limit: false,
  auto_reminders_enabled: true,
  remind_before_due_days: [3, 1],
  remind_after_overdue_days: [1, 7, 14, 30],
  remind_channels: ["zalo"],
  block_pos_when_overdue: false,
};

// ============================================================================
// Service
// ============================================================================

export const debtService = {
  // -------- Settings --------
  async getSettings(): Promise<DebtSettings> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("debt_settings")
      .select("*")
      .eq("tenant_id", orgId)
      .maybeSingle();
    return (data as DebtSettings) || { ...DEFAULT_SETTINGS };
  },

  async saveSettings(input: DebtSettings): Promise<DebtSettings> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const payload = { ...input, tenant_id: orgId };
    const { data, error } = await supabase
      .from("debt_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select()
      .single();
    if (error) throw error;
    return data as DebtSettings;
  },

  // -------- Credit account per customer --------
  async getCreditAccount(customerId: string): Promise<CreditAccount | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("customer_credit_accounts")
      .select("*, customer:customers(id, name, phone, email)")
      .eq("tenant_id", orgId)
      .eq("customer_id", customerId)
      .maybeSingle();
    return (data as CreditAccount) || null;
  },

  async ensureCreditAccount(customerId: string): Promise<CreditAccount> {
    const existing = await this.getCreditAccount(customerId);
    if (existing) return existing;
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const settings = await this.getSettings();
    const { data, error } = await supabase
      .from("customer_credit_accounts")
      .insert([
        {
          tenant_id: orgId,
          customer_id: customerId,
          credit_limit: settings.default_credit_limit,
          due_days: settings.default_due_days,
        },
      ])
      .select("*, customer:customers(id, name, phone, email)")
      .single();
    if (error) throw error;
    return data as CreditAccount;
  },

  async setCreditLimit(
    customerId: string,
    creditLimit: number,
    dueDays?: number,
  ): Promise<CreditAccount> {
    await this.ensureCreditAccount(customerId);
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const patch: any = { credit_limit: creditLimit };
    if (dueDays != null) patch.due_days = dueDays;
    const { data, error } = await supabase
      .from("customer_credit_accounts")
      .update(patch)
      .eq("tenant_id", orgId)
      .eq("customer_id", customerId)
      .select("*, customer:customers(id, name, phone, email)")
      .single();
    if (error) throw error;
    return data as CreditAccount;
  },

  /** Block / unblock new debt for this customer (e.g. legal hold). */
  async setBlockNewDebt(customerId: string, block: boolean): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { error } = await supabase
      .from("customer_credit_accounts")
      .update({ block_new_debt: block })
      .eq("tenant_id", orgId)
      .eq("customer_id", customerId);
    if (error) throw error;
  },

  // -------- Charge debt (POS integration) --------
  async chargeOrderAsDebt(
    orderId: string,
    dueDays?: number,
  ): Promise<{
    ok: boolean;
    tx_id?: string;
    account_id?: string;
    balance_after?: number;
    due_date?: string;
    over_limit?: boolean;
    error?: string;
  }> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("charge_debt", {
      p_order_id: orderId,
      p_due_days: dueDays ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return (data || { ok: false, error: "no_response" }) as any;
  },

  // -------- Record payment --------
  async recordPayment(input: {
    customerId: string;
    amount: number;
    method: DebtPaymentMethod;
    paymentNo?: string;
    reference?: string;
    notes?: string;
    bankAccountId?: string;
    allocations?: Array<{ order_id: string; amount: number }>;
  }): Promise<{ ok: boolean; payment_id?: string; balance_after?: number; error?: string }> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("record_debt_payment", {
      p_customer_id: input.customerId,
      p_amount: input.amount,
      p_method: input.method,
      p_allocations: input.allocations ?? [],
      p_payment_no: input.paymentNo ?? null,
      p_reference: input.reference ?? null,
      p_notes: input.notes ?? null,
      p_bank_account_id: input.bankAccountId ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return (data || { ok: false, error: "no_response" }) as any;
  },

  // -------- Adjustment --------
  async adjustBalance(input: {
    customerId: string;
    amount: number; // negative reduces debt
    reason: string;
    kind?: "adjustment" | "write_off";
  }): Promise<DebtTransaction> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const account = await this.ensureCreditAccount(input.customerId);
    const before = Number(account.current_balance || 0);
    const after = before + input.amount;
    const { data, error } = await supabase
      .from("debt_transactions")
      .insert([
        {
          tenant_id: orgId,
          customer_id: input.customerId,
          account_id: account.id,
          kind: input.kind || "adjustment",
          amount: input.amount,
          balance_before: before,
          balance_after: after,
          notes: input.reason,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    await supabase
      .from("customer_credit_accounts")
      .update({ current_balance: after })
      .eq("id", account.id);
    return data as DebtTransaction;
  },

  // -------- Reads --------
  async listDebtors(opts?: {
    onlyOverdue?: boolean;
    onlyOverLimit?: boolean;
    search?: string;
    limit?: number;
  }): Promise<CreditAccount[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let q = supabase
      .from("customer_credit_accounts")
      .select("*, customer:customers(id, name, phone, email)")
      .eq("tenant_id", orgId)
      .gt("current_balance", 0)
      .order("current_balance", { ascending: false })
      .limit(opts?.limit ?? 200);
    if (opts?.onlyOverdue) q = q.gt("overdue_amount", 0);
    const { data, error } = await q;
    if (error) {
      console.warn("listDebtors failed:", error.message);
      return [];
    }
    let rows = (data || []) as CreditAccount[];
    if (opts?.onlyOverLimit) {
      rows = rows.filter((r) => Number(r.current_balance) > Number(r.credit_limit || 0));
    }
    if (opts?.search?.trim()) {
      const s = opts.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.customer?.name?.toLowerCase().includes(s) ||
          r.customer?.phone?.includes(s) ||
          r.customer?.email?.toLowerCase().includes(s),
      );
    }
    return rows;
  },

  async getCustomerLedger(
    customerId: string,
    opts?: { fromDate?: string; toDate?: string; limit?: number },
  ): Promise<DebtTransaction[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let q = supabase
      .from("debt_transactions")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 200);
    if (opts?.fromDate) q = q.gte("created_at", opts.fromDate);
    if (opts?.toDate) q = q.lte("created_at", opts.toDate);
    const { data, error } = await q;
    if (error) {
      console.warn("getCustomerLedger failed:", error.message);
      return [];
    }
    return (data || []) as DebtTransaction[];
  },

  async getCustomerDebtOrders(customerId: string): Promise<DebtOrder[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, debt_amount, due_date, payment_status, created_at")
      .eq("organization_id", orgId)
      .eq("customer_id", customerId)
      .in("payment_status", ["debt", "partial_debt", "paid"])
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.warn("getCustomerDebtOrders failed:", error.message);
      return [];
    }
    return (data || []).map((o: any) => ({
      ...o,
      days_overdue: daysOverdue(o.due_date),
      age_bucket: bucketOfOrder({ due_date: o.due_date }),
    })) as DebtOrder[];
  },

  async getCustomerPayments(customerId: string): Promise<DebtPayment[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("debt_payments")
      .select("*, allocations:debt_payment_allocations(order_id, amount)")
      .eq("tenant_id", orgId)
      .eq("customer_id", customerId)
      .order("payment_date", { ascending: false })
      .limit(200);
    if (error) {
      console.warn("getCustomerPayments failed:", error.message);
      return [];
    }
    return (data || []) as DebtPayment[];
  },

  async getCustomerReminders(customerId: string): Promise<DebtReminder[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("debt_reminders")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("getCustomerReminders failed:", error.message);
      return [];
    }
    return (data || []) as DebtReminder[];
  },

  // -------- Dashboard / aging --------
  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    // Refresh first so the numbers are accurate when the dashboard loads
    try {
      await supabase.rpc("refresh_customer_overdue", { p_tenant_id: orgId });
    } catch {
      /* best-effort */
    }
    const { data: accounts } = await supabase
      .from("customer_credit_accounts")
      .select("current_balance, credit_limit, due_amount, overdue_amount")
      .eq("tenant_id", orgId)
      .gt("current_balance", 0);

    const list = (accounts || []) as Array<{
      current_balance: number;
      credit_limit: number;
      due_amount: number;
      overdue_amount: number;
    }>;
    const totalReceivable = list.reduce((s, a) => s + Number(a.current_balance || 0), 0);
    const totalLimit = list.reduce((s, a) => s + Number(a.credit_limit || 0), 0);
    const overdue = list.reduce((s, a) => s + Number(a.overdue_amount || 0), 0);

    // Due within 7 days = orders with due_date within next 7 days, status=debt
    const today = new Date();
    const in7 = new Date(today.getTime() + 7 * 86400000);
    const { data: dueOrders } = await supabase
      .from("orders")
      .select("debt_amount")
      .eq("organization_id", orgId)
      .in("payment_status", ["debt", "partial_debt"])
      .gt("debt_amount", 0)
      .gte("due_date", today.toISOString().slice(0, 10))
      .lte("due_date", in7.toISOString().slice(0, 10));
    const dueWithin7Days = (dueOrders || []).reduce(
      (s: number, o: any) => s + Number(o.debt_amount || 0),
      0,
    );

    return {
      totalReceivable,
      dueWithin7Days,
      overdue,
      debtorCount: list.length,
      utilization: totalLimit > 0 ? Math.round((totalReceivable / totalLimit) * 100) : 0,
    };
  },

  async getAgingReport(): Promise<AgingBucket[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("orders")
      .select("customer_id, debt_amount, due_date, customer:customers(name, phone)")
      .eq("organization_id", orgId)
      .in("payment_status", ["debt", "partial_debt"])
      .gt("debt_amount", 0);

    const grouped = new Map<string, AgingBucket>();
    for (const o of (data || []) as any[]) {
      const cid = o.customer_id;
      if (!cid) continue;
      const bucket = bucketOfOrder({ due_date: o.due_date });
      let row = grouped.get(cid);
      if (!row) {
        row = {
          customer_id: cid,
          customer_name: o.customer?.name || "—",
          phone: o.customer?.phone || null,
          current: 0,
          d0_30: 0,
          d31_60: 0,
          d61_90: 0,
          d90plus: 0,
          total: 0,
        };
        grouped.set(cid, row);
      }
      const amt = Number(o.debt_amount || 0);
      row.total += amt;
      switch (bucket) {
        case "current": row.current += amt; break;
        case "0-30": row.d0_30 += amt; break;
        case "31-60": row.d31_60 += amt; break;
        case "61-90": row.d61_90 += amt; break;
        case "90+": row.d90plus += amt; break;
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  },

  // -------- Reminders --------
  /** Send a reminder via Zalo OA. Falls back to logging-only on failure. */
  async sendReminder(input: {
    customerId: string;
    rule?: ReminderRule;
    channel?: ReminderChannel;
    customMessage?: string;
  }): Promise<DebtReminder> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const account = await this.ensureCreditAccount(input.customerId);
    const rule = input.rule || "manual";
    const channel = input.channel || "zalo";
    const customer = (account as any).customer || {};

    // Try to dispatch via Zalo. Log the attempt regardless of outcome.
    let status: DebtReminder["status"] = "sent";
    let errorMessage: string | null = null;
    let zaloMessageId: string | null = null;

    if (channel === "zalo" && customer.phone) {
      try {
        const res = await fetch("/api/zalo/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: customer.phone,
            templateEvent: "debt_reminder_overdue",
            templateData: {
              customer_name: customer.name || "Quý khách",
              amount_due: new Intl.NumberFormat("vi-VN").format(
                Number(account.current_balance || 0),
              ),
              overdue_amount: new Intl.NumberFormat("vi-VN").format(
                Number(account.overdue_amount || 0),
              ),
              days_overdue: String(daysOverdue(new Date().toISOString().slice(0, 10))),
            },
            customerId: input.customerId,
          }),
        });
        const json = await res.json();
        if (json?.ok) {
          zaloMessageId = json.message?.id || null;
        } else {
          status = "failed";
          errorMessage = json?.error || `HTTP ${res.status}`;
        }
      } catch (e: any) {
        status = "failed";
        errorMessage = e?.message || "Network error";
      }
    }

    const { data, error } = await supabase
      .from("debt_reminders")
      .insert([
        {
          tenant_id: orgId,
          customer_id: input.customerId,
          account_id: account.id,
          rule,
          channel,
          amount_at_send: account.current_balance,
          message: input.customMessage || null,
          status,
          error_message: errorMessage,
          zalo_message_id: zaloMessageId,
        },
      ])
      .select()
      .single();
    if (error) throw error;

    // Touch last_reminder_at on the account
    await supabase
      .from("customer_credit_accounts")
      .update({ last_reminder_at: new Date().toISOString() })
      .eq("id", account.id);

    return data as DebtReminder;
  },

  async bulkSendReminders(
    customerIds: string[],
    channel: ReminderChannel = "zalo",
  ): Promise<{ ok: number; failed: number }> {
    let ok = 0;
    let failed = 0;
    for (const id of customerIds) {
      try {
        const r = await this.sendReminder({ customerId: id, rule: "bulk", channel });
        if (r.status === "failed") failed++;
        else ok++;
      } catch {
        failed++;
      }
    }
    return { ok, failed };
  },

  // -------- Convenience --------
  /** Refresh due/overdue tallies for the active tenant. Cheap, RLS-safe. */
  async refreshOverdue(): Promise<number> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase.rpc("refresh_customer_overdue", {
      p_tenant_id: orgId,
    });
    return Number(data || 0);
  },
};
