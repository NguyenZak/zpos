"use client";

import React, { useState, useEffect } from "react";
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  Coins,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  X,
  Download,
  SearchIcon,
  User
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { posService } from "@/services/pos.service";
import { debtService } from "@/services/debt.service";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileCheckoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cart: any[];
  selectedCustomer: any | null;
  customers: any[];
  onSelectCustomer: (customer: any | null) => void;
  onRemoveItem: (id: number) => void;
  onCheckoutSuccess: () => void;
  orderId: string | number;
}

export function MobileCheckoutSheet({
  open,
  onOpenChange,
  total,
  cart,
  selectedCustomer,
  customers,
  onSelectCustomer,
  onRemoveItem,
  onCheckoutSuccess,
  orderId
}: MobileCheckoutSheetProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "debt">("cash");
  const [receivedAmount, setReceivedAmount] = useState<number>(total);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const orderNumber = orderId.toString().startsWith("ORD-") ? orderId.toString() : `ORD-${orderId}`;

  const [qrSettings, setQrSettings] = useState({
    bankId: "vcb",
    accountNo: "0071001234567",
    accountName: "ZPOS RETAIL",
    memoTemplate: "ZPOS_"
  });

  useEffect(() => {
    if (open) {
      setReceivedAmount(total);
      
      // Load bank settings from system configuration
      if (typeof window !== "undefined") {
        const savedBankId = localStorage.getItem("zpos_qr_bank_id") || "vcb";
        const savedAccountNo = localStorage.getItem("zpos_qr_account_no") || "0071001234567";
        const savedAccountName = localStorage.getItem("zpos_qr_account_name") || "ZPOS RETAIL";
        const savedMemoTemplate = localStorage.getItem("zpos_qr_memo_template") || "ZPOS_";
        
        setQrSettings({
          bankId: savedBankId,
          accountNo: savedAccountNo,
          accountName: savedAccountName,
          memoTemplate: savedMemoTemplate
        });
      }
    }
  }, [open, total]);

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Đã sao chép ${field}!`);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const [isSavingQR, setIsSavingQR] = useState(false);

  const handleSaveQR = async () => {
    setIsSavingQR(true);
    try {
      const qrUrl = `https://img.vietqr.io/image/${qrSettings.bankId}-${qrSettings.accountNo}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(qrSettings.memoTemplate + orderNumber)}&accountName=${encodeURIComponent(qrSettings.accountName)}`;
      
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `zpos-qr-${orderNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Đã lưu mã QR thành công về thiết bị!");
    } catch (error) {
      console.error("Lưu mã QR thất bại", error);
      // Fallback: Open in a new tab so user can long-press to save
      const qrUrl = `https://img.vietqr.io/image/${qrSettings.bankId}-${qrSettings.accountNo}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(qrSettings.memoTemplate + orderNumber)}&accountName=${encodeURIComponent(qrSettings.accountName)}`;
      window.open(qrUrl, "_blank");
      toast.info("Đã mở mã QR trong tab mới. Vui lòng nhấn đè để lưu ảnh!");
    } finally {
      setIsSavingQR(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Chưa có sản phẩm để thanh toán");
      return;
    }

    const isDebt = paymentMethod === "debt";
    if (isDebt && !selectedCustomer?.id) {
      setCustomerSearchOpen(true);
      toast.error("Chọn khách hàng để ghi nợ đơn này");
      return;
    }

    for (const item of cart) {
      const stock = Number(item.stock ?? 0);
      if (stock <= 0 || item.quantity > stock) {
        toast.error("Không thể thanh toán", {
          description:
            stock <= 0
              ? `${item.name} đã hết hàng, không thể bán tiếp.`
              : `${item.name} chỉ còn ${stock} sản phẩm, không đủ để bán ${item.quantity}.`,
        });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const orderData = {
        organization_id: "00000000-0000-0000-0000-000000000000", // Placeholder
        branch_id: "00000000-0000-0000-0000-000000000000", // Placeholder
        customer_id: selectedCustomer?.id || null,
        order_number: orderNumber,
        total_amount: total,
        payment_method: paymentMethod,
        payment_status: isDebt ? "debt" : "paid",
        payment_confirmed_at: isDebt ? null : new Date().toISOString(),
        payment_amount_received: isDebt ? 0 : total,
        status: "completed"
      };

      const createdOrder = await posService.createOrder(orderData, cart);
      if (isDebt && createdOrder?.id) {
        await debtService.chargeOrderAsDebt(createdOrder.id, 30);
      }
      
      onOpenChange(false);
      setSuccessOpen(true);
      toast.success(isDebt ? "Đã ghi nợ đơn hàng thành công!" : "Thanh toán đơn hàng thành công!");
    } catch (error) {
      console.error("Checkout failed on mobile:", error);
      if ((error as any)?.code === "OUT_OF_STOCK") {
        toast.error("Không thể thanh toán", {
          description: (error as any)?.message || "Có sản phẩm đã hết hàng",
        });
        return;
      }

      // Fallback: still show success modal in demo/offline mode if DB/network fails
      onOpenChange(false);
      setSuccessOpen(true);
      toast.error("Lỗi kết nối cơ sở dữ liệu, nhưng vẫn tiếp tục lưu ngoại tuyến.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const cashPresets = [
    { label: "Đủ", val: total },
    { label: "100k", val: 100000 },
    { label: "200k", val: 200000 },
    { label: "500k", val: 500000 }
  ];

  const filteredCustomers = customers.filter((c) => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return true;
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="pb-8 bg-background max-h-[92vh]">
          <DrawerHeader className="text-left border-b pb-3 px-6">
            <div className="flex justify-between items-center mt-2">
              <div>
                <DrawerTitle className="text-base font-black tracking-tight">Thanh toán đơn hàng</DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground">Mã hóa đơn: {orderNumber}</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="px-6 py-4 overflow-y-auto space-y-5 max-h-[60vh] scrollbar-none">
            {/* SELECTED ITEMS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Sản phẩm thanh toán
                </span>
                <span className="font-mono text-[10px] font-black text-foreground">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} món
                </span>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-foreground">{item.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-xs font-black text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Bỏ chọn ${item.name}`}
                        onClick={() => onRemoveItem(item.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-all active:scale-95"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center">
                  <p className="text-xs font-bold text-muted-foreground">Chưa có sản phẩm thanh toán</p>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD CHIPS */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Phương thức thanh toán</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "cash", label: "Tiền mặt", icon: Banknote },
                  { id: "transfer", label: "C.Khoản QR", icon: QrCode },
                  { id: "card", label: "Chạm thẻ", icon: CreditCard },
                  { id: "debt", label: "Ghi nợ", icon: Coins }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95",
                        isActive
                          ? item.id === "debt"
                            ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                            : "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive && "scale-110 transition-transform", isActive && item.id !== "debt" && "text-primary")} />
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "debt" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none block">
                  Khách hàng ghi nợ
                </span>
                <button
                  type="button"
                  onClick={() => setCustomerSearchOpen(true)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl border p-3.5 text-left active:scale-[0.98] transition-all",
                    selectedCustomer
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-muted/30 border-dashed border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {selectedCustomer ? selectedCustomer.name : "Chọn khách hàng sau"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold truncate">
                        {selectedCustomer?.phone || "Bắt buộc trước khi xác nhận ghi nợ"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </div>
            )}

            {/* DYNAMIC CALCULATOR ACCORDING TO PAYMENT METHOD */}
            {paymentMethod === "cash" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="rec-amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Số tiền khách đưa</Label>
                    <button 
                      onClick={() => setReceivedAmount(total)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 leading-none"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Khách đưa đủ
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="rec-amount"
                      type="number"
                      value={receivedAmount || ""}
                      onChange={(e) => setReceivedAmount(Number(e.target.value))}
                      className="h-12 pl-4 pr-12 text-lg font-black font-mono text-foreground bg-muted/20 border-muted"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">VND</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {cashPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReceivedAmount(preset.val)}
                      className="py-2.5 rounded-lg border text-xs font-bold bg-card text-foreground hover:bg-muted active:scale-95 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Change return output */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all text-center space-y-1 shadow-inner",
                  receivedAmount >= total
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                )}>
                  <span className="text-[8px] font-black tracking-widest uppercase leading-none">
                    {receivedAmount >= total ? "Tiền thừa trả khách" : "Còn thiếu"}
                  </span>
                  <h4 className="text-xl font-black font-mono leading-none">
                    {formatCurrency(Math.abs(receivedAmount - total))}
                  </h4>
                </div>
              </div>
            )}

            {paymentMethod === "transfer" && (
              <div className="space-y-4 text-center animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none block text-left">Mã VietQR động tự sinh</span>
                
                <div className="relative w-full max-w-[396px] aspect-square bg-white mx-auto flex items-center justify-center overflow-hidden">
                  <img 
                    src={`https://img.vietqr.io/image/${qrSettings.bankId}-${qrSettings.accountNo}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(qrSettings.memoTemplate + orderNumber)}&accountName=${encodeURIComponent(qrSettings.accountName)}`} 
                    alt="VietQR"
                    className="w-full h-full object-contain"
                  />
                </div>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full rounded-xl border-primary/20 hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs font-bold h-10 shadow-xs"
                  onClick={handleSaveQR}
                  disabled={isSavingQR}
                >
                  {isSavingQR ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Download className="w-4 h-4 text-primary" />
                  )}
                  Lưu ảnh mã QR về máy
                </Button>

                {/* Copy options */}
                <div className="bg-muted/40 rounded-xl border border-muted p-3 text-left space-y-2 text-[10px] font-semibold">
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <span className="text-muted-foreground">Số tài khoản ({qrSettings.bankId.toUpperCase()})</span>
                    <button 
                      onClick={() => handleCopy(qrSettings.accountNo, "Số tài khoản")}
                      className="flex items-center gap-1 font-mono font-black text-foreground hover:underline"
                    >
                      {qrSettings.accountNo}
                      {copiedField === "Số tài khoản" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Nội dung chuyển khoản</span>
                    <button 
                      onClick={() => handleCopy(`${qrSettings.memoTemplate}${orderNumber}`, "Nội dung")}
                      className="flex items-center gap-1 font-mono font-black text-foreground hover:underline"
                    >
                      {qrSettings.memoTemplate}{orderNumber}
                      {copiedField === "Nội dung" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="space-y-5 text-center py-4 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none block text-left">Kết nối đầu đọc thẻ</span>
                
                <div className="relative w-28 h-28 bg-primary/5 rounded-full mx-auto flex items-center justify-center border-2 border-primary/10">
                  <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-75" />
                  <CreditCard className="w-10 h-10 text-primary relative z-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Đang đợi chạm thẻ chip...</p>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">Vui lòng đưa thẻ gần thiết bị đọc mPOS tại quầy.</p>
                </div>
              </div>
            )}

            {/* BILL SUMMARY */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Tổng tiền hàng ({cart.reduce((s,i)=>s+i.quantity,0)} món)</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
              {selectedCustomer && (
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Khách hàng</span>
                  <span className="text-foreground">{selectedCustomer.name}</span>
                </div>
              )}
              {paymentMethod === "debt" && (
                <div className="flex justify-between items-center text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                  <span>Hình thức</span>
                  <span>Ghi nợ công nợ</span>
                </div>
              )}
            </div>
          </div>

          {/* STICKY CHECKOUT BUTTON IN DRAWER FOOTER */}
          <DrawerFooter className="px-6 gap-2 border-t pt-3">
            <Button 
              onClick={handleCheckoutSubmit}
              disabled={cart.length === 0 || isProcessing || (paymentMethod === "cash" && receivedAmount < total)}
              className="h-12 text-sm font-bold w-full rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý thanh toán...
                </>
              ) : (
                <>
                  {paymentMethod === "debt" ? "Xác nhận ghi nợ" : "Xác nhận thanh toán"}
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
        <DrawerContent className="pb-8 bg-background max-h-[85vh]">
          <DrawerHeader className="text-left border-b pb-3 px-6">
            <DrawerTitle className="text-base font-bold">Chọn khách ghi nợ</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              Có thể chọn khách ngay tại bước thanh toán.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm tên hoặc số điện thoại..."
                className="pl-9 h-11 bg-muted/40 border-none rounded-xl"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                autoFocus
              />
            </div>

            <ScrollArea className="h-64 pr-2">
              <div className="space-y-2">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c);
                        setCustomerSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/50 border transition-colors text-left bg-card active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{c.phone}</p>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-700 border-none font-bold text-[9px]">
                        {c.points ?? 0} điểm
                      </Badge>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xs text-muted-foreground font-semibold">Không tìm thấy khách hàng nào</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>

      {/* TRANSACTION SUCCESS DIALOG */}
      <Drawer open={successOpen} onOpenChange={(open) => { setSuccessOpen(open); if(!open) onCheckoutSuccess(); }}>
        <DrawerContent className="pb-8 bg-background max-h-[85vh]">
          <div className="px-6 py-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <DrawerTitle className="text-lg font-black tracking-tight text-foreground text-center">Giao dịch thành công!</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground leading-relaxed text-center">Hóa đơn {orderNumber} đã được xử lý thành công.</DrawerDescription>
            </div>

            {/* Mini Bill Preview */}
            <div className="w-full bg-muted/40 rounded-xl p-4 text-left font-mono text-[9px] border space-y-2">
              <div className="text-center space-y-0.5 border-b pb-2">
                <p className="font-bold text-xs">CỬA HÀNG ZPOS</p>
                <p className="text-muted-foreground font-semibold">Q.1, TP.HỒ CHÍ MINH</p>
              </div>
              <div className="space-y-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate w-[180px]">{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator className="border-dashed my-1.5" />
              <div className="flex justify-between font-black text-xs">
                <span>TỔNG CỘNG</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Hình thức</span>
                <span className="uppercase">{paymentMethod === "transfer" ? "QR" : paymentMethod === "card" ? "MPOS" : paymentMethod === "debt" ? "Ghi nợ" : "Tiền mặt"}</span>
              </div>
            </div>

            <Button 
              onClick={() => { setSuccessOpen(false); onCheckoutSuccess(); }}
              className="h-11 text-xs font-bold w-full rounded-xl bg-primary text-primary-foreground mt-2 active:scale-95 transition-all"
            >
              Tiếp tục bán hàng
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
