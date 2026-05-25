import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getProvider } from "@/services/einvoice/registry";
import type { EInvoiceConfig, TaxSettings, Invoice, InvoiceItem, IssueInvoiceInput } from "@/services/einvoice/types";

async function getOrgId(supabase: any): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();
  return data?.organization_id || null;
}

/**
 * POST /api/einvoice/issue
 * Body: IssueInvoiceInput
 * Server-side only — provider API keys never exposed to client
 */
export async function POST(req: NextRequest) {
  try {
    // @ts-ignore — createClient() signature may vary; the server helper handles cookies internally
    const supabase = createClient ? await createClient() : null;
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase init failed" }, { status: 500 });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const orgId = await getOrgId(supabase);
    if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 403 });

    const input: IssueInvoiceInput = await req.json();

    // Load tax settings & config server-side
    const [taxRow, configRow] = await Promise.all([
      supabase.from("tax_settings").select("*").eq("tenant_id", orgId).maybeSingle(),
      input.configId
        ? supabase.from("einvoice_configs").select("*").eq("id", input.configId).eq("tenant_id", orgId).maybeSingle()
        : supabase
            .from("einvoice_configs")
            .select("*")
            .eq("tenant_id", orgId)
            .eq("is_active", true)
            .order("is_default", { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);

    const tax = taxRow.data as TaxSettings;
    const config = configRow.data as EInvoiceConfig;

    if (!tax?.tax_code) return NextResponse.json({ ok: false, error: "Chưa cấu hình MST" }, { status: 400 });
    if (!config) return NextResponse.json({ ok: false, error: "Chưa cấu hình provider HĐĐT" }, { status: 400 });

    const vatRate = input.vatRate ?? tax.default_vat_rate ?? 0;
    const items: InvoiceItem[] = input.items.map((it) => {
      const lineTotal = it.unit_price * it.quantity - (it.discount_amount || 0);
      const itemVat = it.vat_rate ?? vatRate;
      return { ...it, tax_rate: itemVat, tax_amount: Math.round((lineTotal * itemVat) / 100), line_total: lineTotal };
    });
    const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    const discount = items.reduce((s, it) => s + (it.discount_amount || 0), 0);
    const vatAmount = Math.round(((subtotal - discount) * vatRate) / 100);
    const total = subtotal - discount + vatAmount;

    // Create pending invoice
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
          items,
          status: "pending",
          provider: config.provider,
          notes: input.notes || null,
          issued_by: user.id,
        },
      ])
      .select()
      .single();

    if (createErr || !created) {
      return NextResponse.json({ ok: false, error: createErr?.message }, { status: 500 });
    }

    // Insert line items
    if (items.length > 0) {
      await supabase.from("invoice_items").insert(items.map((it) => ({ ...it, invoice_id: created.id })));
    }

    // Call provider (server-side — API key secure)
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
        status: "issued",
        raw_response: res.raw_response || null,
      };
      const { data: updated } = await supabase.from("invoices").update(update).eq("id", created.id).select().single();

      if (input.orderId) {
        await supabase
          .from("orders")
          .update({ invoice_id: created.id, invoice_status: "issued" })
          .eq("id", input.orderId);
      }

      await supabase.from("invoice_logs").insert([
        {
          tenant_id: orgId,
          invoice_id: created.id,
          action: "issue",
          status_before: "pending",
          status_after: "issued",
          message: `Phát hành qua ${config.provider} (server)`,
          response_payload: res.raw_response,
          created_by: user.id,
        },
      ]);

      return NextResponse.json({ ok: true, invoice: updated });
    } catch (e: any) {
      const msg = e?.message || String(e);
      await supabase.from("invoices").update({ status: "failed", error_message: msg }).eq("id", created.id);
      await supabase.from("invoice_logs").insert([
        {
          tenant_id: orgId,
          invoice_id: created.id,
          action: "issue_failed",
          status_before: "pending",
          status_after: "failed",
          message: msg,
          created_by: user.id,
        },
      ]);
      return NextResponse.json({ ok: false, error: msg, invoice: created }, { status: 422 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
