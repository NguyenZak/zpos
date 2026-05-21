"use client";

import React, { useState } from "react";

import { Image as ImageIcon, Loader2, Package, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertToWebP } from "@/lib/image-utils";
import { posService } from "@/services/pos.service";

import { ProductBarcodeField } from "./product-barcode-field";

export function AddProductDialog({ onShowSuccess }: { onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    stock: "",
    category_id: "",
    image: "",
    barcode_type: "CODE128",
  });

  const [barcodeValid, setBarcodeValid] = useState(true);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiFindingImage, setAiFindingImage] = useState(false);

  React.useEffect(() => {
    if (open) {
      posService.getCategoryList().then(setCategories).catch(console.error);
    }
  }, [open]);

  const generateSKU = async () => {
    try {
      const products = await posService.getProducts();
      const nextNumber = products.length + 1;
      const sku = `SP${nextNumber.toString().padStart(4, "0")}`;
      setFormData((prev) => ({ ...prev, sku }));
    } catch (error) {
      const random = Math.floor(1000 + Math.random() * 9000);
      setFormData((prev) => ({ ...prev, sku: `SP${random}` }));
    }
  };

  const handleImageChange = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const isImageFile = file.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name);
    if (!isImageFile) {
      toast.error("Vui lòng chọn tệp tin hình ảnh hợp lệ!");
      input.value = "";
      return;
    }

    setUploadingImage(true);
    const toastId = toast.loading("Đang tối ưu hóa ảnh và tải lên...");

    try {
      let uploadFile = file;

      try {
        uploadFile = await convertToWebP(file, 0.8);
      } catch (conversionError) {
        console.warn("Không thể chuyển ảnh sang WebP, tải ảnh gốc lên thay thế", conversionError);
        toast.loading("Không nén được ảnh trên thiết bị này, đang tải ảnh gốc lên...", { id: toastId });
      }

      const uploadForm = new FormData();
      uploadForm.append("file", uploadFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể tải ảnh lên");
      }

      setFormData((prev) => ({ ...prev, image: json.url }));
      toast.success("Đã tải ảnh sản phẩm thành công!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh thất bại", { id: toastId });
    } finally {
      setUploadingImage(false);
      input.value = "";
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
    if (uploadingImage) {
      toast.info("Ảnh đang được tải lên, vui lòng đợi hoàn tất rồi lưu sản phẩm.");
      return;
    }
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

      await posService.createProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        image: finalImageUrl || null,
        barcode_type: formData.barcode_type,
      });

      toast.success("Đã thêm sản phẩm thành công!");
      setOpen(false);
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        barcode_type: "CODE128",
        price: "",
        stock: "",
        category_id: "",
        image: "",
      });
      if (onShowSuccess) onShowSuccess();
    } catch (error: any) {
      console.error("createProduct error:", error);
      const msg = error?.message || error?.details || error?.hint || "Không rõ nguyên nhân";
      toast.error(`Lỗi khi thêm sản phẩm: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyValue = (value: string | number) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCurrencyValue = (value: string) => {
    return value.replace(/,/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 max-sm:h-9 max-sm:flex-1 max-sm:rounded-xl">
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </DialogTrigger>
      <DialogContent className="bottom-0 left-0 top-auto max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-b-none rounded-t-3xl p-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-[540px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <form onSubmit={handleSubmit} className="flex max-h-[92dvh] flex-col">
          <DialogHeader className="border-b bg-background/95 px-5 pb-4 pt-5 text-left backdrop-blur sm:px-6">
            <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold sm:text-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </span>
              <span>Thêm sản phẩm mới</span>
            </DialogTitle>
            <DialogDescription className="max-w-[34rem] text-xs leading-relaxed sm:text-sm">
              Nhập thông tin bán hàng, tồn kho và mã vạch cho sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {/* Product Image Uploader Box */}
            <div className="relative flex flex-col gap-3 rounded-2xl border bg-muted/20 p-3 sm:flex-row sm:items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*,.heic,.heif"
              />
              <button
                type="button"
                onClick={handleImageChange}
                className="group relative flex h-24 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-background p-0 transition-all hover:bg-muted/70 sm:h-20 sm:w-20 sm:shrink-0"
              >
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-[10px] font-bold text-white uppercase">Đổi ảnh</span>
                    </div>
                  </>
                ) : (
                  <>
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-muted-foreground/40 mb-1" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Tải ảnh</span>
                      </>
                    )}
                  </>
                )}
              </button>
              <div className="min-w-0 flex-1 space-y-2">
                <span className="block text-xs font-bold uppercase text-muted-foreground">Hình ảnh sản phẩm</span>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Tải ảnh thực tế hoặc để trống để AI tự tìm ảnh khi lưu.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs"
                    onClick={handleImageChange}
                    disabled={uploadingImage}
                  >
                    Tải ảnh lên
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1 rounded-xl border-violet-500/20 bg-violet-500/10 text-xs font-bold text-violet-500 hover:bg-violet-500/20"
                    onClick={handleAiFindImage}
                    disabled={aiFindingImage || !formData.name.trim()}
                  >
                    {aiFindingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Tự Tìm Ảnh
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
              <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">
                Tên sản phẩm
              </Label>
              <Input
                id="name"
                placeholder="Ví dụ: iPhone 15 Pro Max"
                className="h-10 rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 rounded-2xl border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
                <Label htmlFor="sku" className="text-xs font-bold uppercase text-muted-foreground">
                  Mã SKU
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    placeholder="Mã SP (Ví dụ: SP0001)"
                    className="h-10 flex-1 rounded-xl uppercase"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl px-3"
                    onClick={generateSKU}
                  >
                    Tự tạo
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
                <ProductBarcodeField
                  value={formData.barcode}
                  onChange={(val) => setFormData({ ...formData, barcode: val })}
                  onValidationChange={setBarcodeValid}
                  barcodeType={formData.barcode_type}
                  onBarcodeTypeChange={(val) => setFormData({ ...formData, barcode_type: val })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 rounded-2xl border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
                <Label htmlFor="category" className="text-xs font-bold uppercase text-muted-foreground">
                  Danh mục
                </Label>
                <Select onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
                  <SelectTrigger className="h-10 rounded-xl">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 rounded-2xl border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
                <Label htmlFor="price" className="text-xs font-bold uppercase text-muted-foreground">
                  Giá bán (₫)
                </Label>
                <Input
                  id="price"
                  type="text"
                  placeholder="25,000,000"
                  className="h-10 rounded-xl"
                  value={formatCurrencyValue(formData.price)}
                  onChange={(e) => setFormData({ ...formData, price: parseCurrencyValue(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2 rounded-2xl border bg-background p-3 sm:border-0 sm:bg-transparent sm:p-0">
                <Label htmlFor="stock" className="text-xs font-bold uppercase text-muted-foreground">
                  Tồn kho ban đầu
                </Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="10"
                  className="h-10 rounded-xl"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-0 rounded-none bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-xl sm:h-8 sm:rounded-lg"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-10 rounded-xl sm:h-8 sm:rounded-lg"
              disabled={loading || uploadingImage}
            >
              {(loading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploadingImage ? "Đang tải ảnh..." : "Lưu sản phẩm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
