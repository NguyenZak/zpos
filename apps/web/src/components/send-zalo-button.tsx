"use client";

import React from "react";
import { MessageCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  zaloService,
  normalizeVNPhone,
  type ZaloTriggerEvent,
} from "@/services/zalo.service";

interface Props {
  /** What event to send — drives template selection */
  event: ZaloTriggerEvent;
  /** Phone number of recipient (will be normalized) */
  defaultPhone?: string;
  /** Variables to substitute into the template */
  templateData?: Record<string, any>;
  /** Optional links so the message log can find related rows */
  orderId?: string;
  invoiceId?: string;
  customerId?: string;
  /** UI knobs */
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  compact?: boolean;
  /** Skip the confirm dialog if the phone is already known (1-click send) */
  silentIfPhoneKnown?: boolean;
}

export function SendZaloButton({
  event,
  defaultPhone,
  templateData,
  orderId,
  invoiceId,
  customerId,
  size = "default",
  variant = "outline",
  compact = false,
  silentIfPhoneKnown = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [phone, setPhone] = React.useState(defaultPhone || "");
  const [sending, setSending] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "ok" | "err">("idle");

  React.useEffect(() => {
    setPhone(defaultPhone || "");
  }, [defaultPhone]);

  async function doSend(p: string) {
    setSending(true);
    setStatus("idle");
    try {
      await zaloService.sendZNS({
        phone: p,
        templateEvent: event,
        templateData,
        orderId,
        invoiceId,
        customerId,
      });
      setStatus("ok");
      toast.success("Đã gửi thông báo qua Zalo");
    } catch (e: any) {
      setStatus("err");
      toast.error(`Gửi thất bại: ${e?.message || "Lỗi không xác định"}`);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const p = normalizeVNPhone(phone);
    if (!p || p.length < 10) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    await doSend(p);
    if (status !== "err") setOpen(false);
  }

  function handleClick() {
    if (silentIfPhoneKnown && defaultPhone && normalizeVNPhone(defaultPhone).length >= 10) {
      doSend(normalizeVNPhone(defaultPhone));
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={sending}
        className="gap-2"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "ok" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <MessageCircle className="h-4 w-4 text-sky-500" />
        )}
        {compact ? "Zalo" : sending ? "Đang gửi…" : "Gửi qua Zalo"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-sky-500" />
              Gửi thông báo qua Zalo
            </DialogTitle>
            <DialogDescription>
              Tin nhắn ZNS sẽ được gửi tới số Zalo của khách theo mẫu đã duyệt.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="zlo-phone" className="font-bold">
                Số điện thoại khách
              </Label>
              <Input
                id="zlo-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="font-mono font-bold"
              />
              <p className="text-xs text-muted-foreground">
                Chuẩn hoá: <span className="font-mono">{phone ? normalizeVNPhone(phone) : "—"}</span>
              </p>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider text-muted-foreground">
                Mẫu áp dụng
              </p>
              <p>
                Sự kiện: <span className="font-mono font-bold">{event}</span>
              </p>
              <p className="text-muted-foreground">
                Hệ thống sẽ dùng mẫu ZNS đã cấu hình cho sự kiện này.
              </p>
            </div>

            {status === "err" && (
              <div className="flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p>
                  Gửi gần nhất thất bại — kiểm tra access_token và mẫu trong Cài
                  đặt → Zalo OA.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={sending}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
