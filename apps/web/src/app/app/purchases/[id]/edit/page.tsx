"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Search, 
  Truck, 
  Package, 
  Loader2,
  Save,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { AddProductDialog } from "../../../products/_components/add-product-dialog";
import { VariantPickerDialog, PickedVariant } from "../../../pos/_components/variant-picker-dialog";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';

export default function EditPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("draft");
  const [searchTerm, setSearchTerm] = useState("");
  const [isVariantPickerOpen, setIsVariantPickerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const refreshProducts = async () => {
    try {
      const productsData = await posService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error(error);
    }
  };

  // Summary
  const subtotal = items.reduce((acc, item) => acc + (item.unit_cost * item.quantity), 0);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const totalAmount = subtotal - discount + shippingFee;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [suppliersData, productsData, orderDetail] = await Promise.all([
          posService.getSuppliers(),
          posService.getProducts(),
          posService.getPurchaseOrderDetail(id as string)
        ]);
        
        // Only show active suppliers
        setSuppliers(suppliersData.filter((s: any) => s.is_active !== false));
        setProducts(productsData);

        if (orderDetail) {
          if (orderDetail.status === 'completed' || orderDetail.status === 'cancelled') {
            toast.error("Không thể sửa đơn nhập hàng đã hoàn tất hoặc đã hủy");
            router.push(`/app/purchases/${id}`);
            return;
          }

          setCode(orderDetail.code);
          setSelectedSupplierId(orderDetail.supplier_id || "");
          setStatus(orderDetail.status);
          setNote(orderDetail.note || "");
          setDiscount(orderDetail.discount_amount || 0);
          setShippingFee(orderDetail.shipping_fee || 0);

          if (orderDetail.items) {
            setItems(orderDetail.items.map((item: any) => ({
              item_key: item.variant_id || item.product_id,
              product_id: item.product_id,
              variant_id: item.variant_id,
              name: item.product?.name ? (item.variant_id && item.sku ? `${item.product.name} - ${item.sku}` : item.product.name) : "Sản phẩm",
              sku: item.sku,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
              total_amount: item.total_amount
            })));
          }
        }
      } catch (error) {
        toast.error("Lỗi tải dữ liệu đơn hàng");
      } finally {
        setInitialLoading(false);
      }
    };
    if (id) {
      loadInitialData();
    }
  }, [id]);

  const handleProductSelect = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      setIsVariantPickerOpen(true);
    } else {
      addItem(product);
    }
  };

  const addItem = (product: any, variant?: PickedVariant) => {
    const variantId = variant?.id || null;
    const itemKey = variantId || product.id;
    const existing = items.find(i => i.item_key === itemKey);
    
    if (existing) {
      updateItem(itemKey, 'quantity', existing.quantity + 1);
    } else {
      const unitCost = variant ? variant.price * 0.7 : product.price * 0.7; // Suggest 70% of retail price as cost
      setItems([...items, {
        item_key: itemKey,
        product_id: product.id,
        variant_id: variantId,
        name: variant ? `${product.name} - ${variant.name}` : product.name,
        sku: variant?.sku || product.sku || product.barcode,
        quantity: 1,
        unit_cost: unitCost,
        total_amount: unitCost
      }]);
    }
  };

  const updateItem = (itemKey: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.item_key === itemKey) {
        const updated = { ...item, [field]: value };
        updated.total_amount = updated.unit_cost * updated.quantity;
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (itemKey: string) => {
    setItems(items.filter(i => i.item_key !== itemKey));
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) return toast.error("Vui lòng chọn nhà cung cấp");
    if (items.length === 0) return toast.error("Đơn hàng phải có ít nhất 1 sản phẩm");

    setLoading(true);
    try {
      const orderData = {
        supplier_id: selectedSupplierId,
        code,
        status,
        subtotal,
        discount_amount: discount,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        note
      };

      await posService.updatePurchaseOrder(id as string, orderData, items);
      toast.success("Đã cập nhật đơn nhập hàng", {
        description: `Mã đơn ${code} đã được cập nhật thành công.`
      });
      router.push(`/app/purchases/${id}`);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật đơn nhập:", error);
      toast.error(`Lỗi khi cập nhật đơn nhập: ${error.message || "Lỗi không xác định"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyValue = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCurrencyValue = (value: string) => {
    return parseFloat(value.replace(/,/g, "")) || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/purchases/${id}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Sửa đơn nhập hàng</h1>
          <p className="text-sm text-muted-foreground">Mã đơn: {code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Item Selection */}
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Danh sách sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Tìm sản phẩm để thêm vào đơn..." 
                    className="pl-10 h-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <AddProductDialog onShowSuccess={refreshProducts} />
              </div>

              {/* Temporary product list for demo selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                {products
                  .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 8)
                  .map(p => (
                  <Button key={p.id} variant="secondary" size="sm" onClick={() => handleProductSelect(p)}>
                    + {p.name}
                  </Button>
                ))}
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="w-[100px]">Số lượng</TableHead>
                      <TableHead className="w-[150px]">Giá nhập</TableHead>
                      <TableHead className="text-right w-[150px]">Thành tiền</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? items.map((item) => (
                      <TableRow key={item.item_key}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground">{item.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            className="h-8 w-20" 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.item_key, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="text" 
                            className="h-8" 
                            value={formatCurrencyValue(item.unit_cost)}
                            onChange={(e) => updateItem(item.item_key, 'unit_cost', parseCurrencyValue(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.item_key)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm italic">
                          Chưa có sản phẩm nào được chọn.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ghi chú & Thông tin thêm</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Nhập ghi chú cho đơn hàng này (VD: Thời gian giao hàng, ghi chú về chất lượng...)" 
                className="min-h-[100px] resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Mã đơn nhập</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Nhà cung cấp</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Nháp</SelectItem>
                    <SelectItem value="ordered">Đã đặt hàng</SelectItem>
                    <SelectItem value="receiving">Đang nhập kho</SelectItem>
                    <SelectItem value="completed">Hoàn tất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border-t-4 border-t-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-black">Thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiền hàng</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Chiết khấu</span>
                <Input 
                  type="text" 
                  className="h-7 w-24 text-right font-bold text-red-500" 
                  value={formatCurrencyValue(discount)} 
                  onChange={(e) => setDiscount(parseCurrencyValue(e.target.value))} 
                />
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <Input 
                  type="text" 
                  className="h-7 w-24 text-right font-bold" 
                  value={formatCurrencyValue(shippingFee)} 
                  onChange={(e) => setShippingFee(parseCurrencyValue(e.target.value))} 
                />
              </div>
              <div className="h-px bg-primary/20 my-2" />
              <div className="flex justify-between font-black text-xl text-primary">
                <span>TỔNG CỘNG</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
              <Button className="w-full font-bold h-12" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu đơn hàng
              </Button>
              <Button variant="outline" className="w-full" disabled={loading} onClick={() => router.push("/app/purchases")}>
                Hủy bỏ
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <VariantPickerDialog 
        product={selectedProduct} 
        open={isVariantPickerOpen} 
        onOpenChange={setIsVariantPickerOpen} 
        onConfirm={(variant) => addItem(selectedProduct, variant)}
        allowOutOfStock={true}
      />
    </div>
  );
}
