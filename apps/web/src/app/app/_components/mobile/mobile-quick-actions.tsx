"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ScanBarcode, 
  ArrowDownToLine, 
  Tag, 
  UserPlus, 
  Sparkles,
  Search,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function MobileQuickActions() {
  const router = useRouter();
  
  // Sheet states
  const [stockInOpen, setStockInOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  // Input states
  const [stockSku, setStockSku] = useState("");
  const [stockQty, setStockQty] = useState("10");
  const [promoCode, setPromoCode] = useState("");
  const [promoVal, setPromoVal] = useState("15");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");

  const handleBarcodeScan = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Đang kích hoạt camera quét mã vạch...",
        success: "Đã tìm thấy sản phẩm: Sony WH-1000XM5 (8,500,000 ₫)",
        error: "Không nhận diện được mã vạch."
      }
    );
  };

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockSku) {
      toast.error("Vui lòng nhập mã vạch hoặc mã SKU");
      return;
    }
    toast.success(`Đã nhập thêm ${stockQty} sản phẩm cho SKU: ${stockSku}`);
    setStockInOpen(false);
    setStockSku("");
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }
    toast.success(`Đã tạo mã giảm giá: ${promoCode.toUpperCase()} (${promoVal}%)`);
    setDiscountOpen(false);
    setPromoCode("");
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) {
      toast.error("Vui lòng điền đầy đủ tên và số điện thoại");
      return;
    }
    toast.success(`Đã thêm khách hàng: ${custName} (${custPhone})`);
    setCustomerOpen(false);
    setCustName("");
    setCustPhone("");
  };

  const actions = [
    {
      label: "Tạo đơn nhanh",
      desc: "Vào POS",
      icon: Plus,
      color: "bg-primary text-primary-foreground shadow-md hover:bg-primary/95",
      action: () => router.push("/app/pos")
    },
    {
      label: "Quét mã vạch",
      desc: "Camera quét",
      icon: ScanBarcode,
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 dark:bg-sky-500/20",
      action: handleBarcodeScan
    },
    {
      label: "Nhập kho nhanh",
      desc: "+10 sản phẩm",
      icon: ArrowDownToLine,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20",
      action: () => setStockInOpen(true)
    },
    {
      label: "Tạo mã giảm",
      desc: "Khuyến mãi",
      icon: Tag,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20",
      action: () => setDiscountOpen(true)
    },
    {
      label: "Thêm khách mới",
      desc: "Đăng ký CRM",
      icon: UserPlus,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20",
      action: () => setCustomerOpen(true)
    }
  ];

  return (
    <div className="space-y-3.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
        Thao tác nhanh (1-Tap)
      </p>
      
      {/* Horizontal scrolling or grid wrap for fast tap */}
      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={act.action}
              className="flex-shrink-0 w-28 h-28 bg-card border border-muted/50 rounded-lg flex flex-col items-center justify-center p-3 text-center gap-2 select-none snap-start active:scale-95 transition-all"
            >
              <div className={`p-2.5 rounded-xl ${act.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground leading-tight truncate w-[88px]">{act.label}</p>
                <p className="text-[9px] text-muted-foreground font-semibold leading-none truncate w-[88px]">{act.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* QUICK STOCK-IN DRAWER */}
      <Drawer open={stockInOpen} onOpenChange={setStockInOpen}>
        <DrawerContent className="pb-8 bg-background">
          <form onSubmit={handleStockInSubmit}>
            <DrawerHeader className="text-left px-6">
              <DrawerTitle className="text-base font-bold">Nhập kho nhanh</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Quét SKU hoặc nhập mã vạch để cộng dồn tồn kho của sản phẩm tức thì.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="stock-sku" className="text-xs font-bold text-muted-foreground uppercase">Mã vạch hoặc SKU</Label>
                <div className="relative">
                  <Input 
                    id="stock-sku" 
                    placeholder="Quét hoặc nhập mã SKU (e.g. 123456789)..." 
                    value={stockSku} 
                    onChange={(e) => setStockSku(e.target.value)}
                    className="h-11 bg-muted/40 border-none pr-10" 
                    autoFocus
                  />
                  <ScanBarcode className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock-qty" className="text-xs font-bold text-muted-foreground uppercase">Số lượng thêm</Label>
                <Input 
                  id="stock-qty" 
                  type="number" 
                  value={stockQty} 
                  onChange={(e) => setStockQty(e.target.value)}
                  className="h-11 bg-muted/40 border-none" 
                />
              </div>
            </div>
            <DrawerFooter className="px-6 gap-2 mt-4">
              <Button type="submit" className="h-12 text-sm font-bold w-full rounded-xl bg-primary text-primary-foreground">
                Xác nhận cộng kho
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="h-11 text-xs font-semibold w-full rounded-xl">Hủy</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* QUICK DISCOUNT DRAWER */}
      <Drawer open={discountOpen} onOpenChange={setDiscountOpen}>
        <DrawerContent className="pb-8 bg-background">
          <form onSubmit={handleDiscountSubmit}>
            <DrawerHeader className="text-left px-6">
              <DrawerTitle className="text-base font-bold">Tạo mã giảm giá mới</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Tạo mã khuyến mãi để kích cầu kinh doanh tại quầy.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="promo-code" className="text-xs font-bold text-muted-foreground uppercase">Mã code</Label>
                <Input 
                  id="promo-code" 
                  placeholder="Ví dụ: HELLOZPOS, SALE20..." 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="h-11 bg-muted/40 border-none font-bold uppercase tracking-wider" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-val" className="text-xs font-bold text-muted-foreground uppercase">Mức giảm (%)</Label>
                <Input 
                  id="promo-val" 
                  type="number" 
                  value={promoVal} 
                  onChange={(e) => setPromoVal(e.target.value)}
                  className="h-11 bg-muted/40 border-none" 
                />
              </div>
            </div>
            <DrawerFooter className="px-6 gap-2 mt-4">
              <Button type="submit" className="h-12 text-sm font-bold w-full rounded-xl bg-primary text-primary-foreground">
                Phát hành Voucher
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="h-11 text-xs font-semibold w-full rounded-xl">Hủy</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* QUICK CUSTOMER DRAWER */}
      <Drawer open={customerOpen} onOpenChange={setCustomerOpen}>
        <DrawerContent className="pb-8 bg-background">
          <form onSubmit={handleCustomerSubmit}>
            <DrawerHeader className="text-left px-6">
              <DrawerTitle className="text-base font-bold">Thêm khách hàng nhanh</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Đăng ký hội viên mới trực tiếp để tích điểm.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name" className="text-xs font-bold text-muted-foreground uppercase">Tên khách hàng</Label>
                <Input 
                  id="cust-name" 
                  placeholder="Nhập tên khách..." 
                  value={custName} 
                  onChange={(e) => setCustName(e.target.value)}
                  className="h-11 bg-muted/40 border-none" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-xs font-bold text-muted-foreground uppercase">Số điện thoại</Label>
                <Input 
                  id="cust-phone" 
                  type="tel" 
                  placeholder="Ví dụ: 0901234567..." 
                  value={custPhone} 
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="h-11 bg-muted/40 border-none font-mono" 
                />
              </div>
            </div>
            <DrawerFooter className="px-6 gap-2 mt-4">
              <Button type="submit" className="h-12 text-sm font-bold w-full rounded-xl bg-primary text-primary-foreground">
                Đăng ký hội viên
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="h-11 text-xs font-semibold w-full rounded-xl">Hủy</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
