"use client";

import React, { useState } from "react";
import { 
  Search, 
  ChevronRight, 
  CalendarDays,
  Printer, 
  Coins, 
  RotateCcw,
  ShoppingBag,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MobileOrdersProps {
  orders: any[];
  loading?: boolean;
}

export function MobileOrders({ orders, loading = false }: MobileOrdersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
  };

  const handlePrintReceipt = () => {
    toast.success(`Đang gửi lệnh in hóa đơn ${selectedOrder?.order_number} qua Bluetooth!`);
  };

  const handleRefundOrder = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Đang xử lý yêu cầu hoàn tiền...",
        success: "Đã cập nhật trạng thái đơn hàng: Đã hoàn tiền",
        error: "Hoàn tiền thất bại"
      }
    );
    setDrawerOpen(false);
  };

  // Filter logic
  const filteredOrders = orders.filter(ord => {
    const customerName = ord.customer?.name || "Khách vãng lai";
    const matchesSearch = ord.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "Tất cả" || 
      (statusFilter === "Thành công" && ord.status === "completed") ||
      (statusFilter === "Đang xử lý" && ord.status === "pending") ||
      (statusFilter === "Đã hoàn tiền" && ord.status === "refunded");

    return matchesSearch && matchesStatus;
  });

  const statusChips = ["Tất cả", "Thành công", "Đang xử lý", "Đã hoàn tiền"];

  const methodLabels: Record<string, string> = {
    cash: "Tiền mặt",
    transfer: "C.Khoản QR",
    bank: "C.Khoản QR",
    bank_transfer: "C.Khoản QR",
    card: "Thẻ ATM"
  };

  return (
    <div className="flex flex-col h-full bg-background pb-12 animate-in fade-in duration-300">
      {/* ORDERS HEADER */}
      <div className="flex flex-col gap-3.5 border-b pb-4">
        <div className="mt-2">
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            Danh sách đơn hàng
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Tra cứu hóa đơn & Trạng thái thanh toán</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4.5 h-4.5" />
          <Input 
            placeholder="Tìm mã đơn, tên khách hàng..." 
            className="pl-10 h-11 bg-muted/40 border-none shadow-none rounded-xl text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* STATUS FILTER CHIPS */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          {statusChips.map((status: string) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border snap-start active:scale-95 ${
                statusFilter === status 
                  ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                  : "bg-card text-muted-foreground border-muted hover:bg-muted"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS CARDS LIST */}
      <div className="flex-1 overflow-y-auto pt-4 pr-1 scrollbar-none pb-24">
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((ord) => {
              const custName = ord.customer?.name || "Khách vãng lai";
              const dateStr = new Date(ord.created_at).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit"
              }) + " - " + new Date(ord.created_at).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit"
              });

              return (
                <Card 
                  key={ord.id}
                  onClick={() => { setSelectedOrder(ord); setDrawerOpen(true); }}
                  className="border border-muted/50 rounded-2xl active:scale-[0.98] transition-all bg-card cursor-pointer"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground font-mono leading-none">{ord.order_number}</span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[8px] h-4.5 px-1 py-0 font-bold uppercase",
                            ord.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none",
                            ord.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none",
                            ord.status === "refunded" && "bg-destructive/10 text-destructive border-none"
                          )}
                        >
                          {ord.status === "completed" ? "Thành công" : ord.status === "refunded" ? "Hoàn tiền" : "Chờ"}
                        </Badge>
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{custName}</p>
                        <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          {dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-black font-mono text-primary">
                        {formatCurrency(ord.total_amount)}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">{methodLabels[ord.payment_method] || "Tiền mặt"}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border border-dashed rounded-2xl">
            <p className="text-xs text-muted-foreground font-bold">Không tìm thấy đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* DETAIL ORDER DRAWER */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="pb-8 bg-background max-h-[88vh]">
          {selectedOrder && (
            <>
              <DrawerHeader className="text-left border-b pb-3 px-6">
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <DrawerTitle className="text-base font-black tracking-tight flex items-center gap-2">
                      Chi tiết: {selectedOrder.order_number}
                    </DrawerTitle>
                    <DrawerDescription className="text-xs text-muted-foreground">
                      Ngày tạo: {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                    </DrawerDescription>
                  </div>
                  <DrawerClose asChild>
                    <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[50vh] scrollbar-none">
                {/* Status bar */}
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Trạng thái thanh toán</span>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-[9px] h-5.5 px-2.5 font-bold uppercase",
                      selectedOrder.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none",
                      selectedOrder.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none",
                      selectedOrder.status === "refunded" && "bg-destructive/10 text-destructive border-none"
                    )}
                  >
                    {selectedOrder.status === "completed" ? "Thành công" : selectedOrder.status === "refunded" ? "Hoàn tiền" : "Đang chờ"}
                  </Badge>
                </div>

                {/* Customer Details */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Khách hàng hội viên</span>
                  <div className="bg-card border border-muted/50 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-bold text-foreground">{selectedOrder.customer?.name || "Khách vãng lai"}</p>
                    {selectedOrder.customer?.phone && (
                      <p className="text-muted-foreground font-semibold">SĐT: {selectedOrder.customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Sản phẩm đã mua</span>
                  <div className="space-y-2">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-muted/40 text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-foreground truncate">
                              {item.variant?.product?.name || item.product_name || item.product?.name || item.name || "Sản phẩm ZPOS"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Số lượng: x{item.quantity ?? 1}</p>
                          </div>
                          <span className="font-black text-primary shrink-0 font-mono">
                            {formatCurrency((item.unit_price ?? item.price ?? item.price_per_item ?? selectedOrder.total_amount) * (item.quantity ?? 1))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl border border-muted/40 text-xs font-mono font-bold">
                        <span>Hóa đơn lẻ (Không phân tách món)</span>
                        <span className="text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment details */}
                <div className="bg-muted/40 rounded-xl border border-muted p-3 text-[10px] space-y-1.5 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phương thức</span>
                    <span className="uppercase text-foreground">{methodLabels[selectedOrder.payment_method] || "Tiền mặt"}</span>
                  </div>
                  <Separator className="border-dashed my-1" />
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-foreground">TỔNG THANH TOÁN</span>
                    <span className="text-primary font-mono">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <DrawerFooter className="px-6 gap-2 border-t pt-3 flex flex-row">
                <Button 
                  onClick={handlePrintReceipt}
                  className="h-12 text-sm font-bold flex-1 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2"
                >
                  <Printer className="w-4.5 h-4.5" />
                  In hóa đơn
                </Button>
                {selectedOrder.status !== "refunded" && (
                  <Button 
                    variant="outline"
                    onClick={handleRefundOrder}
                    className="h-12 text-sm font-bold flex-1 rounded-xl text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                    Hoàn tiền
                  </Button>
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
