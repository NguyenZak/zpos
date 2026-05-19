"use client";

import React from "react";

import { Check, Copy, Loader2, Pencil, Plus, QrCode, ShieldCheck, Star, Trash2, Webhook, Building2, CreditCard, User, Key, Landmark, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type BankAccount,
  buildVietQRImageUrl,
  type VietQRBank,
  vietQRService,
  type WebhookProvider,
} from "@/services/vietqr.service";

const DEFAULT_FORM = {
  id: undefined as string | undefined,
  bank_id: "VCB",
  bank_name: "Vietcombank",
  bank_short_name: "VCB",
  bank_logo: "",
  account_no: "",
  account_name: "",
  memo_prefix: "ZPOS",
  is_default: false,
  is_active: true,
  webhook_provider: "manual" as WebhookProvider,
  webhook_secret: "",
  notes: "",
};

export function BankAccountsManager() {
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [banks, setBanks] = React.useState<VietQRBank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ ...DEFAULT_FORM });
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  React.useEffect(() => {
    refresh();
    vietQRService.fetchVietQRBanks().then((list) => {
      if (list.length) setBanks(list);
    });
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const list = await vietQRService.listBankAccounts();
      setAccounts(list);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ ...DEFAULT_FORM, is_default: accounts.length === 0 });
    setDialogOpen(true);
  }

  function openEdit(a: BankAccount) {
    setForm({
      id: a.id,
      bank_id: a.bank_id,
      bank_name: a.bank_name || "",
      bank_short_name: a.bank_short_name || "",
      bank_logo: a.bank_logo || "",
      account_no: a.account_no,
      account_name: a.account_name,
      memo_prefix: a.memo_prefix || "ZPOS",
      is_default: a.is_default,
      is_active: a.is_active,
      webhook_provider: a.webhook_provider,
      webhook_secret: a.webhook_secret || "",
      notes: a.notes || "",
    });
    setDialogOpen(true);
  }

  function pickBank(bankCode: string) {
    const bank = banks.find((b) => b.code === bankCode || b.bin === bankCode);
    setForm((f) => ({
      ...f,
      bank_id: bank?.bin || bankCode,
      bank_name: bank?.name || f.bank_name,
      bank_short_name: bank?.shortName || f.bank_short_name,
      bank_logo: bank?.logo || f.bank_logo,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.account_no.trim() || !form.account_name.trim()) {
      toast.error("Vui lòng nhập đầy đủ số tài khoản và chủ tài khoản");
      return;
    }
    setSaving(true);
    try {
      await vietQRService.saveBankAccount(form);
      toast.success(form.id ? "Đã cập nhật tài khoản" : "Đã thêm tài khoản mới");
      setDialogOpen(false);
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(`Không thể lưu: ${e?.message || "Lỗi không xác định"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await vietQRService.deleteBankAccount(id);
      toast.success("Đã xoá tài khoản ngân hàng");
      setConfirmDeleteId(null);
      await refresh();
    } catch (e: any) {
      toast.error(`Xoá thất bại: ${e?.message}`);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await vietQRService.setDefaultBankAccount(id);
      toast.success("Đã đặt làm tài khoản mặc định");
      await refresh();
    } catch (e: any) {
      toast.error(`Thất bại: ${e?.message}`);
    }
  }

  function copy(text: string, field: string) {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Đã sao chép");
    setTimeout(() => setCopiedField(null), 1500);
  }

  return (
    <Card className="border shadow-sm overflow-hidden bg-card">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="w-5 h-5 text-violet-600" />
              Tài khoản ngân hàng & VietQR
            </CardTitle>
            <CardDescription className="mt-1">
              Mỗi tài khoản có thể nhận thanh toán qua VietQR. Webhook cho phép tự động xác nhận khi khách chuyển khoản
              thành công.
            </CardDescription>
          </div>
          <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Thêm tài khoản
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <QrCode className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="font-bold text-foreground">Chưa có tài khoản nào</p>
            <p className="text-sm text-muted-foreground mb-4">
              Thêm tài khoản ngân hàng đầu tiên để bắt đầu nhận thanh toán VietQR
            </p>
            <Button onClick={openCreate} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Thêm tài khoản
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((a) => {
              const previewQR = buildVietQRImageUrl({
                bankBin: a.bank_id,
                accountNo: a.account_no,
                amount: 100000,
                addInfo: `${a.memo_prefix} demo`,
                accountName: a.account_name,
              });
              const usesManualVietQR = a.webhook_provider === "manual";
              const webhookUrl = usesManualVietQR ? "" : vietQRService.buildWebhookUrl(a.id, a.webhook_provider);
              return (
                <div key={a.id} className="rounded-xl border bg-card p-4 space-y-3 transition-all hover:shadow-md">
                  <div className="flex items-start gap-3">
                    {a.bank_logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.bank_logo}
                        alt={a.bank_name || ""}
                        className="w-12 h-12 object-contain rounded-md bg-white border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-violet-500/10 flex items-center justify-center font-black text-violet-600">
                        {a.bank_short_name || a.bank_id.slice(0, 3)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground truncate">{a.bank_name || a.bank_id}</p>
                        {a.is_default && (
                          <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/15 border-yellow-500/30">
                            <Star className="h-3 w-3 mr-1 fill-current" /> Mặc định
                          </Badge>
                        )}
                        {!a.is_active && <Badge variant="secondary">Tạm tắt</Badge>}
                      </div>
                      <p className="font-mono text-sm mt-0.5">{a.account_no}</p>
                      <p className="text-xs text-muted-foreground uppercase">{a.account_name}</p>
                    </div>
                    <div className="w-20 h-20 bg-white border rounded-md p-1 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewQR} alt="QR preview" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t">
                    {usesManualVietQR ? (
                      <div className="flex items-center gap-2 text-xs">
                        <QrCode className="h-3.5 w-3.5 text-violet-600" />
                        <span className="font-semibold text-violet-700 dark:text-violet-400">
                          VietQR không dùng webhook, xác nhận thanh toán thủ công.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-xs">
                          <Webhook className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground shrink-0">Webhook:</span>
                          <code className="flex-1 truncate font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {webhookUrl}
                          </code>
                          <button
                            type="button"
                            onClick={() => copy(webhookUrl, `url-${a.id}`)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {copiedField === `url-${a.id}` ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground shrink-0">Secret:</span>
                          <code className="flex-1 truncate font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {a.webhook_secret || "—"}
                          </code>
                          {a.webhook_secret && (
                            <button
                              type="button"
                              onClick={() => copy(a.webhook_secret!, `sec-${a.id}`)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {copiedField === `sec-${a.id}` ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {!a.is_default && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSetDefault(a.id)}>
                        <Star className="mr-1 h-3.5 w-3.5" /> Đặt mặc định
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(a)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDeleteId(a.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs space-y-1.5 leading-relaxed">
          <p className="font-bold text-violet-700 dark:text-violet-400">💡 VietQR và tự động xác nhận thanh toán</p>
          <p>
            Chọn <b>VietQR (không dùng webhook)</b> nếu chỉ muốn POS hiển thị mã QR để khách chuyển khoản và nhân viên
            tự xác nhận khi thấy tiền về.
          </p>
          <p>
            1. Đăng ký tài khoản tại <b>Sepay.vn</b> hoặc <b>Casso.vn</b> — kết nối ngân hàng của bạn (qua SMS forward
            hoặc API).
          </p>
          <p>
            2. Trong trang quản lý Sepay/Casso, dán <b>Webhook URL</b> ở phía trên và đặt header{" "}
            <code className="bg-muted px-1 rounded">Authorization: Apikey [Secret]</code>.
          </p>
          <p>
            3. Khi khách chuyển khoản với nội dung là <b>mã giao dịch</b> sinh ra lúc checkout, đơn hàng sẽ tự đổi sang
            trạng thái <b className="text-green-600">Đã thanh toán</b> trong thời gian thực.
          </p>
        </div>
      </CardContent>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl lg:max-w-4xl rounded-2xl">
          <DialogHeader className="relative overflow-hidden pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center border border-violet-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {form.id ? "Cập nhật tài khoản ngân hàng" : "Thêm tài khoản ngân hàng"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Cấu hình tài khoản nhận thanh toán & webhook tự xác nhận.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div className="flex flex-col gap-4">
              {/* Row 1: Bank selection (Full Width to prevent truncation) */}
              <div className="grid gap-1.5 w-full">
                <Label htmlFor="ba-bank" className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                  Ngân hàng thụ hưởng
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                    <Landmark className="w-4 h-4 text-violet-500" />
                  </div>
                  <select
                    id="ba-bank"
                    value={form.bank_id}
                    onChange={(e) => pickBank(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background pl-9 pr-10 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all shadow-sm cursor-pointer appearance-none"
                  >
                    {banks.length === 0 && <option value="VCB">Vietcombank (VCB)</option>}
                    {banks.map((b) => (
                      <option key={b.bin} value={b.bin}>
                        {b.shortName} — {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Row 2: Account Number & Account Holder (2 columns) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="ba-no" className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                    Số tài khoản
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <CreditCard className="w-4 h-4 text-violet-500" />
                    </div>
                    <Input
                      id="ba-no"
                      value={form.account_no}
                      onChange={(e) => setForm((f) => ({ ...f, account_no: e.target.value }))}
                      placeholder="Nhập số tài khoản"
                      className="pl-9 h-11 rounded-xl font-mono font-bold text-sm border-zinc-200 dark:border-zinc-800 bg-background shadow-sm focus-visible:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="ba-name" className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                    Chủ tài khoản (in hoa, không dấu)
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <User className="w-4 h-4 text-violet-500" />
                    </div>
                    <Input
                      id="ba-name"
                      value={form.account_name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          account_name: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ví dụ: NGUYEN VAN A"
                      className="pl-9 h-11 rounded-xl font-bold uppercase text-sm border-zinc-200 dark:border-zinc-800 bg-background shadow-sm focus-visible:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Memo Prefix & Webhook Service (2 columns) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="ba-memo" className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                    Tiền tố nội dung CK
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <Key className="w-4 h-4 text-violet-500" />
                    </div>
                    <Input
                      id="ba-memo"
                      value={form.memo_prefix}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          memo_prefix: e.target.value
                            .replace(/[^A-Za-z0-9]/g, "")
                            .toUpperCase()
                            .slice(0, 8),
                        }))
                      }
                      placeholder="ZPOS"
                      className="pl-9 h-11 rounded-xl font-bold text-sm border-zinc-200 dark:border-zinc-800 bg-background shadow-sm focus-visible:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="ba-provider" className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                    Dịch vụ xác nhận thanh toán
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <Webhook className="w-4 h-4 text-violet-500" />
                    </div>
                    <select
                      id="ba-provider"
                      value={form.webhook_provider}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          webhook_provider: e.target.value as WebhookProvider,
                        }))
                      }
                      className="flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background pl-9 pr-10 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all shadow-sm cursor-pointer appearance-none"
                    >
                      <option value="manual">VietQR (Không dùng webhook)</option>
                      <option value="sepay">Sepay.vn (Khuyên dùng)</option>
                      <option value="casso">Casso.vn</option>
                      <option value="generic">Webhook tuỳ chỉnh</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {form.webhook_provider === "manual" ? (
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs leading-relaxed text-violet-800 dark:text-violet-200">
                  <p className="font-bold">VietQR không cần webhook</p>
                  <p className="mt-1">
                    POS sẽ dùng thông tin ngân hàng này để tạo mã VietQR. Sau khi khách chuyển khoản, nhân viên xác nhận
                    thanh toán thủ công trên màn hình bán hàng.
                  </p>
                </div>
              ) : (
                <div className="grid gap-1.5 w-full">
                  <Label htmlFor="ba-secret" className="font-bold text-xs text-zinc-600 dark:text-zinc-400">
                    Webhook secret
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                      <ShieldCheck className="w-4 h-4 text-violet-500" />
                    </div>
                    <Input
                      id="ba-secret"
                      value={form.webhook_secret}
                      onChange={(e) => setForm((f) => ({ ...f, webhook_secret: e.target.value }))}
                      placeholder="Mã bí mật tự động xác nhận chuyển khoản (để trống nếu tự tạo)"
                      className="pl-9 h-11 rounded-xl font-mono text-xs border-zinc-200 dark:border-zinc-800 bg-background shadow-sm focus-visible:ring-violet-500"
                    />
                  </div>
                </div>
              )}

              {/* Row 5: Switch Cards (2 columns) */}
              <div className="grid gap-3 md:grid-cols-2 pt-2">
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-violet-500/30 hover:bg-violet-500/[0.01] transition-all cursor-pointer">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Tài khoản mặc định</p>
                    <p className="text-[10px] text-muted-foreground leading-normal">Chọn tài khoản này đầu tiên khi mở POS.</p>
                  </div>
                  <Switch checked={form.is_default} onCheckedChange={(v) => setForm((f) => ({ ...f, is_default: v }))} />
                </div>

                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-violet-500/30 hover:bg-violet-500/[0.01] transition-all cursor-pointer">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Kích hoạt tài khoản</p>
                    <p className="text-[10px] text-muted-foreground leading-normal">Cho phép POS hiển thị và nhận tiền qua VietQR.</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex gap-2 sm:gap-0 mt-5">
              <Button 
                type="button" 
                variant="ghost" 
                className="h-11 px-5 rounded-xl font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-all active:scale-[0.98]"
                onClick={() => setDialogOpen(false)}
              >
                Huỷ
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="h-11 px-5 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/10 transition-all active:scale-[0.98]"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
                {form.id ? "Lưu thay đổi" : "Thêm tài khoản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá tài khoản ngân hàng?</DialogTitle>
            <DialogDescription>
              Tài khoản sẽ không còn hiển thị trên POS. Các giao dịch đã thanh toán vẫn được giữ lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              Xác nhận xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
