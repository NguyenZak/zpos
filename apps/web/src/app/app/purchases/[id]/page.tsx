"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  Loader2,
  CheckCircle,
  XCircle,
  Printer,
  FileText,
  Boxes,
  History,
  AlertCircle,
  Edit,
  CreditCard,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { posService } from "@/services/pos.service";
import { toast } from "sonner";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receivingOpen, setReceivingOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "card" | "other">("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [receivingItems, setReceivingItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const detail = await posService.getPurchaseOrderDetail(id as string);
      setData(detail);
      // Prepare items for receiving dialog
      setReceivingItems(detail.items.map((item: any) => ({
        ...item,
        receiving_qty: item.quantity - item.received_quantity
      })));
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết đơn nhập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  const handleReceiveStock = async () => {
    setProcessing(true);
    try {
      const receiveData = receivingItems
        .filter(i => i.receiving_qty > 0)
        .map(i => ({
          itemId: i.id,
          receivedQty: i.receiving_qty
        }));
      
      if (receiveData.length === 0) {
        toast.warning("Vui lòng nhập số lượng nhận thực tế");
        return;
      }

      await posService.receiveStock(id as string, receiveData);
      toast.success("Đã nhập kho thành công", {
        description: "Số lượng tồn kho sản phẩm đã được cập nhật."
      });
      setReceivingOpen(false);
      loadDetail();
    } catch (error) {
      console.error("Receive stock error:", error);
      toast.error(`Lỗi khi thực hiện nhập kho: ${(error as any)?.message || "Không xác định"}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'draft': return <Badge variant="outline" className="bg-slate-100 text-slate-700">Nháp</Badge>;
      case 'ordered': return <Badge variant="outline" className="bg-blue-100 text-blue-700">Đã đặt hàng</Badge>;
      case 'receiving': return <Badge variant="outline" className="bg-amber-100 text-amber-700">Đang nhập kho</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-700">Hoàn tất</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-red-100 text-red-700">Đã hủy</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.warning("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    setProcessing(true);
    try {
      await posService.recordSupplierPayment(
        data.supplier_id,
        paymentAmount,
        paymentMethod,
        [{ purchase_order_id: id as string, amount: paymentAmount }],
        { notes: paymentNote }
      );
      toast.success("Ghi nhận thanh toán thành công");
      setPaymentOpen(false);
      loadDetail();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Lỗi khi ghi nhận thanh toán: ${(error as any)?.message || "Không xác định"}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await posService.deletePurchaseOrder(id as string);
      toast.success("Đã xoá đơn nhập hàng");
      router.push('/app/purchases');
    } catch (error: any) {
      console.error("Lỗi xoá đơn:", error);
      toast.error(`Không thể xoá đơn: ${error.message || "Lỗi không xác định"}`);
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu đơn hàng...</p>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
      <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
      <p className="text-muted-foreground">Không tìm thấy dữ liệu đơn hàng.</p>
      <Button asChild><Link href="/app/purchases">Quay lại danh sách</Link></Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/purchases">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight">{data.code}</h1>
              {getStatusBadge(data.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Ngày tạo: {format(new Date(data.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> In phiếu
          </Button>
          {data.status !== 'completed' && data.status !== 'cancelled' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/purchases/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Sửa đơn
                </Link>
              </Button>
              <Button size="sm" onClick={() => setReceivingOpen(true)}>
                <Boxes className="mr-2 h-4 w-4" /> Nhập kho
              </Button>
            </>
          )}
          {data.payment_status !== 'paid' && data.debt_amount > 0 && (
            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => {
              setPaymentAmount(data.debt_amount);
              setPaymentOpen(true);
            }}>
              <CreditCard className="mr-2 h-4 w-4" /> Thanh toán
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20" onClick={() => setDeleteOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Xóa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Sản phẩm trong đơn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-center">Số lượng</TableHead>
                      <TableHead className="text-center">Đã nhận</TableHead>
                      <TableHead className="text-right">Giá nhập</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.product?.image && (
                              <img src={item.product.image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{item.product?.name || "N/A"}</span>
                              <span className="text-[10px] text-muted-foreground">{item.sku}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.received_quantity >= item.quantity ? 'default' : 'secondary'} className="text-[10px]">
                            {item.received_quantity} / {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Ghi chú
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.note || "Không có ghi chú."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Nhà cung cấp
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">{data.supplier?.name}</span>
                <span className="text-xs text-muted-foreground">{data.supplier?.phone}</span>
                <span className="text-xs text-muted-foreground">{data.supplier?.address}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/suppliers/${data.supplier?.id}`}>Xem hồ sơ NCC</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black">Thông tin thanh toán</CardTitle>
              {data.payment_status === 'paid' && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Đã trả đủ
                </Badge>
              )}
              {data.payment_status === 'partial' && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  Thanh toán 1 phần
                </Badge>
              )}
              {data.payment_status === 'unpaid' && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                  Chưa thanh toán
                </Badge>
              )}
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiền hàng</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chiết khấu</span>
                <span className="text-red-500">-{formatCurrency(data.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{formatCurrency(data.shipping_fee)}</span>
              </div>
              <div className="h-px bg-primary/20 my-2" />
              <div className="flex justify-between font-black text-xl text-primary">
                <span>TỔNG CỘNG</span>
                <span>{formatCurrency(data.total_amount)}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã thanh toán</span>
                  <span className="text-green-600 font-bold">{formatCurrency(data.paid_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Còn nợ</span>
                  <span className="text-destructive font-black">{formatCurrency(data.debt_amount || (data.total_amount - (data.paid_amount || 0)))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receiving Dialog */}
      <Dialog open={receivingOpen} onOpenChange={setReceivingOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Xác nhận nhập kho thực tế</DialogTitle>
            <DialogDescription>
              Kiểm tra và nhập số lượng thực tế nhận được từ nhà cung cấp để cập nhật tồn kho.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-center w-[100px]">Cần nhập</TableHead>
                  <TableHead className="text-center w-[120px]">Thực nhận</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivingItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.product?.name}</span>
                        <span className="text-[10px] text-muted-foreground">Chờ: {item.quantity - item.received_quantity} / Tổng: {item.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {item.quantity - item.received_quantity}
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        max={item.quantity - item.received_quantity}
                        min={0}
                        value={item.receiving_qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const newItems = [...receivingItems];
                          newItems[index].receiving_qty = Math.min(val, item.quantity - item.received_quantity);
                          setReceivingItems(newItems);
                        }}
                        className="h-8 text-center font-black text-primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReceivingOpen(false)}>Hủy</Button>
            <Button onClick={handleReceiveStock} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận nhập {receivingItems.filter(i => i.receiving_qty > 0).length} sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thanh toán cho Nhà cung cấp</DialogTitle>
            <DialogDescription>
              Ghi nhận số tiền đã trả cho đơn nhập này.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Số tiền thanh toán</Label>
              <Input 
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                max={data?.debt_amount}
                className="text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground">
                Còn nợ: {formatCurrency(data?.debt_amount || 0)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Phương thức</Label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Quẹt thẻ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Ghi chú (Tùy chọn)</Label>
              <Input 
                placeholder="Ví dụ: Chuyển khoản Vietcombank..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Hủy</Button>
            <Button onClick={handlePayment} disabled={processing || paymentAmount <= 0}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận trả {formatCurrency(paymentAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đơn nhập hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn nhập hàng <strong>{data?.code}</strong> không? 
              Hành động này không thể hoàn tác và sẽ xóa toàn bộ chi tiết của đơn này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
              Xóa đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
