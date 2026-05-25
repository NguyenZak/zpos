"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertOctagon, BellRing, ChevronLeft, Loader2, Mail, Phone, Receipt, Settings, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  debtService,
  type CreditAccount,
  type DebtOrder,
  type DebtPayment,
  type DebtReminder,
  type DebtTransaction,
} from "@/services/debt.service";
import { LedgerTimeline } from "../../_components/ledger-timeline";
import { RecordPaymentDialog } from "../../_components/record-payment-dialog";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

const formatDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("vi-VN") : "—");

export default function CustomerDebtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = use(params);
  const router = useRouter();

  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
  const [orders, setOrders] = useState<DebtOrder[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [reminders, setReminders] = useState<DebtReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [acct, ledger, dorders, pays, rems] = await Promise.all([
        debtService.getCreditAccount(customerId),
        debtService.getCustomerLedger(customerId),
        debtService.getCustomerDebtOrders(customerId),
        debtService.getCustomerPayments(customerId),
        debtService.getCustomerReminders(customerId),
      ]);
      setAccount(acct);
      setTransactions(ledger);
      setOrders(dorders);
      setPayments(pays);
      setReminders(rems);
    } catch (e: any) {
      toast.error("Không tải được dữ liệu công nợ", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [customerId]);

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const r = await debtService.sendReminder({ customerId, rule: "manual", channel: "zalo" });
      if (r.status === "failed") {
        toast.error("Gửi nhắc nợ thất bại", { description: r.error_message || "Unknown error" });
      } else {
        toast.success("Đã gửi nhắc nợ qua Zalo");
        load();
      }
    } catch (e: any) {
      toast.error("Lỗi gửi nhắc nợ", { description: e?.message });
    } finally {
      setSendingReminder(false);
    }
  };

  const customer = account?.customer;
  const balance = Number(account?.current_balance ?? 0);
  const overdue = Number(account?.overdue_amount ?? 0);
  const limit = Number(account?.credit_limit ?? 0);
  const utilization = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
  const overLimit = balance > limit && limit > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => router.push("/debt/debtors")}>
          <ChevronLeft className="w-4 h-4" /> Danh sách khách nợ
        </Button>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div>
            <h1 className="text-3xl leading-none tracking-tight">
              {customer?.name || `Khách #${customerId.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              {customer?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {customer.phone}
                </span>
              )}
              {customer?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {customer.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/customers?focus=${customerId}`}>
                <Settings className="w-4 h-4" /> Hồ sơ KH
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendReminder} disabled={sendingReminder || balance <= 0}>
              {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
              Nhắc nợ
            </Button>
            <Button size="sm" onClick={() => setPaymentOpen(true)} disabled={balance <= 0}>
              <Wallet className="w-4 h-4" /> Thu tiền
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-red-600">Dư nợ hiện tại</p>
            <p className="text-2xl font-black text-red-600 mt-1">{fmt(balance)}</p>
            {overLimit && (
              <Badge variant="destructive" className="mt-1 text-[9px]">
                <AlertOctagon className="w-2.5 h-2.5 mr-0.5" /> Vượt hạn mức
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Quá hạn</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{fmt(overdue)}</p>
            {account?.last_charge_at && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Lần ghi nợ cuối: {formatDate(account.last_charge_at)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Hạn mức / Sử dụng</p>
            <p className="text-2xl font-black mt-1">{fmt(limit)}</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${utilization >= 100 ? "bg-red-500" : utilization >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${utilization}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{Math.round(utilization)}% sử dụng</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList>
          <TabsTrigger value="ledger">Sổ cái</TabsTrigger>
          <TabsTrigger value="orders">Đơn nợ ({orders.filter((o) => Number(o.debt_amount) > 0).length})</TabsTrigger>
          <TabsTrigger value="payments">Phiếu thu ({payments.length})</TabsTrigger>
          <TabsTrigger value="reminders">Nhắc nợ ({reminders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lịch sử giao dịch công nợ</CardTitle>
            </CardHeader>
            <CardContent>
              <LedgerTimeline transactions={transactions} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Đơn hàng ghi nợ</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground italic">Đang tải...</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-6">Chưa có đơn nợ.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => {
                    const outstanding = Number(o.debt_amount);
                    const overdueDays = o.days_overdue ?? 0;
                    return (
                      <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <p className="font-bold text-sm">#{o.order_number}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Tạo: {formatDate(o.created_at)} · Hạn: {formatDate(o.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            Tổng: <span className="font-bold">{fmt(Number(o.total_amount))}</span>
                          </p>
                          <p className="text-sm">
                            Còn nợ:{" "}
                            <span className={outstanding > 0 ? "font-bold text-red-600" : "text-emerald-600"}>
                              {fmt(outstanding)}
                            </span>
                          </p>
                          {overdueDays > 0 && (
                            <Badge variant="destructive" className="text-[9px] mt-0.5">
                              Quá hạn {overdueDays} ngày
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lịch sử phiếu thu</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground italic">Đang tải...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-6">Chưa có phiếu thu nào.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="font-bold text-sm flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5" />
                          {p.payment_no || `#${p.id.slice(0, 8)}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(p.payment_date)} · {p.method}
                          {p.reference ? ` · ref ${p.reference}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{fmt(Number(p.amount))}</p>
                        <Badge variant="outline" className="text-[9px]">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lịch sử nhắc nợ</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground italic">Đang tải...</p>
              ) : reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-6">Chưa gửi nhắc nợ nào.</p>
              ) : (
                <div className="space-y-2">
                  {reminders.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="font-bold text-sm flex items-center gap-2">
                          <BellRing className="w-3.5 h-3.5" /> {r.rule} · {r.channel}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : "—"}
                        </p>
                        {r.error_message && <p className="text-[10px] text-red-600 mt-0.5">{r.error_message}</p>}
                      </div>
                      <Badge variant={r.status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        customerId={customerId}
        customerName={customer?.name}
        currentBalance={balance}
        onSuccess={() => {
          setPaymentOpen(false);
          load();
        }}
      />
    </div>
  );
}
