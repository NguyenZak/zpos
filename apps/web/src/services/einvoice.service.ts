import { createClient } from "@/utils/supabase/client";
import { getActiveOrganizationId } from "@/services/pos.service";

export type EInvoiceProvider =
  | "vnpt"
  | "viettel"
  | "misa"
  | "mobifone"
  | "easyinvoice"
  | "manual"
  | "demo";

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "issued"
  | "sent"
  | "cancelled"
  | "replaced"
  | "adjusted"
  | "failed";

export interface TaxSettings {
  id?: string;
  tenant_id?: string;
  company_name: string;
  tax_code: string;
  legal_address?: string | null;
  district?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
  representative_name?: string | null;
  representative_title?: string | null;
  default_vat_rate?: number | null;
  default_currency?: string | null;
  invoice_template?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EInvoiceConfig {
  id: string;
  tenant_id: string;
  provider: EInvoiceProvider;
  is_active: boolean;
  is_default: boolean;
  api_base_url?: string | null;
  api_username?: string | null;
  api_password?: string | null;
  api_token?: string | null;
  cert_serial?: string | null;
  invoice_series?: string | null;
  invoice_template_code?: string | null;
  current_invoice_no?: number;
  auto_issue_on_payment: boolean;
  send_to_customer_email: boolean;
  extra_config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceLineItem {
  name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  vat_rate?: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  order_id?: string | null;
  config_id?: string | null;
  buyer_name?: string | null;
  buyer_tax_code?: string | null;
  buyer_address?: string | null;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  invoice_series?: string | null;
  invoice_template_code?: string | null;
  invoice_no?: string | null;
  invoice_date?: string | null;
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  items: InvoiceLineItem[];
  status: InvoiceStatus;
  provider: EInvoiceProvider;
  provider_invoice_id?: string | null;
  provider_lookup_code?: string | null;
  provider_pdf_url?: string | null;
  provider_xml_url?: string | null;
  signed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_reason?: string | null;
  notes?: string | null;
  error_message?: string | null;
  provider_payload?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface IssueInvoiceInput {
  orderId?: string;
  buyer: {
    name?: string;
    tax_code?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceLineItem[];
  vatRate?: number;
  notes?: string;
}

export interface IssueResult {
  ok: boolean;
  invoice?: Invoice;
  error?: string;
}

// =====================================================================
// Provider Adapters
// Each adapter knows how to call its own backend API to sign + persist a
// legal invoice number. For now we ship two safe adapters:
//   - "demo"   : simulated provider for development & UAT
//   - "manual" : record-keeping only (user pastes invoice number from
//                external eInvoice software like VNPT desktop client).
// VNPT/Viettel/Misa adapters are stubs that throw with a clear message
// until real credentials are configured.
// =====================================================================

interface ProviderAdapter {
  issue(config: EInvoiceConfig, invoice: Invoice): Promise<{
    invoice_no: string;
    provider_invoice_id?: string;
    provider_lookup_code?: string;
    provider_pdf_url?: string;
    provider_xml_url?: string;
    payload?: Record<string, any>;
  }>;
  cancel?(
    config: EInvoiceConfig,
    invoice: Invoice,
    reason: string,
  ): Promise<{ ok: true }>;
}

const demoAdapter: ProviderAdapter = {
  async issue(config, invoice) {
    // Simulate a small network delay + return a fake but realistic invoice number
    await new Promise((r) => setTimeout(r, 600));
    const series = config.invoice_series || "K23TYY";
    const no = String(
      (config.current_invoice_no || 0) + Math.floor(Math.random() * 1000) + 1,
    ).padStart(7, "0");
    return {
      invoice_no: no,
      provider_invoice_id: `DEMO-${Date.now()}`,
      provider_lookup_code: `LK${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      provider_pdf_url: `https://demo.einvoice.local/pdf/${invoice.id}.pdf`,
      provider_xml_url: `https://demo.einvoice.local/xml/${invoice.id}.xml`,
      payload: { simulated: true, series, no },
    };
  },
  async cancel() {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true };
  },
};

const manualAdapter: ProviderAdapter = {
  async issue(_config, invoice) {
    // Manual mode just records what the user entered; the caller is
    // expected to have set `provider_invoice_id` & `invoice_no` already.
    return {
      invoice_no: invoice.invoice_no || "",
      provider_invoice_id: invoice.provider_invoice_id || undefined,
      payload: { mode: "manual" },
    };
  },
};

function notConfigured(name: string): ProviderAdapter {
  return {
    async issue() {
      throw new Error(
        `Provider "${name}" chưa được tích hợp đầy đủ. Hãy cài đặt thông tin xác thực API hoặc dùng tạm chế độ "manual".`,
      );
    },
  };
}

const ADAPTERS: Record<EInvoiceProvider, ProviderAdapter> = {
  demo: demoAdapter,
  manual: manualAdapter,
  vnpt: notConfigured("VNPT"),
  viettel: notConfigured("Viettel"),
  misa: notConfigured("MISA"),
  mobifone: notConfigured("MobiFone"),
  easyinvoice: notConfigured("EasyInvoice"),
};

// =====================================================================
// Service
// =====================================================================

export const einvoiceService = {
  // -------------------- Tax Settings --------------------
  async getTaxSettings(): Promise<TaxSettings | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("tax_settings")
      .select("*")
      .eq("tenant_id", orgId)
      .maybeSingle();
    return (data as TaxSettings) || null;
  },

  async saveTaxSettings(s: TaxSettings): Promise<TaxSettings> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const payload = {
      ...s,
      tenant_id: orgId,
      company_name: (s.company_name || "").trim(),
      tax_code: (s.tax_code || "").replace(/\s+/g, ""),
    };
    const { data, error } = await supabase
      .from("tax_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select()
      .single();
    if (error) throw error;
    return data as TaxSettings;
  },

  // -------------------- Provider Configs --------------------
  async listConfigs(): Promise<EInvoiceConfig[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("einvoice_configs")
      .select("*")
      .eq("tenant_id", orgId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("listConfigs failed:", error.message);
      return [];
    }
    return (data || []) as EInvoiceConfig[];
  },

  async getDefaultConfig(): Promise<EInvoiceConfig | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("einvoice_configs")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as EInvoiceConfig) || null;
  },

  async saveConfig(
    config: Partial<EInvoiceConfig> & { id?: string },
  ): Promise<EInvoiceConfig> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    if (config.is_default) {
      await supabase
        .from("einvoice_configs")
        .update({ is_default: false })
        .eq("tenant_id", orgId);
    }

    const payload = { ...config, tenant_id: orgId };

    if (config.id) {
      const { data, error } = await supabase
        .from("einvoice_configs")
        .update(payload)
        .eq("id", config.id)
        .eq("tenant_id", orgId)
        .select()
        .single();
      if (error) throw error;
      return data as EInvoiceConfig;
    }

    const { data, error } = await supabase
      .from("einvoice_configs")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as EInvoiceConfig;
  },

  async deleteConfig(id: string): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { error } = await supabase
      .from("einvoice_configs")
      .delete()
      .eq("id", id)
      .eq("tenant_id", orgId);
    if (error) throw error;
  },

  // -------------------- Invoices --------------------
  async listInvoices(opts?: {
    status?: InvoiceStatus | "all";
    fromDate?: string;
    toDate?: string;
    limit?: number;
    search?: string;
  }): Promise<Invoice[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let q = supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", orgId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 100);
    if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
    if (opts?.fromDate) q = q.gte("invoice_date", opts.fromDate);
    if (opts?.toDate) q = q.lte("invoice_date", opts.toDate);
    if (opts?.search) {
      q = q.or(
        `buyer_name.ilike.%${opts.search}%,invoice_no.ilike.%${opts.search}%,buyer_tax_code.ilike.%${opts.search}%`,
      );
    }
    const { data, error } = await q;
    if (error) {
      console.warn("listInvoices failed:", error.message);
      return [];
    }
    return (data || []) as Invoice[];
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("id", id)
      .maybeSingle();
    return (data as Invoice) || null;
  },

  async getInvoiceForOrder(orderId: string): Promise<Invoice | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Invoice) || null;
  },

  /**
   * Issue an invoice for an order. Steps:
   *  1. Load tax settings & default config
   *  2. Build invoice row (status=pending), insert into DB
   *  3. Call provider adapter.issue()
   *  4. On success, update row with invoice_no + provider URLs + status=issued
   *  5. On failure, set status=failed + error_message
   */
  async issueInvoice(input: IssueInvoiceInput): Promise<IssueResult> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();

    const [tax, config] = await Promise.all([
      this.getTaxSettings(),
      this.getDefaultConfig(),
    ]);

    if (!tax || !tax.tax_code) {
      return {
        ok: false,
        error:
          "Chưa cấu hình thông tin thuế. Vào Cài đặt → Hoá đơn điện tử để khai báo MST trước.",
      };
    }
    if (!config) {
      return {
        ok: false,
        error:
          "Chưa cấu hình nhà cung cấp HĐĐT. Vào Cài đặt → Hoá đơn điện tử để thêm provider.",
      };
    }

    const vatRate = input.vatRate ?? tax.default_vat_rate ?? 0;
    const subtotal = input.items.reduce(
      (s, it) => s + Number(it.unit_price) * Number(it.quantity),
      0,
    );
    const discount = input.items.reduce(
      (s, it) => s + Number(it.discount_amount || 0),
      0,
    );
    const taxable = subtotal - discount;
    const vatAmount = Math.round((taxable * vatRate) / 100);
    const total = taxable + vatAmount;

    // 1. Create the invoice row in "pending" status so it shows up immediately
    const { data: created, error: createErr } = await supabase
      .from("invoices")
      .insert([
        {
          tenant_id: orgId,
          order_id: input.orderId || null,
          config_id: config.id,
          buyer_name: input.buyer?.name || null,
          buyer_tax_code: input.buyer?.tax_code || null,
          buyer_address: input.buyer?.address || null,
          buyer_email: input.buyer?.email || null,
          buyer_phone: input.buyer?.phone || null,
          invoice_series: config.invoice_series || null,
          invoice_template_code: config.invoice_template_code || null,
          subtotal,
          discount_amount: discount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: total,
          currency: tax.default_currency || "VND",
          items: input.items,
          status: "pending",
          provider: config.provider,
          notes: input.notes || null,
        },
      ])
      .select()
      .single();

    if (createErr || !created) {
      return {
        ok: false,
        error: `Không tạo được hoá đơn: ${createErr?.message || "lỗi không xác định"}`,
      };
    }

    // 2. Call the provider adapter
    const adapter = ADAPTERS[config.provider] || notConfigured(config.provider);
    try {
      const res = await adapter.issue(config, created as Invoice);

      const update: Partial<Invoice> & { provider_payload?: any } = {
        invoice_no: res.invoice_no,
        provider_invoice_id: res.provider_invoice_id || null,
        provider_lookup_code: res.provider_lookup_code || null,
        provider_pdf_url: res.provider_pdf_url || null,
        provider_xml_url: res.provider_xml_url || null,
        signed_at: new Date().toISOString(),
        status: "issued",
        provider_payload: res.payload || {},
      };

      const { data: updated, error: updErr } = await supabase
        .from("invoices")
        .update(update)
        .eq("id", created.id)
        .select()
        .single();
      if (updErr) {
        return { ok: false, error: updErr.message, invoice: created as Invoice };
      }

      // 3. Link the invoice back to the order for quick lookup
      if (input.orderId) {
        await supabase
          .from("orders")
          .update({ invoice_id: created.id })
          .eq("id", input.orderId);
      }

      return { ok: true, invoice: updated as Invoice };
    } catch (e: any) {
      const msg = e?.message || String(e);
      await supabase
        .from("invoices")
        .update({
          status: "failed",
          error_message: msg,
        })
        .eq("id", created.id);
      return { ok: false, error: msg, invoice: created as Invoice };
    }
  },

  async cancelInvoice(id: string, reason: string): Promise<{ ok: boolean; error?: string }> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data: inv } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", orgId)
      .maybeSingle();
    if (!inv) return { ok: false, error: "Không tìm thấy hoá đơn" };

    const adapter = ADAPTERS[inv.provider as EInvoiceProvider];
    try {
      if (adapter?.cancel) await adapter.cancel(inv as any, inv as Invoice, reason);
      const { error } = await supabase
        .from("invoices")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_reason: reason,
        })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  // Convenience helper for the POS — build line items from an order's cart.
  buildItemsFromCart(
    cart: Array<{ name: string; quantity: number; price: number }>,
    vatRate = 0,
  ): InvoiceLineItem[] {
    return cart.map((c) => ({
      name: c.name,
      quantity: c.quantity,
      unit_price: c.price,
      vat_rate: vatRate,
      total: c.quantity * c.price,
    }));
  },
};
