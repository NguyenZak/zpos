"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import { Image as ImageIcon, Loader2, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertToWebP } from "@/lib/image-utils";
import { posService } from "@/services/pos.service";

import { ProductBarcodeField } from "./product-barcode-field";

interface EditProductDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditProductDialog({ product, open, onOpenChange, onSuccess }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku || "",
    barcode: product.barcode || "",
    category_id: product.category_id || "",
    price: product.price,
    stock: product.stock,
    image: product.image || "",
    barcode_type: product.barcode_type || "CODE128",
  });

  const [barcodeValid, setBarcodeValid] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiFindingImage, setAiFindingImage] = useState(false);

  useEffect(() => {
    if (open) {
      posService.getCategoryList().then(setCategories).catch(console.error);
      // Reset form to active product's values to prevent stale state issues
      setFormData({
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        category_id: product.category_id || "",
        price: product.price,
        stock: product.stock,
        image: product.image || "",
        barcode_type: product.barcode_type || "CODE128",
      });
    }
  }, [open, product]);

  const handleImageChange = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp tin hình ảnh hợp lệ!");
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Đang tối ưu hóa ảnh và tải lên...");

    try {
      // Compress to WebP client-side
      const webpFile = await convertToWebP(file, 0.8);

      const uploadForm = new FormData();
      uploadForm.append("file", webpFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể tải ảnh lên");
      }

      setFormData((prev) => ({ ...prev, image: json.url }));
      toast.success("Đã cập nhật ảnh sản phẩm thành công!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh thất bại", { id: toastId });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAiFindImage = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm trước khi yêu cầu AI tìm ảnh!");
      return;
    }

    setAiFindingImage(true);
    const toastId = toast.loading(`ZPOS AI đang tìm ảnh phù hợp cho "${formData.name}"...`);

    try {
      const res = await fetch(`/api/ai/product-image?name=${encodeURIComponent(formData.name)}`);
      const json = await res.json();

      if (!res.ok || !json.url) {
        throw new Error(json.error || "Không tìm thấy ảnh phù hợp");
      }

      setFormData((prev) => ({ ...prev, image: json.url }));
      toast.success("AI đã tìm và tự động đồng bộ ảnh thành công!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Không tìm thấy ảnh tương ứng trên mạng, bạn vui lòng tự tải lên.");
    } finally {
      setAiFindingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = formData.image;

      // Auto fallback to AI search if no image is uploaded
      if (!finalImageUrl && formData.name.trim()) {
        try {
          const aiToastId = toast.loading(`Đang tự động tìm ảnh thông minh cho "${formData.name}"...`);
          const res = await fetch(`/api/ai/product-image?name=${encodeURIComponent(formData.name)}`);
          const json = await res.json();
          if (res.ok && json.url) {
            finalImageUrl = json.url;
            toast.success("AI đã tự động khớp ảnh thành công!", { id: aiToastId });
          } else {
            toast.dismiss(aiToastId);
          }
        } catch (aiErr) {
          console.warn("Tự động tìm ảnh AI gặp lỗi, lưu không có ảnh", aiErr);
        }
      }

      if (!barcodeValid) {
        toast.error("Mã vạch không hợp lệ hoặc đã tồn tại. Vui lòng kiểm tra lại.");
        setLoading(false);
        return;
      }

      await posService.updateProduct(product.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price.toString()),
        stock: parseInt(formData.stock.toString(), 10),
        image: finalImageUrl || null,
        barcode_type: formData.barcode_type,
      });
      toast.success("Cập nhật sản phẩm thành công!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi khi cập nhật sản phẩm: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-semibold text-xl">
              <Package className="h-5 w-5" />
              Chỉnh sửa sản phẩm
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin chi tiết cho sản phẩm.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Product Image Uploader Box */}
            <div className="relative flex items-center gap-4 rounded-xl border bg-muted/10 p-3">
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              <button
                type="button"
                onClick={handleImageChange}
                className="group relative flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-muted-foreground/20 border-dashed bg-muted transition-all hover:bg-muted/85"
              >
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="font-bold text-[10px] text-white uppercase">Đổi ảnh</span>
                    </div>
                  </>
                ) : uploadingImage ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <ImageIcon className="mb-1 h-6 w-6 text-muted-foreground/40" />
                    <span className="font-bold text-[8px] text-muted-foreground uppercase">Tải ảnh</span>
                  </>
                )}
              </button>
              <div className="flex-1 space-y-1">
                <span className="block font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Hình ảnh sản phẩm
                </span>
                <p className="text-[10px] text-muted-foreground italic leading-normal">
                  Tải ảnh thực tế (webp nén) hoặc để trống để AI tự động tìm hình ảnh trên Internet khi lưu.
                </p>
                <div className="mt-1.5 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleImageChange}
                    disabled={uploadingImage}
                  >
                    Tải ảnh lên
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 gap-1 border-violet-500/20 bg-violet-500/10 font-bold text-violet-500 text-xs hover:bg-violet-500/20"
                    onClick={handleAiFindImage}
                    disabled={aiFindingImage || !formData.name.trim()}
                  >
                    {aiFindingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Tự Tìm Ảnh
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tên sản phẩm</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-sku">Mã SKU</Label>
                <Input
                  id="edit-sku"
                  className="bg-muted uppercase"
                  placeholder="Mã SP"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  disabled
                  title="Mã SKU không thể thay đổi sau khi tạo"
                />
              </div>
              <div className="mt-[-1rem] grid gap-2">
                <ProductBarcodeField
                  value={formData.barcode}
                  onChange={(val) => setFormData({ ...formData, barcode: val })}
                  originalBarcode={product.barcode}
                  onValidationChange={setBarcodeValid}
                  barcodeType={formData.barcode_type}
                  onBarcodeTypeChange={(val) => setFormData({ ...formData, barcode_type: val })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Danh mục</Label>
                <Select
                  defaultValue={formData.category_id}
                  onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Giá bán (₫)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Tồn kho hiện tại</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
