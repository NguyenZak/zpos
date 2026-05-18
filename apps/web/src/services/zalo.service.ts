import { getActiveOrganizationId } from "@/services/pos.service";
import { createClient } from "@/utils/supabase/client";

export type ZaloTriggerEvent =
  | "order_paid"
  | "order_created"
  | "invoice_issued"
  | "order_cancelled"
  | "low_stock"
  | "birthday"
  | "custom"
  | "manual";

export type ZaloMessageStatus = "pending" | "sent" | "delivered" | "read" | "failed" | "queued";

export type ZaloChannel = "zns" | "oa_message" | "cs";

export interface ZaloConfig {
  id: string;
  tenant_id: string;
  oa_id: string;
  oa_name?: string | null;
  app_id?: string | null;
  app_secret?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  webhook_secret?: string | null;
  is_active: boolean;
  is_default: boolean;
  sender_phone?: string | null;
  notes?: string | null;
  extra?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ZaloTemplateVariable {
  name: string;
  label?: string;
  default?: string;
}

export interface ZaloTemplate {
  id: string;
  tenant_id: string;
  template_id: string;
  template_name: string;
  trigger_event?: ZaloTriggerEvent | null;
  category?: string | null;
  language?: string;
  preview_text?: string | null;
  variables?: ZaloTemplateVariable[];
  is_active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ZaloMessage {
  id: string;
  tenant_id: string;
  zalo_config_id?: string | null;
  template_id?: string | null;
  phone: string;
  customer_id?: string | null;
  order_id?: string | null;
  invoice_id?: string | null;
  channel: ZaloChannel;
  template_zalo_id?: string | null;
  template_data?: Record<string, any>;
  rendered_text?: string | null;
  status: ZaloMessageStatus;
  zalo_message_id?: string | null;
  zalo_error_code?: string | null;
  zalo_error_message?: string | null;
  cost?: number;
  provider_payload?: Record<string, any>;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  created_at?: string;
}

// ------------------------ helpers ------------------------

/** Normalize VN phone to +84 international format (no leading zero). */
export function normalizeVNPhone(raw: string): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D+/g, "");
  if (digits.startsWith("84")) return digits;
  if (digits.startsWith("0")) return "84" + digits.slice(1);
  return digits;
}

/** Render "Xin chào {{name}}" with given data. */
export function renderTemplate(text: string, data: Record<string, any>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = data[key];
    return v == null ? "" : String(v);
  });
}

// ------------------------ service ------------------------

export const zaloService = {
  // ---------- Configs ----------
  async listConfigs(): Promise<ZaloConfig[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("zalo_configs")
      .select("*")
      .eq("tenant_id", orgId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("listConfigs failed:", error.message);
      return [];
    }
    return (data || []) as ZaloConfig[];
  },

  async getDefaultConfig(): Promise<ZaloConfig | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("zalo_configs")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as ZaloConfig) || null;
  },

  async saveConfig(config: Partial<ZaloConfig> & { id?: string }): Promise<ZaloConfig> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const payload: Partial<ZaloConfig> = {
      ...config,
      tenant_id: orgId,
    };
    if (payload.is_default) {
      await supabase.from("zalo_configs").update({ is_default: false }).eq("tenant_id", orgId);
    }
    if (config.id) {
      const { data, error } = await supabase
        .from("zalo_configs")
        .update(payload)
        .eq("id", config.id)
        .eq("tenant_id", orgId)
        .select()
        .single();
      if (error) throw error;
      return data as ZaloConfig;
    }
    if (!payload.webhook_secret) {
      payload.webhook_secret = `zlo_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    }
    const { data, error } = await supabase.from("zalo_configs").insert([payload]).select().single();
    if (error) throw error;
    return data as ZaloConfig;
  },

  async deleteConfig(id: string): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { error } = await supabase.from("zalo_configs").delete().eq("id", id).eq("tenant_id", orgId);
    if (error) throw error;
  },

  // ---------- Templates ----------
  async listTemplates(): Promise<ZaloTemplate[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data, error } = await supabase
      .from("zalo_templates")
      .select("*")
      .eq("tenant_id", orgId)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("listTemplates failed:", error.message);
      return [];
    }
    return (data || []) as ZaloTemplate[];
  },

  async getTemplateByEvent(event: ZaloTriggerEvent): Promise<ZaloTemplate | null> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { data } = await supabase
      .from("zalo_templates")
      .select("*")
      .eq("tenant_id", orgId)
      .eq("trigger_event", event)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as ZaloTemplate) || null;
  },

  async saveTemplate(tpl: Partial<ZaloTemplate> & { id?: string }): Promise<ZaloTemplate> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const payload: Partial<ZaloTemplate> = { ...tpl, tenant_id: orgId };
    if (tpl.id) {
      const { data, error } = await supabase
        .from("zalo_templates")
        .update(payload)
        .eq("id", tpl.id)
        .eq("tenant_id", orgId)
        .select()
        .single();
      if (error) throw error;
      return data as ZaloTemplate;
    }
    const { data, error } = await supabase.from("zalo_templates").insert([payload]).select().single();
    if (error) throw error;
    return data as ZaloTemplate;
  },

  async deleteTemplate(id: string): Promise<void> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    const { error } = await supabase.from("zalo_templates").delete().eq("id", id).eq("tenant_id", orgId);
    if (error) throw error;
  },

  // ---------- Send ----------
  /**
   * Send a Zalo ZNS message. Goes through our API route which talks to
   * Zalo OpenAPI server-side and logs the result to zalo_messages.
   */
  async sendZNS(input: {
    phone: string;
    templateEvent?: ZaloTriggerEvent;
    templateZaloId?: string;
    templateData?: Record<string, any>;
    orderId?: string;
    invoiceId?: string;
    customerId?: string;
  }): Promise<ZaloMessage> {
    const res = await fetch("/api/zalo/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || `Send failed (${res.status})`);
    }
    return json.message as ZaloMessage;
  },

  // ---------- Logs ----------
  async listMessages(opts?: {
    status?: ZaloMessageStatus;
    fromDate?: string;
    toDate?: string;
    phone?: string;
    limit?: number;
  }): Promise<ZaloMessage[]> {
    const supabase = createClient();
    const orgId = await getActiveOrganizationId();
    let q = supabase
      .from("zalo_messages")
      .select("*")
      .eq("tenant_id", orgId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 200);
    if (opts?.status) q = q.eq("status", opts.status);
    if (opts?.fromDate) q = q.gte("created_at", opts.fromDate);
    if (opts?.toDate) q = q.lte("created_at", opts.toDate);
    if (opts?.phone) q = q.ilike("phone", `%${opts.phone.replace(/^0/, "")}%`);
    const { data, error } = await q;
    if (error) {
      console.warn("listMessages failed:", error.message);
      return [];
    }
    return (data || []) as ZaloMessage[];
  },
};
