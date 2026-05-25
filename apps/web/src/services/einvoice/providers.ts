/**
 * ZPOS eInvoice — Provider Implementations
 * Demo, Manual, và stubs cho VNPT / Viettel / MISA / BKAV / SInvoice...
 */

import type {
  InvoiceProvider,
  EInvoiceConfig,
  CreateInvoicePayload,
  CreateInvoiceResult,
  CancelInvoicePayload,
  AdjustInvoicePayload,
  ReplaceInvoicePayload,
  GetInvoiceStatusPayload,
  InvoiceStatusResult,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Demo Provider — mô phỏng cho UAT / dev / test
// ─────────────────────────────────────────────────────────────────────────────
export class DemoProvider implements InvoiceProvider {
  async createInvoice(payload: CreateInvoicePayload): Promise<CreateInvoiceResult> {
    await new Promise((r) => setTimeout(r, 600));
    const { config, invoice } = payload;
    const series = config.invoice_series || "K24TYY";
    const no = String((config.current_invoice_no || 0) + Math.floor(Math.random() * 1000) + 1).padStart(7, "0");
    const lookupCode = `LK${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    return {
      invoice_no: no,
      invoice_series: series,
      provider_invoice_id: `DEMO-${Date.now()}`,
      tax_authority_code: `QBD${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      lookup_code: lookupCode,
      lookup_url: `https://hoadondientu.gdt.gov.vn/search?ma=${lookupCode}`,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hoadondientu.gdt.gov.vn/search?ma=${lookupCode}`,
      pdf_url: `https://demo.einvoice.local/pdf/${invoice.id}.pdf`,
      xml_url: `https://demo.einvoice.local/xml/${invoice.id}.xml`,
      raw_response: { simulated: true, series, no },
    };
  }

  async cancelInvoice(_payload: CancelInvoicePayload): Promise<{ ok: true }> {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true };
  }

  async adjustInvoice(payload: AdjustInvoicePayload): Promise<CreateInvoiceResult> {
    await new Promise((r) => setTimeout(r, 600));
    const { config } = payload;
    const series = config.invoice_series || "K24TYY";
    const no = String(Math.floor(Math.random() * 9999999)).padStart(7, "0");
    const lookupCode = `LADJ${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      invoice_no: no,
      invoice_series: series,
      provider_invoice_id: `DEMO-ADJ-${Date.now()}`,
      lookup_code: lookupCode,
      lookup_url: `https://hoadondientu.gdt.gov.vn/search?ma=${lookupCode}`,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${lookupCode}`,
      raw_response: { simulated: true, type: "adjust" },
    };
  }

  async replaceInvoice(payload: ReplaceInvoicePayload): Promise<CreateInvoiceResult> {
    return this.createInvoice(payload);
  }

  async getInvoiceStatus(_payload: GetInvoiceStatusPayload): Promise<InvoiceStatusResult> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      status: "issued",
      taxAuthorityCode: `QBD${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    };
  }

  async testConnection(_config: EInvoiceConfig): Promise<{ ok: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, message: "Demo provider hoạt động bình thường ✓" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual Provider — người dùng tự nhập số HĐ từ phần mềm bên ngoài
// ─────────────────────────────────────────────────────────────────────────────
export class ManualProvider implements InvoiceProvider {
  async createInvoice(payload: CreateInvoicePayload): Promise<CreateInvoiceResult> {
    const { invoice } = payload;
    // Manual mode: caller should have pre-filled invoice_no
    return {
      invoice_no: invoice.invoice_no || "",
      provider_invoice_id: invoice.provider_invoice_id || undefined,
      raw_response: { mode: "manual" },
    };
  }

  async cancelInvoice(_payload: CancelInvoicePayload): Promise<{ ok: true }> {
    return { ok: true };
  }

  async adjustInvoice(_payload: AdjustInvoicePayload): Promise<CreateInvoiceResult> {
    return { invoice_no: "", raw_response: { mode: "manual" } };
  }

  async replaceInvoice(payload: ReplaceInvoicePayload): Promise<CreateInvoiceResult> {
    return this.createInvoice(payload);
  }

  async getInvoiceStatus(_payload: GetInvoiceStatusPayload): Promise<InvoiceStatusResult> {
    return { status: "unknown" };
  }

  async testConnection(_config: EInvoiceConfig): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: "Chế độ thủ công không cần kết nối API." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory: tạo stub provider với thông báo rõ ràng cho provider chưa tích hợp
// ─────────────────────────────────────────────────────────────────────────────
function createStubProvider(name: string, hint: string, docs?: string): InvoiceProvider {
  const err = () => {
    throw new Error(
      `Provider "${name}" chưa được tích hợp đầy đủ.\n` +
        `${hint}\n` +
        `${docs ? `Tài liệu API: ${docs}` : "Vui lòng liên hệ đội kỹ thuật ZPOS để kích hoạt."}`,
    );
  };
  return {
    createInvoice: err,
    cancelInvoice: err,
    adjustInvoice: err,
    replaceInvoice: err,
    getInvoiceStatus: err,
    async testConnection() {
      return {
        ok: false,
        message: `${name} chưa được tích hợp. Hãy dùng chế độ "Demo" hoặc "Thủ công" trong lúc chờ.`,
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VNPT eInvoice — Stub (sẽ implement khi có credential thật)
// API doc: https://einvoice.vnpt.vn/api-docs
// ─────────────────────────────────────────────────────────────────────────────
export class VNPTProvider extends (createStubProvider(
  "VNPT eInvoice",
  "Cần username, password, certificateSerial từ cổng einvoice.vnpt.vn",
  "https://einvoice.vnpt.vn/api-docs",
).constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// Viettel eInvoice — Stub
// ─────────────────────────────────────────────────────────────────────────────
export class ViettelProvider extends (createStubProvider(
  "Viettel eInvoice",
  "Cần API Token từ cổng viettel-invoice.vn",
  "https://viettel-invoice.vn/api",
).constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// MISA meInvoice — Stub
// ─────────────────────────────────────────────────────────────────────────────
export class MISAProvider extends (createStubProvider(
  "MISA meInvoice",
  "Cần ClientId, ClientSecret từ cổng meinvoice.vn",
  "https://api.meinvoice.vn/swagger",
).constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// BKAV eHoaDon — Stub
// ─────────────────────────────────────────────────────────────────────────────
export class BKAVProvider extends (createStubProvider("BKAV eHoaDon", "Cần Token từ cổng ehoadon.bkav.com.vn")
  .constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// EasyInvoice — Stub
// ─────────────────────────────────────────────────────────────────────────────
export class EasyInvoiceProvider extends (createStubProvider("EasyInvoice", "Cần API Key từ easyinvoice.com.vn")
  .constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// SInvoice — Stub (Tổng Công ty Bưu điện VN)
// ─────────────────────────────────────────────────────────────────────────────
export class SInvoiceProvider extends (createStubProvider("SInvoice (Bưu điện)", "Cần account từ cổng sinvoice.com.vn")
  .constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// CyberBill — Stub
// ─────────────────────────────────────────────────────────────────────────────
export class CyberbillProvider extends (createStubProvider("CyberBill", "Cần API Key từ cyberbill.vn")
  .constructor as any) {}

// ─────────────────────────────────────────────────────────────────────────────
// MobiFone Invoice — Stub
// ─────────────────────────────────────────────────────────────────────────────
export class MobiFoneProvider extends (createStubProvider(
  "MobiFone Invoice",
  "Cần tài khoản từ cổng minvoice.mobifone.vn",
).constructor as any) {}
