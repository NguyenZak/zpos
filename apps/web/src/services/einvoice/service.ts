/**
 * ZPOS eInvoice — Main Service v2
 * Backward-compatible với einvoice.service.ts cũ
 */

import { createClient } from "@/utils/supabase/client";
import { getActiveOrganizationId } from "@/services/pos.service";
import { getProvider } from "./registry";
import type {
  TaxSettings,
  EInvoiceConfig,
  Invoice,
  InvoiceItem,
  InvoiceLog,
  InvoiceStatus,
  IssueInvoiceInput,
  IssueResult,
  CancelResult,
  AdjustResult,
  EInvoiceProviderName,
} from "./types";

export type { TaxSettings, EInvoiceConfig, Invoice, InvoiceItem, InvoiceLog, InvoiceStatus };
export type { EInvoiceProviderName as EInvoiceProvider };

// ─── Tax Settings ────────────────────────────────────────────────────────────

async function getTaxSettings(): Promise<TaxSettings | null> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { data } = await supabase.from("tax_settings").select("*").eq("tenant_id", orgId).maybeSingle();
  return (data as TaxSettings) || null;
}

async function saveTaxSettings(s: TaxSettings): Promise<TaxSettings> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const payload = { ...s, tenant_id: orgId };
  const { data, error } = await supabase
    .from("tax_settings")
    .upsert(payload, { onConflict: "tenant_id" })
    .select()
    .single();
  if (error) throw error;
  return data as TaxSettings;
}

// ─── Provider Configs ─────────────────────────────────────────────────────────

async function listConfigs(): Promise<EInvoiceConfig[]> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { data, error } = await supabase
    .from("einvoice_configs")
    .select("*")
    .eq("tenant_id", orgId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("listConfigs:", error.message);
    return [];
  }
  return (data || []) as EInvoiceConfig[];
}

async function getDefaultConfig(branchId?: string): Promise<EInvoiceConfig | null> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  let q = supabase
    .from("einvoice_configs")
    .select("*")
    .eq("tenant_id", orgId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (branchId) {
    q = supabase
      .from("einvoice_configs")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("is_active", true)
      .eq("branch_id", branchId)
      .order("is_default", { ascending: false })
      .limit(1);
  }
  const { data } = await q.maybeSingle();
  // Fallback to global default if no branch-specific config
  if (!data && branchId) return getDefaultConfig();
  return (data as EInvoiceConfig) || null;
}

async function saveConfig(config: Partial<EInvoiceConfig> & { id?: string }): Promise<EInvoiceConfig> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  if (config.is_default) {
    await supabase.from("einvoice_configs").update({ is_default: false }).eq("tenant_id", orgId);
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
  const { data, error } = await supabase.from("einvoice_configs").insert([payload]).select().single();
  if (error) throw error;
  return data as EInvoiceConfig;
}

async function deleteConfig(id: string): Promise<void> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { error } = await supabase.from("einvoice_configs").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) throw error;
}

async function testConnection(configId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { data } = await supabase
    .from("einvoice_configs")
    .select("*")
    .eq("id", configId)
    .eq("tenant_id", orgId)
    .maybeSingle();
  if (!data) return { ok: false, message: "Không tìm thấy cấu hình" };
  try {
    const provider = getProvider(data.provider);
    if (provider.testConnection) return provider.testConnection(data as EInvoiceConfig);
    return { ok: true, message: "Provider không hỗ trợ test connection" };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Lỗi không xác định" };
  }
}

// ─── Invoice CRUD ─────────────────────────────────────────────────────────────

async function listInvoices(opts?: {
  status?: InvoiceStatus | "all";
  fromDate?: string;
  toDate?: string;
  limit?: number;
  search?: string;
  branchId?: string;
}): Promise<Invoice[]> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  let q = supabase
    .from("invoices")
    .select("*")
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts?.fromDate) q = q.gte("invoice_date", opts.fromDate);
  if (opts?.toDate) q = q.lte("invoice_date", opts.toDate);
  if (opts?.branchId) q = q.eq("branch_id", opts.branchId);
  if (opts?.search) {
    q = q.or(
      `buyer_name.ilike.%${opts.search}%,invoice_no.ilike.%${opts.search}%,buyer_tax_code.ilike.%${opts.search}%,lookup_code.ilike.%${opts.search}%`,
    );
  }
  const { data, error } = await q;
  if (error) {
    console.warn("listInvoices:", error.message);
    return [];
  }
  return (data || []) as Invoice[];
}

async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { data } = await supabase.from("invoices").select("*").eq("tenant_id", orgId).eq("id", id).maybeSingle();
  return (data as Invoice) || null;
}

async function getInvoiceForOrder(orderId: string): Promise<Invoice | null> {
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
}

async function getInvoiceLogs(invoiceId: string): Promise<InvoiceLog[]> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { data } = await supabase
    .from("invoice_logs")
    .select("*")
    .eq("tenant_id", orgId)
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  return (data || []) as InvoiceLog[];
}

async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const supabase = createClient();
  const { data } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId);
  return (data || []) as InvoiceItem[];
}

// ─── Write audit log ──────────────────────────────────────────────────────────
async function writeLog(
  supabase: ReturnType<typeof createClient>,
  params: {
    tenant_id: string;
    invoice_id: string;
    action: string;
    status_before?: string;
    status_after?: string;
    message?: string;
    request_payload?: any;
    response_payload?: any;
    created_by?: string;
  },
) {
  try {
    await supabase.from("invoice_logs").insert([params]);
  } catch (_) {
    // Non-blocking — log failures must not break the main flow
  }
}

// ─── Issue Invoice ────────────────────────────────────────────────────────────

async function issueInvoice(input: IssueInvoiceInput): Promise<IssueResult> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();

  const [tax, config] = await Promise.all([
    getTaxSettings(),
    input.configId
      ? supabase
          .from("einvoice_configs")
          .select("*")
          .eq("id", input.configId)
          .maybeSingle()
          .then((r) => r.data as EInvoiceConfig)
      : getDefaultConfig(input.branchId),
  ]);

  if (!tax?.tax_code) return { ok: false, error: "Chưa cấu hình MST. Vào Cài đặt → Hoá đơn điện tử." };
  if (!config) return { ok: false, error: "Chưa cấu hình nhà cung cấp HĐĐT. Vào Cài đặt → Hoá đơn điện tử." };

  const vatRate = input.vatRate ?? tax.default_vat_rate ?? 0;
  const items: InvoiceItem[] = input.items.map((it) => {
    const lineTotal = it.unit_price * it.quantity - (it.discount_amount || 0);
    const itemVat = it.vat_rate ?? vatRate;
    const taxAmt = Math.round((lineTotal * itemVat) / 100);
    return { ...it, tax_rate: itemVat, tax_amount: taxAmt, line_total: lineTotal };
  });
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const discount = items.reduce((s, it) => s + (it.discount_amount || 0), 0);
  const taxable = subtotal - discount;
  const vatAmount = Math.round((taxable * vatRate) / 100);
  const total = taxable + vatAmount;

  // Create pending invoice row
  const { data: created, error: createErr } = await supabase
    .from("invoices")
    .insert([
      {
        tenant_id: orgId,
        branch_id: input.branchId || null,
        order_id: input.orderId || null,
        customer_id: input.customerId || null,
        config_id: config.id,
        invoice_type: input.invoiceType || (input.buyer.tax_code ? "B2B" : "B2C"),
        buyer_name: input.buyer.name || null,
        buyer_tax_code: input.buyer.tax_code || null,
        buyer_address: input.buyer.address || null,
        buyer_email: input.buyer.email || null,
        buyer_phone: input.buyer.phone || null,
        invoice_series: config.invoice_series || null,
        invoice_template_code: config.invoice_template_code || null,
        subtotal,
        discount_amount: discount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: total,
        currency: tax.default_currency || "VND",
        payment_method: input.paymentMethod || null,
        items: items, // legacy jsonb
        status: "pending",
        provider: config.provider,
        notes: input.notes || null,
      },
    ])
    .select()
    .single();

  if (createErr || !created) {
    return { ok: false, error: `Không tạo được hoá đơn: ${createErr?.message}` };
  }

  // Save line items to invoice_items table
  if (items.length > 0) {
    await supabase.from("invoice_items").insert(items.map((it) => ({ ...it, invoice_id: created.id })));
  }

  // Call provider
  const provider = getProvider(config.provider);
  try {
    const res = await provider.createInvoice({ config, taxProfile: tax, invoice: created as Invoice, items });

    const update = {
      invoice_no: res.invoice_no,
      invoice_series: res.invoice_series || config.invoice_series,
      provider_invoice_id: res.provider_invoice_id || null,
      tax_authority_code: res.tax_authority_code || null,
      lookup_code: res.lookup_code || null,
      lookup_url: res.lookup_url || null,
      qr_code_url: res.qr_code_url || null,
      provider_pdf_url: res.pdf_url || null,
      provider_xml_url: res.xml_url || null,
      provider_lookup_code: res.lookup_code || null,
      signed_at: new Date().toISOString(),
      status: "issued" as InvoiceStatus,
      raw_response: res.raw_response || null,
    };
    const { data: updated, error: updErr } = await supabase
      .from("invoices")
      .update(update)
      .eq("id", created.id)
      .select()
      .single();

    if (updErr) return { ok: false, error: updErr.message, invoice: created as Invoice };

    // Link order → invoice
    if (input.orderId) {
      await supabase
        .from("orders")
        .update({ invoice_id: created.id, invoice_status: "issued" })
        .eq("id", input.orderId);
    }

    // Write audit log
    await writeLog(supabase, {
      tenant_id: orgId,
      invoice_id: created.id,
      action: "issue",
      status_before: "pending",
      status_after: "issued",
      message: `Phát hành qua ${config.provider}`,
      response_payload: res.raw_response,
    });

    return { ok: true, invoice: updated as Invoice };
  } catch (e: any) {
    const msg = e?.message || String(e);
    await supabase.from("invoices").update({ status: "failed", error_message: msg }).eq("id", created.id);
    await writeLog(supabase, {
      tenant_id: orgId,
      invoice_id: created.id,
      action: "issue_failed",
      status_before: "pending",
      status_after: "failed",
      message: msg,
    });
    return { ok: false, error: msg, invoice: created as Invoice };
  }
}

// ─── Cancel Invoice ───────────────────────────────────────────────────────────

async function cancelInvoice(id: string, reason: string): Promise<CancelResult> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).eq("tenant_id", orgId).maybeSingle();
  if (!inv) return { ok: false, error: "Không tìm thấy hoá đơn" };
  if (!["issued", "sent", "sent_to_tax", "synced"].includes(inv.status)) {
    return { ok: false, error: `Không thể hủy hoá đơn ở trạng thái "${inv.status}"` };
  }

  const config = await getDefaultConfig();
  if (config) {
    try {
      const provider = getProvider(inv.provider);
      await provider.cancelInvoice({ config, invoice: inv as Invoice, reason });
    } catch (_) {
      /* provider cancel is best-effort */
    }
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await writeLog(supabase, {
    tenant_id: orgId,
    invoice_id: id,
    action: "cancel",
    status_before: inv.status,
    status_after: "cancelled",
    message: `Lý do: ${reason}`,
  });

  return { ok: true };
}

// ─── Adjust Invoice ───────────────────────────────────────────────────────────

async function adjustInvoice(id: string, note: string): Promise<AdjustResult> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const [inv, tax, config] = await Promise.all([getInvoice(id), getTaxSettings(), getDefaultConfig()]);
  if (!inv) return { ok: false, error: "Không tìm thấy hoá đơn" };
  if (!tax || !config) return { ok: false, error: "Chưa cấu hình thuế/provider" };

  const items = await getInvoiceItems(id);
  try {
    const provider = getProvider(config.provider);
    const res = await provider.adjustInvoice({
      config,
      taxProfile: tax,
      originalInvoice: inv,
      adjustmentNote: note,
      items,
    });

    // Create adjustment invoice record
    const { data: adjInvoice, error: adjErr } = await supabase
      .from("invoices")
      .insert([
        {
          tenant_id: orgId,
          order_id: inv.order_id,
          config_id: config.id,
          invoice_type: "ADJUST",
          buyer_name: inv.buyer_name,
          buyer_tax_code: inv.buyer_tax_code,
          buyer_address: inv.buyer_address,
          buyer_email: inv.buyer_email,
          invoice_series: res.invoice_series || config.invoice_series,
          invoice_no: res.invoice_no,
          subtotal: inv.subtotal,
          discount_amount: inv.discount_amount,
          vat_rate: inv.vat_rate,
          vat_amount: inv.vat_amount,
          total_amount: inv.total_amount,
          currency: inv.currency,
          items: items,
          status: "issued",
          provider: config.provider,
          provider_invoice_id: res.provider_invoice_id,
          lookup_code: res.lookup_code,
          lookup_url: res.lookup_url,
          notes: `Điều chỉnh HĐ ${inv.invoice_series}/${inv.invoice_no}: ${note}`,
          replaced_by_id: inv.id,
        },
      ])
      .select()
      .single();

    if (adjErr) return { ok: false, error: adjErr.message };

    // Mark original as adjusted
    await supabase.from("invoices").update({ status: "adjusted", adjusted_at: new Date().toISOString() }).eq("id", id);
    await writeLog(supabase, {
      tenant_id: orgId,
      invoice_id: id,
      action: "adjust",
      status_before: inv.status,
      status_after: "adjusted",
      message: note,
    });

    return { ok: true, newInvoice: adjInvoice as Invoice };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Điều chỉnh thất bại" };
  }
}

// ─── Replace Invoice ──────────────────────────────────────────────────────────

async function replaceInvoice(id: string, input: IssueInvoiceInput): Promise<AdjustResult> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const [inv, tax, config] = await Promise.all([getInvoice(id), getTaxSettings(), getDefaultConfig()]);
  if (!inv || !tax || !config) return { ok: false, error: "Thiếu dữ liệu để thay thế HĐ" };

  const items: InvoiceItem[] = input.items.map((it) => ({
    ...it,
    tax_rate: it.vat_rate ?? inv.vat_rate,
    tax_amount: 0,
    line_total: it.unit_price * it.quantity - (it.discount_amount || 0),
  }));

  try {
    const provider = getProvider(config.provider);
    const res = await provider.replaceInvoice({
      config,
      taxProfile: tax,
      invoice: { ...inv, ...input.buyer } as Invoice,
      items,
      originalInvoiceNo: inv.invoice_no || "",
      originalInvoiceSeries: inv.invoice_series || "",
    });

    const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    const discount = items.reduce((s, it) => s + (it.discount_amount || 0), 0);
    const vatAmount = Math.round(((subtotal - discount) * inv.vat_rate) / 100);

    const { data: newInv, error: newErr } = await supabase
      .from("invoices")
      .insert([
        {
          tenant_id: orgId,
          order_id: inv.order_id,
          config_id: config.id,
          invoice_type: "REPLACE",
          buyer_name: input.buyer.name || inv.buyer_name,
          buyer_tax_code: input.buyer.tax_code || inv.buyer_tax_code,
          buyer_address: input.buyer.address || inv.buyer_address,
          buyer_email: input.buyer.email || inv.buyer_email,
          invoice_series: res.invoice_series || config.invoice_series,
          invoice_no: res.invoice_no,
          subtotal,
          discount_amount: discount,
          vat_rate: inv.vat_rate,
          vat_amount: vatAmount,
          total_amount: subtotal - discount + vatAmount,
          currency: inv.currency,
          items,
          status: "issued",
          provider: config.provider,
          provider_invoice_id: res.provider_invoice_id,
          lookup_code: res.lookup_code,
          lookup_url: res.lookup_url,
          notes: `Thay thế HĐ ${inv.invoice_series}/${inv.invoice_no}`,
          replaced_by_id: inv.id,
        },
      ])
      .select()
      .single();

    if (newErr) return { ok: false, error: newErr.message };

    await supabase.from("invoices").update({ status: "replaced", replaced_at: new Date().toISOString() }).eq("id", id);
    await writeLog(supabase, {
      tenant_id: orgId,
      invoice_id: id,
      action: "replace",
      status_before: inv.status,
      status_after: "replaced",
      message: `Thay thế bằng HĐ ${res.invoice_no}`,
    });

    return { ok: true, newInvoice: newInv as Invoice };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Thay thế thất bại" };
  }
}

// ─── Sync status ──────────────────────────────────────────────────────────────

async function syncInvoiceStatus(id: string): Promise<{ ok: boolean; status?: InvoiceStatus; error?: string }> {
  const supabase = createClient();
  const orgId = await getActiveOrganizationId();
  const inv = await getInvoice(id);
  if (!inv || inv.tenant_id !== orgId) return { ok: false, error: "Không tìm thấy HĐ" };
  const config = await getDefaultConfig();
  if (!config) return { ok: false, error: "Chưa có cấu hình provider" };

  try {
    const provider = getProvider(inv.provider);
    const res = await provider.getInvoiceStatus({
      config,
      invoiceNo: inv.invoice_no || "",
      invoiceSeries: inv.invoice_series || undefined,
      providerInvoiceId: inv.provider_invoice_id || undefined,
    });
    const newStatus = res.status === inv.status ? ("synced" as InvoiceStatus) : res.status;
    await supabase
      .from("invoices")
      .update({
        status: newStatus,
        tax_authority_code: res.taxAuthorityCode || inv.tax_authority_code,
        lookup_url: res.lookupUrl || inv.lookup_url,
      })
      .eq("id", id);
    await writeLog(supabase, {
      tenant_id: orgId,
      invoice_id: id,
      action: "sync",
      status_before: inv.status,
      status_after: newStatus,
      message: "Đồng bộ trạng thái từ provider",
    });
    return { ok: true, status: newStatus };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildItemsFromCart(
  cart: Array<{ name: string; quantity: number; price: number; discount?: number }>,
  vatRate = 0,
): IssueInvoiceInput["items"] {
  return cart.map((c) => ({
    product_name: c.name,
    quantity: c.quantity,
    unit_price: c.price,
    discount_amount: c.discount || 0,
    vat_rate: vatRate,
    line_total: c.quantity * c.price - (c.discount || 0),
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const einvoiceService = {
  getTaxSettings,
  saveTaxSettings,
  listConfigs,
  getDefaultConfig,
  saveConfig,
  deleteConfig,
  testConnection,
  listInvoices,
  getInvoice,
  getInvoiceForOrder,
  getInvoiceLogs,
  getInvoiceItems,
  issueInvoice,
  cancelInvoice,
  adjustInvoice,
  replaceInvoice,
  syncInvoiceStatus,
  buildItemsFromCart,
};
