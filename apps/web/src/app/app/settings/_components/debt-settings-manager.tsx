"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, Save } from "lucide-react";
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
import { toast } from "sonner";
import { debtService, type DebtSettings } from "@/services/debt.service";

const parseDays = (raw: string): number[] =>
  raw
    .split(/[,\s]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .sort((a, b) => a - b);

export function DebtSettingsManager() {
  const [settings, setSettings] = useState<DebtSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remindBefore, setRemindBefore] = useState("");
  const [remindAfter, setRemindAfter] = useState("");

  useEffect(() => {
    debtService
      .getSettings()
      .then((s) => {
        setSettings(s);
        setRemindBefore((s.remind_before_due_days || []).join(", "));
        setRemindAfter((s.remind_after_overdue_days || []).join(", "));
      })
      .catch((e) => toast.error("Không tải được cài đặt", { description: e?.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await debtService.saveSettings({
        ...settings,
        remind_before_due_days: parseDays(remindBefore),
        remind_after_overdue_days: parseDays(remindAfter),
      });
      setSettings(updated);
      toast.success("Đã lưu cài đặt công nợ");
    } catch (e: any) {
      toast.error("Không lưu được", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cài đặt...
      </div>
    );
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground italic">Không có cài đặt.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-600" />
          Công nợ khách hàng
        </CardTitle>
        <CardDescription>
          Đặt hạn mức mặc định, ngày tới hạn và quy tắc nhắc nợ tự động cho toàn cửa hàng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="credit-limit">Hạn mức tín dụng mặc định (₫)</Label>
            <Input
              id="credit-limit"
              type="number"
              inputMode="numeric"
              value={settings.default_credit_limit}
              onChange={(e) =>
                setSettings({ ...settings, default_credit_limit: Number(e.target.value) || 0 })
              }
            />
            <p className="text-[10px] text-muted-foreground">
              Áp dụng khi khách mới phát sinh nợ lần đầu.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due-days">Số ngày tới hạn mặc định</Label>
            <Input
              id="due-days"
              type="number"
              inputMode="numeric"
              value={settings.default_due_days}
              onChange={(e) =>
                setSettings({ ...settings, default_due_days: Number(e.target.value) || 30 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="late-fee">Phí trễ hạn (%/tháng)</Label>
            <Input
              id="late-fee"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={settings.late_fee_rate || 0}
              onChange={(e) =>
                setSettings({ ...settings, late_fee_rate: Number(e.target.value) || 0 })
              }
            />
            <p className="text-[10px] text-muted-foreground">
              Để 0 nếu không tính phí phạt.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold">Cho phép vượt hạn mức</Label>
              <p className="text-[10px] text-muted-foreground">
                Cảnh báo nhưng vẫn cho ghi nợ khi tổng nợ &gt; hạn mức.
              </p>
            </div>
            <Switch
              checked={settings.allow_over_limit}
              onCheckedChange={(v) => setSettings({ ...settings, allow_over_limit: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold">Chặn POS khi khách có nợ quá hạn</Label>
              <p className="text-[10px] text-muted-foreground">
                Khách bị khoá ghi nợ tiếp đến khi tất toán phần quá hạn.
              </p>
            </div>
            <Switch
              checked={settings.block_pos_when_overdue}
              onCheckedChange={(v) => setSettings({ ...settings, block_pos_when_overdue: v })}
            />
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold">Bật nhắc nợ tự động</Label>
              <p className="text-[10px] text-muted-foreground">
                Hệ thống tự gửi nhắc qua Zalo theo lịch dưới đây.
              </p>
            </div>
            <Switch
              checked={settings.auto_reminders_enabled}
              onCheckedChange={(v) => setSettings({ ...settings, auto_reminders_enabled: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remind-before">Nhắc trước hạn (ngày, ngăn cách bởi dấu phẩy)</Label>
            <Input
              id="remind-before"
              value={remindBefore}
              onChange={(e) => setRemindBefore(e.target.value)}
              placeholder="3, 1"
              disabled={!settings.auto_reminders_enabled}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {parseDays(remindBefore).map((d) => (
                <Badge key={d} variant="secondary" className="text-[10px]">
                  Trước {d} ngày
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remind-after">Nhắc sau hạn (ngày, ngăn cách bởi dấu phẩy)</Label>
            <Input
              id="remind-after"
              value={remindAfter}
              onChange={(e) => setRemindAfter(e.target.value)}
              placeholder="1, 7, 14, 30"
              disabled={!settings.auto_reminders_enabled}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {parseDays(remindAfter).map((d) => (
                <Badge key={d} variant="destructive" className="text-[10px]">
                  Quá hạn {d} ngày
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu cài đặt
        </Button>
      </CardFooter>
    </Card>
  );
}
