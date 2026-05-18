"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, ShoppingBag, User, Calendar, CreditCard, Truck, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { VN_LOCATIONS } from "@/data/vn-locations";
import { IssueInvoiceButton } from "@/components/issue-invoice-button";

interface OrderDetailDialogProps {
  order: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
}

export function OrderDetailDialog({ order, open, onOpenChange, onPrint }: OrderDetailDialogProps) {
  const [shippingProvider, setShippingProvider] = React.useState('GHN');
  const [pushing, setPushing] = React.useState(false);
  const [shippingData, setShippingData] = React.useState<any>(null);
  const [shippingFee, setShippingFee] = React.useState(25000);

  // Shop Address details (Sender)
  const [shopStreet, setShopStreet] = React.useState("123 Lê Lợi");
  const [shopProvinceId, setShopProvinceId] = React.useState("79");
  const [shopWardId, setShopWardId] = React.useState("25747");

  // Customer Address details (Receiver)
  const [custStreet, setCustStreet] = React.useState("");
  const [custProvinceId, setCustProvinceId] = React.useState("79");
  const [custWardId, setCustWardId] = React.useState("25747");
  const [customerPhone, setCustomerPhone] = React.useState("");

  const getProvinceName = (id: string) => VN_LOCATIONS.find(p => p.id === id)?.name || "";
  const getWardName = (provId: string, wardId: string) => VN_LOCATIONS.find(p => p.id === provId)?.wards.find(w => w.id === wardId)?.name || "";

  const buildAddressStr = (street: string, wardId: string, provId: string) => {
    const w = getWardName(provId, wardId);
    const p = getProvinceName(provId);
    return [street, w, p].filter(Boolean).join(", ");
  };

  const fetchEstimatedFee = async (addr: string, providerCode: string) => {
    if (!addr.trim()) return;
    try {
      const res = await fetch("/api/shipping/calculate-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_address: addr,
          weight: 500
        })
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const quote = json.data.find((q: any) => q.provider === providerCode);
        if (quote) {
          setShippingFee(quote.fee);
        } else {
          setShippingFee(json.data[0].fee);
        }
      }
    } catch (e) {
      console.error("Lỗi tính phí ship:", e);
    }
  };

  // Helper to parse unstructured address to structured fields
  const parseAddress = (addressStr: string) => {
    let provinceId = "79"; // default HCMC
    let wardId = "25747"; // default first ward under HCMC
    let street = addressStr || "";

    if (addressStr) {
      const lower = addressStr.toLowerCase();
      // Find Province
      const matchedProvince = VN_LOCATIONS.find(p => lower.includes(p.name.toLowerCase()) || (p.id === "79" && (lower.includes("hcm") || lower.includes("hồ chí minh"))));
      if (matchedProvince) {
        provinceId = matchedProvince.id;
        // Find Ward
        const matchedWard = matchedProvince.wards.find(w => lower.includes(w.name.toLowerCase()) || lower.includes(w.name.toLowerCase().replace("phường ", "p.")));
        if (matchedWard) {
          wardId = matchedWard.id;
        } else {
          wardId = matchedProvince.wards[0]?.id || "";
        }
      }
    }
    return { provinceId, wardId, street };
  };

  const handleCustAddressChange = (street: string, wardId: string, provId: string) => {
    const fullCust = buildAddressStr(street, wardId, provId);
    if (fullCust) {
      fetchEstimatedFee(fullCust, shippingProvider);
    }
  };

  React.useEffect(() => {
    if (order) {
      // Parse shop address
      const storedShopAddr = typeof window !== 'undefined' ? (localStorage.getItem('zpos_biz_addr') || '') : '';
      const parsedShop = parseAddress(storedShopAddr || '123 Đường ABC, Quận 1, Thành phố Hồ Chí Minh');
      setShopStreet(parsedShop.street.split(',')[0]);
      setShopProvinceId(parsedShop.provinceId);
      setShopWardId(parsedShop.wardId);

      // Parse customer address
      const parsedCust = parseAddress(order.customer_address || '');
      setCustStreet(parsedCust.street.split(',')[0] || parsedCust.street);
      setCustProvinceId(parsedCust.provinceId);
      setCustWardId(parsedCust.wardId);

      setCustomerPhone(order.customer_phone || '');
      setShippingData(null); // Reset when order changes

      const fullCustAddr = buildAddressStr(parsedCust.street.split(',')[0] || parsedCust.street, parsedCust.wardId, parsedCust.provinceId);
      if (fullCustAddr) {
        fetchEstimatedFee(fullCustAddr, shippingProvider);
      }
    }
  }, [order]);

  React.useEffect(() => {
    const fullCust = buildAddressStr(custStreet, custWardId, custProvinceId);
    if (fullCust) {
      fetchEstimatedFee(fullCust, shippingProvider);
    }
  }, [shippingProvider]);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + " đ";
  };

  const handlePushShipping = async () => {
    const fullShop = buildAddressStr(shopStreet, shopWardId, shopProvinceId);
    const fullCust = buildAddressStr(custStreet, custWardId, custProvinceId);

    if (!fullShop.trim() || !fullCust.trim()) {
      alert("Vui lòng điền đầy đủ thông tin địa chỉ!");
      return;
    }
    setPushing(true);
    try {
      const res = await fetch("/api/shipping/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          provider: shippingProvider,
          shipping_fee: shippingFee,
          cod_amount: order.total_amount,
          from_address: fullShop,
          to_address: fullCust,
          customer_phone: customerPhone
        })
      });
      const json = await res.json();
      if (json.success) {
        setShippingData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPushing(false);
    }
  };

  const date = new Date(order.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Chi tiết đơn hàng <span className="text-primary font-black">#{order.order_number}</span>
              </DialogTitle>
              <Badge className={
                order.status === 'completed'
                  ? 'bg-green-500 hover:bg-green-600 text-white font-semibold'
                  : order.status === 'cancelled'
                    ? 'bg-red-500 hover:bg-red-600 text-white font-semibold'
                    : 'bg-yellow-500 hover:bg-yellow-600 font-semibold'
              }>
                {order.status === 'completed' ? 'Hoàn tất' : order.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
              </Badge>
            </div>
            <DialogDescription className="flex flex-wrap items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {format(date, "dd MMMM yyyy, HH:mm", { locale: vi })}
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                Thanh toán: <span className="font-semibold uppercase text-primary">
                  {order.payment_method === 'cash' ? 'Tiền mặt' : order.payment_method === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                </span>
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Customer Info */}
        <div className="py-4 border-b">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-3">
            <User className="w-4 h-4" /> Thông tin khách hàng
          </h3>
          <div className="p-3.5 rounded-xl bg-muted/40 border flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tên khách hàng:</span>
              <span className="font-bold">{order.customer_name || "Khách lẻ"}</span>
            </div>
          </div>
        </div>

        {/* Shipping Carrier Section */}
        <div className="py-4 border-b">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4" /> Vận chuyển & Giao hàng
          </h3>
          
          {shippingData ? (
            <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đơn vị vận chuyển:</span>
                <span className="font-bold text-orange-600">{shippingData.provider_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã vận đơn (Tracking):</span>
                <span className="font-mono font-bold flex items-center gap-1">
                  {shippingData.tracking_code}
                  <a href={shippingData.label_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    <ExternalLink className="w-3.5 h-3.5 text-orange-500 hover:text-orange-600" />
                  </a>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái vận đơn:</span>
                <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-[10px] font-bold">READY_TO_PICK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cước phí giao hàng:</span>
                <span className="font-semibold">{formatCurrency(shippingData.shipping_fee)}</span>
              </div>
            </div>
          ) : (() => {
            const selectedShopProvince = VN_LOCATIONS.find(p => p.id === shopProvinceId) || VN_LOCATIONS[0];
            const selectedShopWard = selectedShopProvince.wards.find(w => w.id === shopWardId) || selectedShopProvince.wards[0];

            const selectedCustProvince = VN_LOCATIONS.find(p => p.id === custProvinceId) || VN_LOCATIONS[0];
            const selectedCustWard = selectedCustProvince.wards.find(w => w.id === custWardId) || selectedCustProvince.wards[0];

            return (
              <div className="p-3.5 rounded-xl bg-muted/40 border space-y-3">
                {/* 🚚 Địa chỉ Gửi (Shop Sender) */}
                <div className="space-y-1.5 border-b pb-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    📍 Địa chỉ gửi hàng (Cửa hàng)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={shopProvinceId}
                      onChange={(e) => {
                        const provId = e.target.value;
                        setShopProvinceId(provId);
                        const prov = VN_LOCATIONS.find(p => p.id === provId)!;
                        setShopWardId(prov.wards[0]?.id || "");
                      }}
                      className="flex h-8 w-full rounded border bg-background px-2 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {VN_LOCATIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select
                      value={shopWardId}
                      onChange={(e) => setShopWardId(e.target.value)}
                      className="flex h-8 w-full rounded border bg-background px-2 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {selectedShopProvince.wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={shopStreet}
                    onChange={(e) => setShopStreet(e.target.value)}
                    className="flex h-8 w-full rounded border bg-background px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    placeholder="Số nhà, ngõ ngách, tên đường..."
                  />
                </div>

                {/* 📦 Địa chỉ Nhận (Customer Receiver) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      👤 Địa chỉ nhận hàng (Khách hàng)
                    </span>
                    {order.customer_name && (
                      <span className="text-[10px] font-bold text-primary">Khách: {order.customer_name}</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={custProvinceId}
                      onChange={(e) => {
                        const provId = e.target.value;
                        setCustProvinceId(provId);
                        const prov = VN_LOCATIONS.find(p => p.id === provId)!;
                        const nextW = prov.wards[0]?.id || "";
                        setCustWardId(nextW);
                        handleCustAddressChange(custStreet, nextW, provId);
                      }}
                      className="flex h-8 w-full rounded border bg-background px-2 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {VN_LOCATIONS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select
                      value={custWardId}
                      onChange={(e) => {
                        const wId = e.target.value;
                        setCustWardId(wId);
                        handleCustAddressChange(custStreet, wId, custProvinceId);
                      }}
                      className="flex h-8 w-full rounded border bg-background px-2 py-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      {selectedCustProvince.wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={custStreet}
                      onChange={(e) => setCustStreet(e.target.value)}
                      onBlur={() => handleCustAddressChange(custStreet, custWardId, custProvinceId)}
                      className="col-span-2 flex h-8 w-full rounded border bg-background px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="Số nhà, ngõ ngách, tên đường..."
                    />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="flex h-8 w-full rounded border bg-background px-2.5 py-1 text-xs font-mono font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="SĐT nhận..."
                    />
                  </div>
                </div>

                {/* 🚚 Chọn hãng Vận chuyển & Giá Ship */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Hãng vận chuyển
                    </span>
                    <select
                      value={shippingProvider}
                      onChange={(e) => setShippingProvider(e.target.value)}
                      className="flex h-8 w-full rounded border bg-background px-2 py-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-orange-600 border-orange-200"
                    >
                      <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                      <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
                      <option value="VIETTEL_POST">Viettel Post</option>
                      <option value="AHAMOVE">AhaMove</option>
                      <option value="LALAMOVE">Lalamove</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Cước ước tính
                    </span>
                    <input
                      type="number"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Number(e.target.value))}
                      className="flex h-8 w-full rounded border bg-background px-2.5 py-1 text-xs font-black text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={handlePushShipping}
                  disabled={pushing}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 text-xs h-8.5 mt-2"
                >
                  {pushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  Đẩy đơn sang hãng vận chuyển
                </Button>
              </div>
            );
          })()}
        </div>

        {/* Order Items */}
        <div className="py-4">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4" /> Danh sách sản phẩm mua
          </h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-center">SL</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(order.order_items || []).map((item: any, index: number) => {
                  const prodName = item.product_name || "Sản phẩm";
                  const variantName = item.variant_name && item.variant_name !== 'Default' ? ` (${item.variant_name})` : '';
                  return (
                    <tr key={index} className="hover:bg-muted/10">
                      <td className="p-3 font-semibold text-foreground">
                        {prodName}
                        {variantName && <span className="block text-xs font-normal text-muted-foreground mt-0.5">{variantName}</span>}
                      </td>
                      <td className="p-3 text-center font-bold text-muted-foreground">{item.quantity}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(item.total_price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="py-4 border-t space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Giảm giá:</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Thuế (VAT):</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between font-black text-lg border-t pt-3.5 text-foreground">
            <span>TỔNG THANH TOÁN:</span>
            <span className="text-primary font-black text-xl">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 font-bold" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <IssueInvoiceButton
            orderId={order.id}
            buyer={{
              name: order.customer?.name || order.customer_name || order.customers?.name,
              tax_code: order.customer?.tax_code || order.customer_tax_code,
              address: order.customer?.address || order.customer_address,
              email: order.customer?.email || order.customer_email,
              phone: order.customer?.phone || order.customer_phone,
            }}
            items={(order.items || order.order_items || []).map((it: any) => ({
              name: it.name || it.product_name || it.variant_name || "Sản phẩm",
              quantity: Number(it.quantity || 1),
              unit_price: Number(it.unit_price || it.price || 0),
              total: Number(it.total_price || (it.quantity || 1) * (it.unit_price || it.price || 0)),
            }))}
            variant="outline"
          />
          <Button className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white" onClick={onPrint}>
            <Printer className="w-4 h-4" /> In hóa đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
