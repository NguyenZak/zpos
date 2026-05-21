/**
 * ZPOS eInvoice — Core Types
 * Tuân thủ Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC
 */

// ─── Provider names ────────────────────────────────────────────────────────
export type EInvoiceProviderName =
  | "vnpt"
  | "viettel"
  | "misa"
  | "mobifone"
  | "easyinvoice"
  | "sinvoice"
  | "bkav"
  | "cyberbill"
  | "manual"
  | "demo"
  | "custom";

// ─── Invoice status ────────────────────────────────────────────────────────
export type InvoiceStatus =
  | "draft"
  | "pending"
  | "issued"
  | "sent"
  | "sent_to_tax"
  | "cancelled"
  | "replaced"
  | "adjusted"
  | "failed"
  | "synced"
  | "unknown";

export type InvoiceType = "B2C" | "B2B" | "POS" | "ADJUST" | "REPLACE";

// ─── Tax profile (thông tin pháp lý tenant) ────────────────────────────────
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

// ─── Provider config (stored in einvoice_configs) ─────────────────────────
export interface EInvoiceConfig {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  provider: EInvoiceProviderName;
  is_active: boolean;
  is_default: boolean;
  environment: "sandbox" | "production";
  api_base_url?: string | null;
  api_username?: string | null;
  // Note: passwords/tokens stored encrypted in DB, never returned as plain-text
  // These fields used only for WRITE operations from settings UI:
  api_password?: string | null;
  api_password_encrypted?: string | null;
  api_token?: string | null;
  api_token_encrypted?: string | null;
  client_id_encrypted?: string | null;
  client_secret_encrypted?: string | null;
  cert_serial?: string | null;
  invoice_series?: string | null;
  invoice_template_code?: string | null;
  cash_register_code?: string | null;
  current_invoice_no?: number;
  auto_issue_on_payment: boolean;
  send_to_customer_email: boolean;
  webhook_secret?: string | null;
  last_connected_at?: string | null;
  extra_config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ─── Invoice line item ─────────────────────────────────────────────────────
export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  order_item_id?: string | null;
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  created_at?: string;
}

// ─── Invoice (main record) ─────────────────────────────────────────────────
export interface Invoice {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  order_id?: string | null;
  customer_id?: string | null;
  config_id?: string | null;
  invoice_type: InvoiceType;
  // Legal numbering (from provider after signing)
  invoice_series?: string | null;
  invoice_template_code?: string | null;
  invoice_no?: string | null;
  invoice_date?: string | null;
  // Provider response fields
  provider: EInvoiceProviderName;
  provider_invoice_id?: string | null;
  tax_authority_code?: string | null;
  lookup_code?: string | null;
  lookup_url?: string | null;
  qr_code_url?: string | null;
  provider_pdf_url?: string | null;
  provider_xml_url?: string | null;
  // Buyer snapshot (immutable at issuance)
  buyer_name?: string | null;
  buyer_tax_code?: string | null;
  buyer_address?: string | null;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  // Amounts
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  payment_method?: string | null;
  // Items (legacy jsonb — for backward compat; new: use invoice_items table)
  items?: InvoiceItem[];
  // Status & lifecycle
  status: InvoiceStatus;
  issued_by?: string | null;
  signed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_reason?: string | null;
  adjusted_at?: string | null;
  replaced_at?: string | null;
  replaced_by_id?: string | null;
  // Error info
  error_code?: string | null;
  error_message?: string | null;
  // Raw payloads for debugging
  raw_request?: Record<string, any> | null;
  raw_response?: Record<string, any> | null;
  // Notes
  notes?: string | null;
  // Legacy compat
  provider_lookup_code?: string | null;
  provider_payload?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ─── Invoice log ────────────────────────────────────────────────────────────
export interface InvoiceLog {
  id: string;
  tenant_id: string;
  invoice_id: string;
  action: string;
  status_before?: string | null;
  status_after?: string | null;
  message?: string | null;
  request_payload?: Record<string, any> | null;
  response_payload?: Record<string, any> | null;
  created_by?: string | null;
  created_at: string;
}

// ─── Provider interface payloads ───────────────────────────────────────────
export interface CreateInvoicePayload {
  config: EInvoiceConfig;
  taxProfile: TaxSettings;
  invoice: Invoice;
  items: InvoiceItem[];
}

export interface CreateInvoiceResult {
  invoice_no: string;
  invoice_series?: string;
  provider_invoice_id?: string;
  tax_authority_code?: string;  // Mã CQT
  lookup_code?: string;
  lookup_url?: string;
  qr_code_url?: string;
  pdf_url?: string;
  xml_url?: string;
  raw_response?: Record<string, any>;
}

export interface CancelInvoicePayload {
  config: EInvoiceConfig;
  invoice: Invoice;
  reason: string;
}

export interface AdjustInvoicePayload {
  config: EInvoiceConfig;
  taxProfile: TaxSettings;
  originalInvoice: Invoice;
  adjustmentNote: string;
  items?: InvoiceItem[];
}

export interface ReplaceInvoicePayload extends CreateInvoicePayload {
  originalInvoiceNo: string;
  originalInvoiceSeries?: string;
}

export interface GetInvoiceStatusPayload {
  config: EInvoiceConfig;
  invoiceNo: string;
  invoiceSeries?: string;
  providerInvoiceId?: string;
}

export interface InvoiceStatusResult {
  status: InvoiceStatus;
  taxAuthorityCode?: string;
  lookupUrl?: string;
}

// ─── Core provider interface ───────────────────────────────────────────────
export interface InvoiceProvider {
  createInvoice(payload: CreateInvoicePayload): Promise<CreateInvoiceResult>;
  cancelInvoice(payload: CancelInvoicePayload): Promise<{ ok: true }>;
  adjustInvoice(payload: AdjustInvoicePayload): Promise<CreateInvoiceResult>;
  replaceInvoice(payload: ReplaceInvoicePayload): Promise<CreateInvoiceResult>;
  getInvoiceStatus(payload: GetInvoiceStatusPayload): Promise<InvoiceStatusResult>;
  getInvoicePdf?(payload: { config: EInvoiceConfig; invoiceNo: string }): Promise<{ url: string }>;
  testConnection?(config: EInvoiceConfig): Promise<{ ok: boolean; message: string }>;
}

// ─── Service input types ───────────────────────────────────────────────────
export interface IssueInvoiceInput {
  orderId?: string;
  branchId?: string;
  customerId?: string;
  invoiceType?: InvoiceType;
  buyer: {
    name?: string;
    tax_code?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    product_name: string;
    product_id?: string;
    order_item_id?: string;
    sku?: string;
    unit?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    vat_rate?: number;
  }>;
  vatRate?: number;
  paymentMethod?: string;
  notes?: string;
  configId?: string; // Override default config
}

export interface IssueResult {
  ok: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface CancelResult {
  ok: boolean;
  error?: string;
}

export interface AdjustResult {
  ok: boolean;
  newInvoice?: Invoice;
  error?: string;
}
