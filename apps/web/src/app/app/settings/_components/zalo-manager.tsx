"use client";

import React from "react";

import {
  AlertCircle,
  Check,
  Copy,
  ListChecks,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Webhook,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { type ZaloConfig, type ZaloTemplate, type ZaloTriggerEvent, zaloService } from "@/services/zalo.service";

const EVENT_LABELS: Record<ZaloTriggerEvent, string> = {
  order_paid: "Đơn đã thanh toán",
  order_created: "Đơn hàng mới",
  invoice_issued: "Phát hành HĐĐT",
  order_cancelled: "Huỷ đơn",
  low_stock: "Cảnh báo tồn kho",
  birthday: "Sinh nhật khách",
  custom: "Tuỳ chỉnh",
  manual: "Gửi thủ công",
};

const DEFAULT_CFG: Partial<ZaloConfig> = {
  oa_id: "",
  oa_name: "",
  app_id: "",
  app_secret: "",
  access_token: "",
  refresh_token: "",
  is_active: true,
  is_default: true,
  sender_phone: "",
};

const DEFAULT_TPL: Partial<ZaloTemplate> = {
  template_id: "",
  template_name: "",
  trigger_event: "order_paid",
  category: "transactional",
  language: "vi",
  preview_text: "",
  variables: [],
  is_active: true,
};

export function ZaloManager() {
  const [configs, setConfigs] = React.useState<ZaloConfig[]>([]);
  const [templates, setTemplates] = React.useState<ZaloTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [cfgDialog, setCfgDialog] = React.useState(false);
  const [cfgForm, setCfgForm] = React.useState<Partial<ZaloConfig>>(DEFAULT_CFG);
  const [savingCfg, setSavingCfg] = React.useState(false);

  const [tplDialog, setTplDialog] = React.useState(false);
  const [tplForm, setTplForm] = React.useState<Partial<ZaloTemplate>>(DEFAULT_TPL);
  const [savingTpl, setSavingTpl] = React.useState(false);

  const [confirmDeleteCfg, setConfirmDeleteCfg] = React.useState<string | null>(null);
  const [confirmDeleteTpl, setConfirmDeleteTpl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([zaloService.listConfigs(), zaloService.listTemplates()]);
      setConfigs(c);
      setTemplates(t);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, key: string) {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Đã sao chép");
    setTimeout(() => setCopied(null), 1500);
  }

  function webhookUrl(_cfg: ZaloConfig): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/zalo/webhook`;
  }

  // --------- Config CRUD ---------
  function openCreateCfg() {
    setCfgForm({ ...DEFAULT_CFG, is_default: configs.length === 0 });
    setCfgDialog(true);
  }

  function openEditCfg(c: ZaloConfig) {
    setCfgForm({ ...c });
    setCfgDialog(true);
  }

  async function handleSaveCfg(e: React.FormEvent) {
    e.preventDefault();
    if (!cfgForm.oa_id?.trim()) {
      toast.error("Vui lòng nhập OA ID");
      return;
    }
    setSavingCfg(true);
    try {
      await zaloService.saveConfig(cfgForm);
      toast.success(cfgForm.id ? "Đã cập nhật" : "Đã thêm OA");
      setCfgDialog(false);
      await refresh();
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || "Không rõ"}`);
    } finally {
      setSavingCfg(false);
    }
  }

  async function handleDeleteCfg(id: string) {
    try {
      await zaloService.deleteConfig(id);
      toast.success("Đã xoá OA");
      setConfirmDeleteCfg(null);
      await refresh();
    } catch (e: any) {
      toast.error(`Xoá thất bại: ${e?.message}`);
    }
  }

  // --------- Template CRUD ---------
  function openCreateTpl() {
    setTplForm({ ...DEFAULT_TPL });
    setTplDialog(true);
  }

  function openEditTpl(t: ZaloTemplate) {
    setTplForm({ ...t });
    setTplDialog(true);
  }

  async function handleSaveTpl(e: React.FormEvent) {
    e.preventDefault();
    if (!tplForm.template_id?.trim() || !tplForm.template_name?.trim()) {
      toast.error("Vui lòng nhập ID + tên template");
      return;
    }
    setSavingTpl(true);
    try {
      await zaloService.saveTemplate(tplForm);
      toast.success(tplForm.id ? "Đã cập nhật template" : "Đã thêm template");
      setTplDialog(false);
      await refresh();
    } catch (e: any) {
      toast.error(`Lỗi: ${e?.message || "Không rõ"}`);
    } finally {
      setSavingTpl(false);
    }
  }

  async function handleDeleteTpl(id: string) {
    try {
      await zaloService.deleteTemplate(id);
      toast.success("Đã xoá template");
      setConfirmDeleteTpl(null);
      await refresh();
    } catch (e: any) {
      toast.error(`Xoá thất bại: ${e?.message}`);
    }
  }

  return (
    <div className="space-y-4">
      {/* ---------- OA Configs ---------- */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-violet-600" />
                Zalo Official Account & ZNS
              </CardTitle>
              <CardDescription className="mt-1">
                Kết nối Zalo OA của bạn để gửi tin tự động (xác nhận thanh toán, thông báo HĐĐT, sinh nhật...).
              </CardDescription>
            </div>
            <Button onClick={openCreateCfg} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Kết nối OA
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold text-foreground">Chưa kết nối OA nào</p>
              <p className="text-sm text-muted-foreground mb-4">Thêm Zalo OA để bật gửi tin tự động</p>
              <Button onClick={openCreateCfg} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Kết nối OA đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {configs.map((c) => {
                const url = webhookUrl(c);
                return (
                  <div key={c.id} className="rounded-xl border bg-card p-4 space-y-3 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-md bg-violet-500/10 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground truncate">{c.oa_name || `OA ${c.oa_id}`}</p>
                          {c.is_default && (
                            <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/15 border-yellow-500/30">
                              <Star className="h-3 w-3 mr-1 fill-current" /> Mặc định
                            </Badge>
                          )}
                          {!c.is_active && <Badge variant="secondary">Tạm tắt</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">OA ID: {c.oa_id}</p>
                        {c.sender_phone && (
                          <p className="text-xs text-muted-foreground">
                            Số gửi: <b className="text-foreground">{c.sender_phone}</b>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs">
                        <Webhook className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground shrink-0">Webhook:</span>
                        <code className="flex-1 truncate font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                          {url}
                        </code>
                        <button
                          type="button"
                          onClick={() => copy(url, `wh-${c.id}`)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {copied === `wh-${c.id}` ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {c.access_token && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground shrink-0">Token:</span>
                          <code className="flex-1 truncate font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {c.access_token.slice(0, 10)}…{c.access_token.slice(-6)}
                          </code>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditCfg(c)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteCfg(c.id)}
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
            <p className="font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Hướng dẫn lấy thông tin OA
            </p>
            <p>
              1. Đăng nhập <b>business.zalo.me</b> → chọn OA → vào <b>Quản lý ứng dụng</b>.
            </p>
            <p>
              2. Tạo ứng dụng ZNS, lấy <b>App ID, App Secret, OA Access Token</b>.
            </p>
            <p>
              3. Dán <b>Webhook URL</b> ở trên vào phần "Callback URL" của OA để nhận trạng thái gửi
              (delivered/read/failed).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---------- Templates ---------- */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="w-5 h-5 text-violet-600" />
                Mẫu tin nhắn ZNS
              </CardTitle>
              <CardDescription className="mt-1">
                Khai báo Template ID đã được Zalo duyệt. Mỗi mẫu gắn với 1 sự kiện để ZPOS tự gửi.
              </CardDescription>
            </div>
            <Button onClick={openCreateTpl} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Thêm template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? null : templates.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="font-bold text-foreground">Chưa có template</p>
              <p className="text-sm text-muted-foreground mb-3">Thêm template để bắt đầu gửi ZNS tự động</p>
              <Button onClick={openCreateTpl} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Thêm template đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground truncate">{t.template_name}</p>
                        {!t.is_active && <Badge variant="secondary">Tạm tắt</Badge>}
                        {t.trigger_event && (
                          <Badge className="bg-violet-500/15 text-violet-700 hover:bg-violet-500/15 border-violet-500/30">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {EVENT_LABELS[t.trigger_event] || t.trigger_event}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">ID: {t.template_id}</p>
                      {t.preview_text && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.preview_text}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditTpl(t)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDeleteTpl(t.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Dialog: OA Config ---------- */}
      <Dialog open={cfgDialog} onOpenChange={setCfgDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{cfgForm.id ? "Cập nhật Zalo OA" : "Kết nối Zalo OA"}</DialogTitle>
            <DialogDescription>Lấy thông tin tại business.zalo.me → OA → Quản lý ứng dụng.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCfg} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="font-bold">OA ID</Label>
                <Input
                  value={cfgForm.oa_id || ""}
                  onChange={(e) => setCfgForm((f) => ({ ...f, oa_id: e.target.value }))}
                  placeholder="123456789"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold">Tên OA</Label>
                <Input
                  value={cfgForm.oa_name || ""}
                  onChange={(e) => setCfgForm((f) => ({ ...f, oa_name: e.target.value }))}
                  placeholder="ZPOS Retail"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="font-bold">App ID</Label>
                <Input
                  value={cfgForm.app_id || ""}
                  onChange={(e) => setCfgForm((f) => ({ ...f, app_id: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold">App Secret</Label>
                <Input
                  type="password"
                  value={cfgForm.app_secret || ""}
                  onChange={(e) => setCfgForm((f) => ({ ...f, app_secret: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="font-bold">Access Token</Label>
              <Textarea
                value={cfgForm.access_token || ""}
                onChange={(e) => setCfgForm((f) => ({ ...f, access_token: e.target.value }))}
                placeholder="Bearer token từ Zalo Business..."
                rows={2}
                className="font-mono text-xs"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="font-bold">Refresh Token</Label>
                <Input
                  value={cfgForm.refresh_token || ""}
                  onChange={(e) => setCfgForm((f) => ({ ...f, refresh_token: e.target.value }))}
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold">Số ĐT người gửi</Label>
                <Input
                  value={cfgForm.sender_phone || ""}
                  onChange={(e) => setCfgForm((f) => ({ ...f, sender_phone: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 pt-2">
              <label className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
                <div>
                  <p className="font-bold text-sm">Mặc định</p>
                  <p className="text-xs text-muted-foreground">Dùng OA này cho mọi sự kiện</p>
                </div>
                <Switch
                  checked={!!cfgForm.is_default}
                  onCheckedChange={(v) => setCfgForm((f) => ({ ...f, is_default: v }))}
                />
              </label>
              <label className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
                <div>
                  <p className="font-bold text-sm">Kích hoạt</p>
                  <p className="text-xs text-muted-foreground">Bật/tắt OA này</p>
                </div>
                <Switch
                  checked={!!cfgForm.is_active}
                  onCheckedChange={(v) => setCfgForm((f) => ({ ...f, is_active: v }))}
                />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCfgDialog(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={savingCfg} className="bg-violet-600 hover:bg-violet-700 text-white">
                {savingCfg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cfgForm.id ? "Lưu thay đổi" : "Kết nối"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- Dialog: Template ---------- */}
      <Dialog open={tplDialog} onOpenChange={setTplDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tplForm.id ? "Cập nhật template" : "Thêm template ZNS"}</DialogTitle>
            <DialogDescription>Chỉ ID template đã được Zalo duyệt mới gửi thành công.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTpl} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="font-bold">Template ID (từ Zalo)</Label>
                <Input
                  value={tplForm.template_id || ""}
                  onChange={(e) => setTplForm((f) => ({ ...f, template_id: e.target.value }))}
                  placeholder="123456"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold">Tên template</Label>
                <Input
                  value={tplForm.template_name || ""}
                  onChange={(e) => setTplForm((f) => ({ ...f, template_name: e.target.value }))}
                  placeholder="Xác nhận thanh toán"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="font-bold">Gắn với sự kiện</Label>
                <select
                  value={tplForm.trigger_event || "order_paid"}
                  onChange={(e) =>
                    setTplForm((f) => ({
                      ...f,
                      trigger_event: e.target.value as ZaloTriggerEvent,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  {Object.entries(EVENT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="font-bold">Loại</Label>
                <select
                  value={tplForm.category || "transactional"}
                  onChange={(e) => setTplForm((f) => ({ ...f, category: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <option value="transactional">Giao dịch</option>
                  <option value="otp">OTP</option>
                  <option value="promotion">Khuyến mãi</option>
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="font-bold">Nội dung xem trước</Label>
              <Textarea
                value={tplForm.preview_text || ""}
                onChange={(e) => setTplForm((f) => ({ ...f, preview_text: e.target.value }))}
                placeholder="Xin chào {{customer_name}}, đơn hàng {{order_no}} của bạn đã được thanh toán..."
                rows={3}
              />
            </div>
            <label className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30 cursor-pointer">
              <div>
                <p className="font-bold text-sm">Kích hoạt template</p>
                <p className="text-xs text-muted-foreground">Tắt để dừng gửi tự động</p>
              </div>
              <Switch
                checked={!!tplForm.is_active}
                onCheckedChange={(v) => setTplForm((f) => ({ ...f, is_active: v }))}
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTplDialog(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={savingTpl} className="bg-violet-600 hover:bg-violet-700 text-white">
                {savingTpl && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tplForm.id ? "Lưu" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmations */}
      <Dialog open={!!confirmDeleteCfg} onOpenChange={(o) => !o && setConfirmDeleteCfg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá kết nối OA?</DialogTitle>
            <DialogDescription>Lịch sử tin nhắn vẫn được giữ lại.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCfg(null)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={() => confirmDeleteCfg && handleDeleteCfg(confirmDeleteCfg)}>
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteTpl} onOpenChange={(o) => !o && setConfirmDeleteTpl(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá template?</DialogTitle>
            <DialogDescription>
              Sau khi xoá, các sự kiện gắn với template này sẽ không gửi tự động nữa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTpl(null)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={() => confirmDeleteTpl && handleDeleteTpl(confirmDeleteTpl)}>
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
