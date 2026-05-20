"use client";

import React from "react";
import {
  FileText,
  Save,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Star,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  einvoiceService,
  type TaxSettings,
  type EInvoiceConfig,
  type EInvoiceProvider,
} from "@/services/einvoice.service";

const PROVIDER_OPTIONS: { value: EInvoiceProvider; label: string; hint: string }[] = [
  { value: "vnpt", label: "VNPT eInvoice", hint: "einvoice.vnpt.vn — cần username/password" },
  { value: "viettel", label: "Viettel eInvoice", hint: "viettel-invoice.vn — cần API token" },
  { value: "misa", label: "MISA meInvoice", hint: "meinvoice.vn — cần API key" },
  { value: "mobifone", label: "MobiFone Invoice", hint: "minvoice.mobifone.vn" },
  { value: "easyinvoice", label: "EasyInvoice", hint: "easyinvoice.com.vn" },
  { value: "manual", label: "Thủ công (paste mã từ phần mềm khác)", hint: "Chỉ lưu thông tin, không gọi API" },
  { value: "demo", label: "Demo (cho UAT/test)", hint: "Mô phỏng phát hành để chạy thử" },
];

const DEFAULT_CONFIG: Partial<EInvoiceConfig> = {
  provider: "demo",
  is_active: true,
  is_default: true,
  api_base_url: "",
  api_username: "",
  api_password: "",
  api_token: "",
  cert_serial: "",
  invoice_series: "K24TYY",
  invoice_template_code: "1/001",
  auto_issue_on_payment: false,
  send_to_customer_email: true,
};

export function EInvoiceManager() {
  const [tax, setTax] = React.useState<TaxSettings>({
    company_name: "",
    tax_code: "",
    legal_address: "",
    district: "",
    province: "",
    phone: "",
    email: "",
    bank_account: "",
    bank_name: "",
    representative_name: "",
    representative_title: "Giám đốc",
    default_vat_rate: 8,
    default_currency: "VND",
    invoice_template: "standard",
  });
  const [configs, setConfigs] = React.useState<EInvoiceConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingTax, setSavingTax] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<EInvoiceConfig> & { id?: string }>({
    ...DEFAULT_CONFIG,
  });
  const [savingConfig, setSavingConfig] = React.useState(false);
  const [fetchingTaxInfo, setFetchingTaxInfo] = React.useState(false);

  React.useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [t, list] = await Promise.all([
        einvoiceService.getTaxSettings(),
        einvoiceService.listConfigs(),
      ]);
      if (t) setTax((prev) => ({ ...prev, ...t }));
      setConfigs(list);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTax(e: React.FormEvent) {
    e.preventDefault();
    if (!tax.company_name.trim() || !tax.tax_code.trim()) {
      toast.error("Vui lòng nhập tên công ty và mã số thuế");
      return;
    }
    setSavingTax(true);
    try {
      await einvoiceService.saveTaxSettings(tax);
      toast.success("Đã lưu thông tin thuế");
    } catch (e: any) {
      toast.error(`Lưu thất bại: ${e?.message}`);
    } finally {
      setSavingTax(false);
    }
  }

  async function handleFetchTaxInfo(taxCode: string) {
    if (!taxCode || taxCode.length < 10) return;

    setFetchingTaxInfo(true);
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${taxCode}`);
      if (res.ok) {
        const json = await res.json();
        if (json.code === "00" && json.data) {
          const { name, address } = json.data;

          let province = tax.province || "";
          let district = tax.district || "";
          let legal_address = address;

          if (address) {
            const parts = address.split(",").map((p: string) => p.trim());
            if (parts.length >= 3) {
              province = parts[parts.length - 1];
              district = parts[parts.length - 2];
            } else if (parts.length === 2) {
              province = parts[parts.length - 1];
            }
          }

          setTax((prev) => ({
            ...prev,
            company_name: name || prev.company_name,
            legal_address: legal_address || prev.legal_address,
            province,
            district,
          }));
          toast.success("Đã tự động điền thông tin công ty");
        } else if (json.code === "51") {
          toast.error("Mã số thuế không tồn tại hoặc không đúng");
        }
      }
    } catch (err) {
      console.error("Lỗi khi tìm MST", err);
      toast.error("Không thể kết nối đến máy chủ tra cứu");
    } finally {
      setFetchingTaxInfo(false);
    }
  }

  function openCreate() {
    setForm({ ...DEFAULT_CONFIG, is_default: configs.length === 0 });
    setDialogOpen(true);
  }

  function openEdit(c: EInvoiceConfig) {
    setForm({ ...c });
    setDialogOpen(true);
  }

  async function handleSubmitConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!form.provider) {
      toast.error("Chọn nhà cung cấp");
      return;
    }
    setSavingConfig(true);
    try {
      await einvoiceService.saveConfig(form);
      toast.success(form.id ? "Đã cập nhật" : "Đã thêm cấu hình");
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message}`);
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await einvoiceService.deleteConfig(id);
      toast.success("Đã xoá cấu hình");
      setConfirmDeleteId(null);
      load();
    } catch (e: any) {
      toast.error(`Xoá thất bại: ${e?.message}`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tax / Company info */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
            Thông tin pháp lý dùng trên hoá đơn
          </CardTitle>
          <CardDescription>
            Tên doanh nghiệp, MST, địa chỉ này sẽ xuất hiện trên mọi hoá đơn điện
            tử phát hành. Đảm bảo trùng khớp giấy phép kinh doanh.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveTax}>
          <CardContent className="pt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="tax-name" className="font-bold">
                      Tên doanh nghiệp <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tax-name"
                      value={tax.company_name}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, company_name: e.target.value }))
                      }
                      placeholder="CÔNG TY TNHH ABC"
                      className="font-bold uppercase"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="tax-code" className="font-bold">
                      Mã số thuế <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="tax-code"
                        value={tax.tax_code}
                        onChange={(e) =>
                          setTax((t) => ({ ...t, tax_code: e.target.value }))
                        }
                        onBlur={() => {
                          if (tax.tax_code && tax.tax_code.length >= 10 && !tax.company_name) {
                            handleFetchTaxInfo(tax.tax_code);
                          }
                        }}
                        placeholder="0312345678"
                        className="font-mono font-bold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleFetchTaxInfo(tax.tax_code)}
                        disabled={fetchingTaxInfo || !tax.tax_code}
                        className="px-3"
                        title="Tra cứu thông tin tự động"
                      >
                        {fetchingTaxInfo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="tax-addr" className="font-bold">
                    Địa chỉ trụ sở
                  </Label>
                  <Input
                    id="tax-addr"
                    value={tax.legal_address || ""}
                    onChange={(e) =>
                      setTax((t) => ({ ...t, legal_address: e.target.value }))
                    }
                    placeholder="Số nhà, đường, phường..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Quận / Huyện</Label>
                    <Input
                      value={tax.district || ""}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, district: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Tỉnh / Thành phố</Label>
                    <Input
                      value={tax.province || ""}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, province: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Số điện thoại</Label>
                    <Input
                      value={tax.phone || ""}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Email liên hệ</Label>
                    <Input
                      type="email"
                      value={tax.email || ""}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, email: e.target.value }))
                      }
                      placeholder="ketoan@congty.vn"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Người đại diện pháp luật</Label>
                    <Input
                      value={tax.representative_name || ""}
                      onChange={(e) =>
                        setTax((t) => ({
                          ...t,
                          representative_name: e.target.value,
                        }))
                      }
                      placeholder="NGUYỄN VĂN A"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Số TK ngân hàng</Label>
                    <Input
                      value={tax.bank_account || ""}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, bank_account: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Tên ngân hàng</Label>
                    <Input
                      value={tax.bank_name || ""}
                      onChange={(e) =>
                        setTax((t) => ({ ...t, bank_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Thuế suất VAT mặc định (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tax.default_vat_rate ?? 8}
                      onChange={(e) =>
                        setTax((t) => ({
                          ...t,
                          default_vat_rate: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
            <Button
              type="submit"
              disabled={savingTax || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              {savingTax && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Lưu thông tin
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Provider configs */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-violet-600" />
                Nhà cung cấp Hoá đơn điện tử
              </CardTitle>
              <CardDescription className="mt-1">
                Cấu hình kết nối với VNPT / Viettel / MISA hoặc dùng chế độ Thủ
                công / Demo để chạy thử.
              </CardDescription>
            </div>
            <Button
              onClick={openCreate}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm cấu hình
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {configs.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold">Chưa có nhà cung cấp HĐĐT</p>
              <p className="text-sm text-muted-foreground mb-4">
                Thêm cấu hình đầu tiên — có thể chọn chế độ "Demo" để chạy thử
                ngay.
              </p>
              <Button onClick={openCreate} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Thêm cấu hình
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {configs.map((c) => {
                const meta = PROVIDER_OPTIONS.find((p) => p.value === c.provider);
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border bg-card p-4 space-y-2 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground">
                            {meta?.label || c.provider}
                          </p>
                          {c.is_default && (
                            <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/15 border-yellow-500/30">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Mặc định
                            </Badge>
                          )}
                          {!c.is_active && <Badge variant="secondary">Tắt</Badge>}
                          {c.provider === "demo" && (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-700">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Mô phỏng
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {meta?.hint}
                        </p>
                        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Ký hiệu:</span>{" "}
                            <span className="font-mono font-bold">
                              {c.invoice_series || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mẫu:</span>{" "}
                            <span className="font-mono font-bold">
                              {c.invoice_template_code || "—"}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Số HĐ kế tiếp:</span>{" "}
                            <span className="font-mono font-bold">
                              {(c.current_invoice_no || 0) + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {c.auto_issue_on_payment ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Tự động phát hành
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Phát hành thủ công
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider config dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Cập nhật cấu hình HĐĐT" : "Thêm cấu hình HĐĐT"}
            </DialogTitle>
            <DialogDescription>
              Chọn nhà cung cấp, dán thông tin xác thực và mẫu hoá đơn được cơ
              quan thuế chấp nhận.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitConfig} className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="font-bold">Nhà cung cấp</Label>
              <select
                value={form.provider}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    provider: e.target.value as EInvoiceProvider,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {PROVIDER_OPTIONS.find((p) => p.value === form.provider)?.hint}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="font-bold">Ký hiệu hoá đơn</Label>
                <Input
                  value={form.invoice_series || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoice_series: e.target.value }))
                  }
                  placeholder="K24TYY"
                  className="font-mono font-bold uppercase"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold">Mẫu số hoá đơn</Label>
                <Input
                  value={form.invoice_template_code || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      invoice_template_code: e.target.value,
                    }))
                  }
                  placeholder="1/001"
                  className="font-mono font-bold"
                />
              </div>
            </div>

            {form.provider !== "manual" && form.provider !== "demo" && (
              <>
                <div className="grid gap-1.5">
                  <Label className="font-bold">URL API</Label>
                  <Input
                    value={form.api_base_url || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, api_base_url: e.target.value }))
                    }
                    placeholder="https://example.einvoice.vn/api"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Tài khoản API</Label>
                    <Input
                      value={form.api_username || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, api_username: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-bold">Mật khẩu / API Key</Label>
                    <Input
                      type="password"
                      value={form.api_password || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, api_password: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="font-bold">Số serial chứng thư số (CTS)</Label>
                  <Input
                    value={form.cert_serial || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cert_serial: e.target.value }))
                    }
                    placeholder="54xxxx..."
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}

            <div className="grid gap-3 md:grid-cols-2 pt-2">
              <label className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
                <div>
                  <p className="font-bold text-sm">Tự động phát hành sau thanh toán</p>
                  <p className="text-xs text-muted-foreground">
                    Khi đơn chuyển sang "Đã thanh toán"
                  </p>
                </div>
                <Switch
                  checked={!!form.auto_issue_on_payment}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, auto_issue_on_payment: v }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
                <div>
                  <p className="font-bold text-sm">Đặt làm cấu hình mặc định</p>
                  <p className="text-xs text-muted-foreground">
                    Dùng khi phát hành từ POS
                  </p>
                </div>
                <Switch
                  checked={!!form.is_default}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, is_default: v }))
                  }
                />
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={savingConfig}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {savingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.id ? "Lưu" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá cấu hình HĐĐT?</DialogTitle>
            <DialogDescription>
              Các hoá đơn đã phát hành sẽ vẫn được giữ lại trong lịch sử.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Xác nhận xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
