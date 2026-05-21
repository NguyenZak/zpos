/**
 * ZPOS eInvoice — Provider Registry
 * Tra cứu provider theo tên, dễ mở rộng cho custom providers.
 */

import type { InvoiceProvider, EInvoiceProviderName } from "./types";
import {
  DemoProvider,
  ManualProvider,
  VNPTProvider,
  ViettelProvider,
  MISAProvider,
  BKAVProvider,
  EasyInvoiceProvider,
  SInvoiceProvider,
  CyberbillProvider,
  MobiFoneProvider,
} from "./providers";

// Provider metadata — dùng cho UI (Settings, dialogs...)
export interface ProviderMeta {
  value: EInvoiceProviderName;
  label: string;
  shortLabel: string;
  hint: string;
  logoColor: string;
  isLive: boolean; // true = fully implemented, false = stub
  requiresCredentials: boolean;
  docsUrl?: string;
}

export const PROVIDER_META: ProviderMeta[] = [
  {
    value: "vnpt",
    label: "VNPT eInvoice",
    shortLabel: "VNPT",
    hint: "einvoice.vnpt.vn — cần username/password + chứng thư số",
    logoColor: "#E2001A",
    isLive: false,
    requiresCredentials: true,
    docsUrl: "https://einvoice.vnpt.vn/api-docs",
  },
  {
    value: "viettel",
    label: "Viettel eInvoice",
    shortLabel: "Viettel",
    hint: "viettel-invoice.vn — cần API Token + tài khoản đăng ký",
    logoColor: "#EE0033",
    isLive: false,
    requiresCredentials: true,
    docsUrl: "https://viettel-invoice.vn/api",
  },
  {
    value: "misa",
    label: "MISA meInvoice",
    shortLabel: "MISA",
    hint: "meinvoice.vn — cần ClientId & ClientSecret OAuth2",
    logoColor: "#0064C8",
    isLive: false,
    requiresCredentials: true,
    docsUrl: "https://api.meinvoice.vn/swagger",
  },
  {
    value: "bkav",
    label: "BKAV eHoaDon",
    shortLabel: "BKAV",
    hint: "ehoadon.bkav.com.vn — cần API Token từ dashboard",
    logoColor: "#1E6DC0",
    isLive: false,
    requiresCredentials: true,
  },
  {
    value: "easyinvoice",
    label: "EasyInvoice",
    shortLabel: "Easy",
    hint: "easyinvoice.com.vn — cần API Key",
    logoColor: "#2ECC71",
    isLive: false,
    requiresCredentials: true,
  },
  {
    value: "sinvoice",
    label: "SInvoice (Bưu điện VN)",
    shortLabel: "SInvoice",
    hint: "sinvoice.com.vn — cần tài khoản đăng ký",
    logoColor: "#F39C12",
    isLive: false,
    requiresCredentials: true,
  },
  {
    value: "cyberbill",
    label: "CyberBill",
    shortLabel: "CyberBill",
    hint: "cyberbill.vn — cần API Key từ dashboard",
    logoColor: "#8E44AD",
    isLive: false,
    requiresCredentials: true,
  },
  {
    value: "mobifone",
    label: "MobiFone Invoice",
    shortLabel: "MobiFone",
    hint: "minvoice.mobifone.vn — cần tài khoản MobiFone",
    logoColor: "#00A550",
    isLive: false,
    requiresCredentials: true,
  },
  {
    value: "manual",
    label: "Thủ công (paste mã từ phần mềm khác)",
    shortLabel: "Thủ công",
    hint: "Chỉ lưu thông tin, không gọi API — phù hợp khi đã có phần mềm HĐĐT khác",
    logoColor: "#7F8C8D",
    isLive: true,
    requiresCredentials: false,
  },
  {
    value: "demo",
    label: "Demo (cho UAT/test)",
    shortLabel: "Demo",
    hint: "Mô phỏng phát hành hoàn chỉnh để kiểm thử — không phát hành HĐ thật",
    logoColor: "#9B59B6",
    isLive: true,
    requiresCredentials: false,
  },
];

// ─── Provider factory registry ─────────────────────────────────────────────
const REGISTRY: Record<EInvoiceProviderName | string, () => InvoiceProvider> = {
  demo:        () => new DemoProvider(),
  manual:      () => new ManualProvider(),
  vnpt:        () => new VNPTProvider() as unknown as InvoiceProvider,
  viettel:     () => new ViettelProvider() as unknown as InvoiceProvider,
  misa:        () => new MISAProvider() as unknown as InvoiceProvider,
  bkav:        () => new BKAVProvider() as unknown as InvoiceProvider,
  easyinvoice: () => new EasyInvoiceProvider() as unknown as InvoiceProvider,
  sinvoice:    () => new SInvoiceProvider() as unknown as InvoiceProvider,
  cyberbill:   () => new CyberbillProvider() as unknown as InvoiceProvider,
  mobifone:    () => new MobiFoneProvider() as unknown as InvoiceProvider,
};

/**
 * Get a provider instance by name.
 * @throws Error if provider name is unknown
 */
export function getProvider(name: string): InvoiceProvider {
  const factory = REGISTRY[name];
  if (!factory) {
    throw new Error(
      `Provider "${name}" không được nhận diện. Các provider hỗ trợ: ${Object.keys(REGISTRY).join(", ")}`,
    );
  }
  return factory();
}

/**
 * Register a custom provider at runtime.
 * Use for tenant-specific or white-label providers.
 */
export function registerProvider(name: string, factory: () => InvoiceProvider): void {
  REGISTRY[name] = factory;
}

/**
 * Get metadata for a provider by name.
 */
export function getProviderMeta(name: string): ProviderMeta | undefined {
  return PROVIDER_META.find((p) => p.value === name);
}
