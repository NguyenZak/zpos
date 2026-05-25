"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { Loader2, AlertCircle, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditOrderDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditOrderDialog({ orderId, open, onOpenChange, onSuccess }: EditOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>("");

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails();
      posService.getProducts().then(setAllProducts).catch(console.error);
    }
  }, [open, orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await posService.getOrderDetails(orderId!);
      setOrderDetails(data);
      setStatus(data.status);
      setPaymentMethod(data.payment_method);
      setTotalAmount(data.total_amount || 0);

      let rawAddr = data.customer?.address || "";
      if (rawAddr.includes("::")) {
        rawAddr = rawAddr.split("::").slice(1).join("::");
      }
      setCustomerName(data.customer?.name || "");
      setCustomerPhone(data.customer?.phone || "");
      setCustomerAddress(rawAddr);
      setOrderItems(data.order_items || []);
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết đơn hàng");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const addableItems = React.useMemo(() => {
    const list: any[] = [];
    allProducts.forEach((p: any) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          list.push({
            id: v.id,
            name: `${p.name} - ${v.name}`,
            price: v.price || p.price || 0,
          });
        });
      } else {
        list.push({
          id: p.id,
          name: p.name,
          price: p.price || 0,
        });
      }
    });
    return list;
  }, [allProducts]);

  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const updated = [...orderItems];
    updated[index].quantity = newQty;
    updated[index].total_price = newQty * updated[index].unit_price;
    setOrderItems(updated);

    // Recalculate totalAmount
    const newTotal = updated.reduce((sum, item) => sum + item.total_price, 0);
    setTotalAmount(newTotal);
  };

  const handleRemoveItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);

    // Recalculate totalAmount
    const newTotal = updated.reduce((sum, item) => sum + item.total_price, 0);
    setTotalAmount(newTotal);
  };

  const handleAddItem = (itemId: string) => {
    if (!itemId) return;
    const matched = addableItems.find((item) => item.id === itemId);
    if (!matched) return;

    const existingIndex = orderItems.findIndex((item) => item.variant_id === matched.id);
    if (existingIndex > -1) {
      handleQuantityChange(existingIndex, orderItems[existingIndex].quantity + 1);
    } else {
      const newItem = {
        variant_id: matched.id,
        product_name: matched.name,
        quantity: 1,
        unit_price: matched.price,
        total_price: matched.price,
      };
      const updated = [...orderItems, newItem];
      setOrderItems(updated);

      const newTotal = updated.reduce((sum, item) => sum + item.total_price, 0);
      setTotalAmount(newTotal);
    }

    setSelectedProductToAdd("");
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      let customerId = orderDetails.customer_id;

      if (customerName.trim()) {
        if (customerId) {
          await posService.updateCustomer(customerId, {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
          });
        } else {
          const newCust = await posService.createCustomer({
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
          });
          customerId = newCust.id;
        }
      }

      // Update order items (inserts, updates, deletes)
      await posService.updateOrderItems(orderId!, orderItems);

      await posService.updateOrder(orderId!, {
        status,
        payment_method: paymentMethod,
        total_amount: Number(totalAmount),
        customer_id: customerId,
      });
      toast.success("Đã cập nhật đơn hàng", {
        description: `Mã đơn #${orderDetails.order_number} đã được cập nhật.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật đơn hàng");
    } finally {
      setSaving(false);
    }
  };

  if (!orderId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chỉnh sửa đơn hàng
            {orderDetails && <span className="text-primary">#{orderDetails.order_number}</span>}
          </DialogTitle>
          <DialogDescription>Cập nhật trạng thái xử lý và thông tin thanh toán của đơn hàng.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang lấy dữ liệu...</p>
          </div>
        ) : (
          orderDetails && (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Khách hàng */}
              <div className="grid gap-3 p-4 bg-muted/30 rounded-xl border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Thông tin khách hàng
                </span>
                <div className="grid gap-2">
                  <Label htmlFor="cust_name" className="text-xs font-bold">
                    Tên khách hàng
                  </Label>
                  <Input
                    id="cust_name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 font-semibold text-xs"
                    placeholder="Nhập tên khách hàng..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="grid gap-2">
                    <Label htmlFor="cust_phone" className="text-xs font-bold">
                      Số điện thoại
                    </Label>
                    <Input
                      id="cust_phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-9 font-mono font-bold text-xs"
                      placeholder="SĐT..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cust_addr" className="text-xs font-bold">
                      Địa chỉ giao hàng
                    </Label>
                    <Input
                      id="cust_addr"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="Địa chỉ..."
                    />
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm mua (Editable) */}
              <div className="grid gap-3 p-4 rounded-xl border bg-background">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary" /> Sản phẩm trong đơn
                  </span>
                  <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {orderItems.length} MẶT HÀNG
                  </span>
                </div>

                {/* Thêm sản phẩm nhanh */}
                <div className="flex gap-2 items-center">
                  <Select value={selectedProductToAdd} onValueChange={handleAddItem}>
                    <SelectTrigger className="h-9 text-xs font-bold flex-1 bg-muted/30">
                      <SelectValue placeholder="➕ Thêm sản phẩm vào đơn..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {addableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="text-xs font-semibold">
                          {item.name} (
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bảng sản phẩm */}
                {orderItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground font-semibold bg-muted/10 rounded-lg border border-dashed">
                    Đơn hàng trống. Hãy chọn sản phẩm ở trên để thêm.
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-muted/40 p-2.5 font-bold text-muted-foreground border-b text-[10px] uppercase">
                      <div className="col-span-5">Sản phẩm</div>
                      <div className="col-span-3 text-center">Số lượng</div>
                      <div className="col-span-3 text-right">Thành tiền</div>
                      <div className="col-span-1"></div>
                    </div>
                    <div className="divide-y max-h-[160px] overflow-y-auto">
                      {orderItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 p-2 items-center hover:bg-muted/5">
                          <div className="col-span-5 font-semibold text-foreground truncate pr-1">
                            {item.product_name || "Sản phẩm"}
                            {item.variant_name && (
                              <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                                ({item.variant_name})
                              </span>
                            )}
                          </div>
                          <div className="col-span-3 flex items-center justify-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              type="button"
                              className="w-5.5 h-5.5 rounded-full p-0 flex items-center justify-center"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </Button>
                            <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              type="button"
                              className="w-5.5 h-5.5 rounded-full p-0 flex items-center justify-center"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                          <div className="col-span-3 text-right font-bold text-primary">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                              item.total_price,
                            )}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              className="w-6 h-6 hover:text-red-600 text-muted-foreground p-0 flex items-center justify-center"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chi tiết đơn */}
              <div className="grid gap-3 p-4 rounded-xl border bg-background">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Thông tin thanh toán
                </span>

                <div className="grid gap-2">
                  <Label htmlFor="total_amount" className="text-xs font-bold">
                    Tổng tiền hóa đơn (VNĐ)
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="h-9 font-bold text-primary text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-xs font-bold">
                      Trạng thái
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status" className="h-9 text-xs font-semibold">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending" className="text-xs font-semibold">
                          Đang xử lý
                        </SelectItem>
                        <SelectItem value="completed" className="text-xs font-semibold text-green-600">
                          Đã hoàn tất
                        </SelectItem>
                        <SelectItem value="cancelled" className="text-xs font-semibold text-red-600">
                          Đã hủy
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="payment_method" className="text-xs font-bold">
                      Phương thức
                    </Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="payment_method" className="h-9 text-xs font-semibold">
                        <SelectValue placeholder="Chọn phương thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="text-xs font-semibold">
                          Tiền mặt
                        </SelectItem>
                        <SelectItem value="card" className="text-xs font-semibold">
                          Thẻ ngân hàng
                        </SelectItem>
                        <SelectItem value="transfer" className="text-xs font-semibold">
                          Chuyển khoản
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-amber-500/5 p-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-[11px] text-amber-700 leading-relaxed">
                  Việc thay đổi trạng thái đơn hàng sẽ ảnh hưởng đến báo cáo doanh thu và tồn kho. Hãy chắc chắn trước
                  khi lưu.
                </div>
              </div>
            </div>
          )
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleUpdate} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
