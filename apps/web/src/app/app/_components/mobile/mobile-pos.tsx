"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  User, 
  Trash2, 
  Plus, 
  Minus,
  Barcode,
  History,
  X,
  SearchIcon,
  UserPlus,
  Coins,
  ArrowRight,
  LayoutGrid,
  List,
  CheckCircle2,
  Mic,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MobileFloatingCart } from "./mobile-floating-cart";
import { MobileCheckoutSheet } from "./mobile-checkout-sheet";

interface MobilePOSProps {
  products: any[];
  customers: any[];
  loading?: boolean;
}

export function MobilePOS({ products, customers, loading = false }: MobilePOSProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");

  // Tabs State
  interface OrderTab {
    id: string;
    cart: any[];
    selectedCustomer: any | null;
    orderId: number;
    title: string;
  }
  
  const [tabs, setTabs] = useState<OrderTab[]>([
    { id: '1', cart: [], selectedCustomer: null, orderId: 0, title: 'Đơn 1' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const cart = activeTab.cart;
  const selectedCustomer = activeTab.selectedCustomer;
  const orderId = activeTab.orderId;

  const setCart = (newCart: any[] | ((prev: any[]) => any[])) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, cart: typeof newCart === 'function' ? newCart(tab.cart) : newCart };
      }
      return tab;
    }));
  };

  const setSelectedCustomer = (customer: any | null) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, selectedCustomer: customer };
      }
      return tab;
    }));
  };

  const setOrderId = (id: number | ((prev: number) => number)) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        return { ...tab, orderId: typeof id === 'function' ? id(tab.orderId) : id };
      }
      return tab;
    }));
  };

  const addNewTab = () => {
    const newId = Date.now().toString();
    const newTitle = `Đơn ${tabs.length + 1}`;
    setTabs(prev => [...prev, {
      id: newId,
      cart: [],
      selectedCustomer: null,
      orderId: Math.floor(Date.now() % 10000),
      title: newTitle
    }]);
    setActiveTabId(newId);
  };

  const removeTab = (id: string) => {
    if (tabs.length === 1) return;
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  };

  useEffect(() => {
    setOrderId(Math.floor(Date.now() % 10000));
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`Đã thêm: ${product.name}`, { duration: 1000 });
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
    const matchesCategory = activeCategory === "Tất cả" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery)
  );

  const handleCheckoutSuccess = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderId(Math.floor(Date.now() % 10000));
  };

  const handleBarcodeScan = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Đang dò quét camera...",
        success: () => {
          if (products.length > 0) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            addToCart(randomProduct);
            return `Đã quét thêm: ${randomProduct.name}`;
          }
          return "Không tìm thấy sản phẩm";
        },
        error: "Quét thất bại"
      }
    );
  };

  const handleVoiceSearch = () => {
    toast.info("Tính năng Voice Search đang mở camera thu âm...");
  };

  return (
    <div className="flex flex-col h-full bg-background pb-12 animate-in fade-in duration-300">
      {/* POS HEADER */}
      <div className="flex flex-col gap-3.5 border-b pb-4">
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              Bán hàng POS
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Mã đơn hàng: #{orderId}</p>
          </div>
          
          <div className="flex gap-1.5">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-xl"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="w-4.5 h-4.5" /> : <LayoutGrid className="w-4.5 h-4.5" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-xl text-primary"
              onClick={handleBarcodeScan}
            >
              <Barcode className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        {/* TABS FOR MULTIPLE ORDERS */}
        <div className="max-h-[120px] overflow-y-auto scrollbar-none mx-[-16px] px-4">
          <div className="flex flex-wrap items-center gap-1.5 pb-2 pt-1">
            {tabs.map((tab, idx) => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center shrink-0 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors border ${activeTabId === tab.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-card text-muted-foreground border-muted hover:bg-muted'}`}
              >
                {tab.title}
                {tabs.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 shrink-0 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground"
              onClick={addNewTab}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Mới
            </Button>
          </div>
        </div>

        {/* ONE-HAND SEARCH BAR */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4.5 h-4.5" />
            <Input 
              id="mobile-search"
              placeholder="Tìm sản phẩm, mã vạch..." 
              className="pl-10 pr-10 h-11 bg-muted/40 border-none shadow-none rounded-xl text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={handleVoiceSearch}>
            <Mic className="w-4.5 h-4.5 text-muted-foreground" />
          </Button>
        </div>

        {/* HORIZONTAL CUSTOMER ASSIGN BUTTON */}
        <button 
          onClick={() => setCustomerSearchOpen(true)}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-muted-foreground/20 hover:bg-muted/40 transition-colors text-left active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <User className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">
                {selectedCustomer ? selectedCustomer.name : "Gắn khách hàng vào hóa đơn"}
              </p>
              {selectedCustomer && (
                <p className="text-[9px] text-muted-foreground font-semibold">{selectedCustomer.phone} • Tích lũy: {selectedCustomer.points} điểm</p>
              )}
            </div>
          </div>
          {selectedCustomer ? (
            <X className="w-4 h-4 text-muted-foreground shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} />
          ) : (
            <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {/* HORIZONTAL SWIPE CATEGORIES */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border snap-start active:scale-95 ${
                activeCategory === cat 
                  ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                  : "bg-card text-muted-foreground border-muted hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS SCROLL VIEW */}
      <div className="flex-1 overflow-y-auto pt-4 pr-1 scrollbar-none min-h-[40vh]">
        {filteredProducts.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 pb-24">
              {filteredProducts.map((prod) => (
                <Card 
                  key={prod.id} 
                  className="overflow-hidden border border-muted/50 rounded-lg active:scale-[0.97] transition-all bg-card flex flex-col justify-between"
                  onClick={() => addToCart(prod)}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img 
                      src={prod.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop"} 
                      alt={prod.name} 
                      className="w-full h-full object-cover"
                      onError={(e)=>{
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop";
                      }}
                    />
                    <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur-xs text-[9px] border-none font-bold">
                      Tồn {prod.stock ?? 0}
                    </Badge>
                  </div>
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-none">{prod.category}</p>
                      <h4 className="font-extrabold text-xs text-foreground line-clamp-1 leading-snug">{prod.name}</h4>
                    </div>
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-xs font-black text-primary font-mono">{formatCurrency(prod.price)}</span>
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5 pb-24">
              {filteredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  className="flex items-center gap-3 bg-card border border-muted/50 rounded-lg p-3 active:scale-[0.98] transition-all"
                  onClick={() => addToCart(prod)}
                >
                  <img 
                    src={prod.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop"} 
                    alt={prod.name} 
                    className="w-12 h-12 rounded-xl object-cover border"
                    onError={(e)=>{
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop";
                    }}
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="font-bold text-xs text-foreground truncate">{prod.name}</h4>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase">{prod.category} • Tồn: {prod.stock}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-black text-primary font-mono">{formatCurrency(prod.price)}</span>
                    <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-muted/20 border border-dashed rounded-lg">
            <p className="text-xs text-muted-foreground font-bold">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* FLOATING ACTION CART OR STICKY CHECKOUT TRIGGERS */}
      <MobileFloatingCart 
        itemCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
        totalAmount={total} 
        onClick={() => setCheckoutOpen(true)} 
      />

      {/* CUSTOMER SEARCH DRAWER */}
      <Drawer open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
        <DrawerContent className="pb-8 bg-background max-h-[85vh]">
          <DrawerHeader className="text-left border-b pb-3 px-6">
            <DrawerTitle className="text-base font-bold">Gắn khách hàng</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">Chọn hội viên tích điểm cho đơn hàng.</DrawerDescription>
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
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearchOpen(false); }}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/50 border transition-colors text-left bg-card active:scale-[0.99]"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{c.phone}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px]">{c.points} điểm</Badge>
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

      {/* MOBILE CHECKOUT DRAWER */}
      <MobileCheckoutSheet 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen} 
        total={total} 
        cart={cart} 
        selectedCustomer={selectedCustomer} 
        onCheckoutSuccess={handleCheckoutSuccess} 
        orderId={orderId} 
      />
    </div>
  );
}
