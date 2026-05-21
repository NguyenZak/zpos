"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import { Check, Image as ImageIcon, Layers, Loader2, Package, Plus, Sparkles, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { convertToWebP } from "@/lib/image-utils";
import { posService } from "@/services/pos.service";

import { ProductBarcodeField } from "./product-barcode-field";
import { BarcodeTypeSelector } from "./barcode-type-selector";
import { type AttributeDef, buildVariantKey, VariantBuilder, type VariantRow } from "./variant-builder";

interface EditProductDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode?: "edit" | "copy";
}


function deriveAttributesFromVariants(rawVariants: any[]): AttributeDef[] {
  const map = new Map<string, Set<string>>();
  rawVariants.forEach((v) => {
    const attrs = v?.attributes || {};
    Object.entries(attrs).forEach(([k, val]) => {
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(String(val));
    });
  });
  return Array.from(map.entries()).map(([name, values]) => ({
    id: crypto.randomUUID(),
    name,
    values: Array.from(values),
  }));
}

function mapVariantRows(rawVariants: any[]): VariantRow[] {
  return rawVariants.map((v) => {
    const attrs = v?.attributes || {};
    const name = v?.name || Object.values(attrs).join(" / ");
    return {
      id: v.id,
      key: buildVariantKey(attrs),
      attributes: attrs,
      name,
      sku: v.sku || "",
      barcode: v.barcode || "",
      barcode_type: v.barcode_type || "CODE128",
      price: v.price?.toString() || "",
      cost_price: v.cost_price?.toString() || "",
      stock: v.stock?.toString() || "0",
      image: v.image_url || "",
    };
  });
}

export function EditProductDialog({ product, open, onOpenChange, onSuccess, mode = "edit" }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku || "",
    barcode: product.barcode || "",
    category_id: product.category_id || "",
    supplier_id: product.supplier_id || "",
    price: product.price,
    cost_price: product.cost_price || "",
    stock: product.stock,
    image: product.image || "",
    barcode_type: product.barcode_type || "CODE128",
  });

  const [barcodeValid, setBarcodeValid] = useState(true);

  const initialVariants = Array.isArray(product.variants) ? product.variants : [];
  const [hasVariants, setHasVariants] = useState(initialVariants.length > 0);
  const [attributes, setAttributes] = useState<AttributeDef[]>(deriveAttributesFromVariants(initialVariants));
  const [variants, setVariants] = useState<VariantRow[]>(mapVariantRows(initialVariants));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiFindingImage, setAiFindingImage] = useState(false);

  const generateSKU = async () => {
    try {
      const products = await posService.getProducts();
      const nextNumber = products.length + 1;
      const sku = `SP${nextNumber.toString().padStart(4, "0")}`;
      setFormData((prev) => ({ ...prev, sku }));
    } catch (_error) {
      const random = Math.floor(1000 + Math.random() * 9000);
      setFormData((prev) => ({ ...prev, sku: `SP${random}` }));
    }
  };

  useEffect(() => {
    if (open) {
      posService.getCategoryList().then(setCategories).catch(console.error);
      posService.getSuppliers().then(setSuppliers).catch(console.error);
      // Reset form to active product's values to prevent stale state issues
      setFormData({
        name: mode === "copy" ? `${product.name} (Bản sao)` : product.name,
        sku: mode === "copy" ? "" : product.sku || "",
        barcode: mode === "copy" ? "" : product.barcode || "",
        category_id: product.category_id || "",
        supplier_id: product.supplier_id || "",
        price: product.price,
        cost_price: product.cost_price || "",
        stock: product.stock,
        image: product.image || "",
        barcode_type: product.barcode_type || "CODE128",
      });
      const raw = Array.isArray(product.variants) ? product.variants : [];
      setHasVariants(raw.length > 0);
      setAttributes(deriveAttributesFromVariants(raw));
      setVariants(mapVariantRows(raw).map(v => mode === "copy" ? { ...v, sku: "", barcode: "", id: undefined } : v));
      
      if (mode === "copy" && raw.length === 0) {
        generateSKU();
      }
    }
  }, [open, product, mode]);

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    const duplicate = categories.find((c) => c.name?.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setFormData((prev) => ({ ...prev, category_id: duplicate.id }));
      setCreatingCategory(false);
      setNewCategoryName("");
      toast.info(`Danh mục "${duplicate.name}" đã tồn tại, đã chọn sẵn.`);
      return;
    }

    setSavingCategory(true);
    try {
      const created = await posService.createCategory({ name, description: "", is_active: true });
      setCategories((prev) => [...prev, { ...created, product_count: 0 }]);
      setFormData((prev) => ({ ...prev, category_id: created.id }));
      setCreatingCategory(false);
      setNewCategoryName("");
      toast.success(`Đã thêm danh mục "${name}"`);
    } catch (err: any) {
      console.error("createCategory error:", err);
      toast.error(`Không thể tạo danh mục: ${err?.message || "Lỗi không xác định"}`);
    } finally {
      setSavingCategory(false);
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
      toast.success("Đã cập nhật ảnh sản phẩm thành công!", { id: toastId });
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

      if (!hasVariants && !barcodeValid) {
        toast.error("Mã vạch không hợp lệ hoặc đã tồn tại. Vui lòng kiểm tra lại.");
        setLoading(false);
        return;
      }

      if (hasVariants) {
        if (variants.length === 0) {
          toast.error("Vui lòng khai báo thuộc tính và sinh ít nhất 1 biến thể.");
          setLoading(false);
          return;
        }
        const missingPrice = variants.find((v) => !v.price || parseFloat(v.price) <= 0);
        if (missingPrice) {
          toast.error(`Biến thể "${missingPrice.name}" chưa có giá bán.`);
          setLoading(false);
          return;
        }
      }

      const variantPayload = hasVariants
        ? variants.map((v) => ({
            id: mode === "edit" ? v.id : undefined,
            name: v.name,
            sku: v.sku || null,
            barcode: v.barcode || null,
            barcode_type: v.barcode_type || "CODE128",
            price: parseFloat(v.price) || 0,
            cost_price: parseFloat(v.cost_price) || 0,
            stock: parseInt(v.stock, 10) || 0,
            image_url: v.image || null,
            attributes: v.attributes,
          }))
        : [];

      const basePrice = hasVariants
        ? Math.min(...variants.map((v) => parseFloat(v.price) || 0))
        : parseFloat(formData.price.toString());
      const baseCostPrice = hasVariants
        ? Math.min(...variants.map((v) => parseFloat(v.cost_price) || 0))
        : parseFloat(formData.cost_price.toString());
      const baseStock = hasVariants
        ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
        : parseInt(formData.stock.toString(), 10);

      if (mode === "copy") {
        await posService.createProduct({
          name: formData.name,
          sku: hasVariants ? null : formData.sku,
          barcode: hasVariants ? null : formData.barcode,
          category_id: formData.category_id || null,
          supplier_id: formData.supplier_id || null,
          price: basePrice,
          cost_price: baseCostPrice,
          stock: baseStock,
          image: finalImageUrl || null,
          barcode_type: hasVariants ? null : formData.barcode_type,
          variants: variantPayload,
        });
        toast.success("Đã thêm sản phẩm sao chép thành công!");
      } else {
        await posService.updateProduct(product.id, {
          name: formData.name,
          sku: hasVariants ? null : formData.sku,
          barcode: hasVariants ? null : formData.barcode,
          category_id: formData.category_id || null,
          supplier_id: formData.supplier_id || null,
          price: basePrice,
          cost_price: baseCostPrice,
          stock: baseStock,
          image: finalImageUrl || null,
          barcode_type: hasVariants ? null : formData.barcode_type,
          variants: variantPayload,
          has_variants: hasVariants,
        });
        toast.success("Cập nhật sản phẩm thành công!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(`Lỗi khi cập nhật sản phẩm: ${error.message}`);
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

  const variantPrices = variants.map((v) => parseFloat(v.price) || 0).filter((p) => p > 0);
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;

  const variantCostPrices = variants.map((v) => parseFloat(v.cost_price) || 0).filter((p) => p > 0);
  const minVariantCostPrice = variantCostPrices.length > 0 ? Math.min(...variantCostPrices) : 0;
  const maxVariantCostPrice = variantCostPrices.length > 0 ? Math.max(...variantCostPrices) : 0;
  
  const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  const fmtCompact = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}tr` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 left-0 top-auto max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-b-none rounded-t-3xl p-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-7xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <form onSubmit={handleSubmit} className="flex max-h-[92dvh] flex-col">
          <DialogHeader className="border-b bg-background/95 px-5 pb-4 pt-5 text-left backdrop-blur sm:px-6">
            <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold sm:text-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </span>
              <span>{mode === "copy" ? "Sao chép sản phẩm" : "Chỉnh sửa sản phẩm"}</span>
            </DialogTitle>
            <DialogDescription className="max-w-[34rem] text-xs leading-relaxed sm:text-sm">
              {mode === "copy" ? "Tạo mới một sản phẩm dựa trên thông tin đã có." : "Cập nhật thông tin bán hàng, tồn kho và mã vạch cho sản phẩm."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/10">
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Form Content (8 columns) */}
                <div className="space-y-6 lg:col-span-8">
                  {/* Basic Info Section */}
                  <div className="space-y-6 rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
                    <div>
                      <h3 className="text-base font-semibold">Thông tin cơ bản</h3>
                      <p className="text-sm text-muted-foreground">Hình ảnh, tên và danh mục sản phẩm</p>
                    </div>

                    {/* Product Image Uploader Box */}
                    <div className="relative flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center">
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
                        className="group relative flex h-28 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-background p-0 transition-all hover:bg-muted/70 sm:h-24 sm:w-24 sm:shrink-0"
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
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tải ảnh</span>
                              </>
                            )}
                          </>
                        )}
                      </button>
                      <div className="min-w-0 flex-1 space-y-2">
                        <span className="block text-sm font-semibold text-foreground">Hình ảnh sản phẩm</span>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Tải ảnh thực tế hoặc để trống để AI tự tìm ảnh khi lưu.
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:flex pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl text-xs"
                            onClick={handleImageChange}
                            disabled={uploadingImage}
                          >
                            Tải ảnh lên
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-9 gap-1.5 rounded-xl border-violet-500/20 bg-violet-500/10 text-xs font-bold text-violet-500 hover:bg-violet-500/20"
                            onClick={handleAiFindImage}
                            disabled={aiFindingImage || !formData.name.trim()}
                          >
                            {aiFindingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            AI Tự Tìm Ảnh
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="name" className="text-sm font-semibold text-foreground">
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
                      <div className="grid gap-3">
                        <Label htmlFor="category" className="text-sm font-semibold text-foreground">
                          Danh mục
                        </Label>
                        {creatingCategory ? (
                          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <Input
                              autoFocus
                              placeholder="Nhập tên danh mục mới..."
                              className="h-10 flex-1 rounded-xl border-primary/40 focus-visible:ring-primary/40"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCreateCategory();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  setCreatingCategory(false);
                                  setNewCategoryName("");
                                }
                              }}
                              disabled={savingCategory}
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="h-10 rounded-xl px-3"
                              onClick={handleCreateCategory}
                              disabled={savingCategory || !newCategoryName.trim()}
                              title="Lưu danh mục"
                            >
                              {savingCategory ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-10 rounded-xl px-3"
                              onClick={() => {
                                setCreatingCategory(false);
                                setNewCategoryName("");
                              }}
                              disabled={savingCategory}
                              title="Hủy"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={formData.category_id}
                            onValueChange={(val) => {
                              if (val === "CREATE_NEW_CATEGORY") {
                                setCreatingCategory(true);
                                return;
                              }
                              setFormData({ ...formData, category_id: val });
                            }}
                          >
                            <SelectTrigger id="category" className="h-10 w-full rounded-xl">
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                              {categories.length > 0 && <div className="h-px bg-muted my-1 mx-1" />}
                              <SelectItem
                                value="CREATE_NEW_CATEGORY"
                                className="text-primary focus:bg-primary/10 focus:text-primary font-medium cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  <span>Thêm danh mục mới...</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="supplier" className="text-sm font-semibold text-foreground">
                          Nhà cung cấp
                        </Label>
                        <Select
                          value={formData.supplier_id}
                          onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                        >
                          <SelectTrigger id="supplier" className="h-10 w-full rounded-xl">
                            <SelectValue placeholder="Chọn nhà cung cấp (Tuỳ chọn)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-muted-foreground italic">Không có / Bỏ qua</SelectItem>
                            {suppliers.map((sup) => (
                              <SelectItem key={sup.id} value={sup.id}>
                                {sup.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Inventory Section (Single Product) */}
                  {!hasVariants && (
                    <div className="space-y-6 rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
                      <div>
                        <h3 className="text-base font-semibold">Giá và kho</h3>
                        <p className="text-sm text-muted-foreground">Thiết lập giá bán và số lượng tồn kho ban đầu</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3 items-start">
                        <div className="grid gap-3">
                          <Label htmlFor="sku" className="text-sm font-semibold text-foreground">
                            Mã SKU
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="sku"
                              placeholder="Mã SP"
                              className={`h-10 flex-1 rounded-xl uppercase ${mode === "edit" ? "bg-muted" : ""}`}
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              disabled={mode === "edit"}
                              title={mode === "edit" ? "Mã SKU không thể thay đổi sau khi tạo" : ""}
                            />
                            {mode === "copy" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl px-3 shrink-0"
                                onClick={generateSKU}
                              >
                                Tự tạo
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <BarcodeTypeSelector
                            value={formData.barcode_type}
                            onChange={(val) => setFormData({ ...formData, barcode_type: val })}
                            labelClassName="text-sm font-semibold text-foreground"
                          />
                        </div>
                        <div className="grid gap-3">
                          <ProductBarcodeField
                            value={formData.barcode}
                            onChange={(val) => setFormData({ ...formData, barcode: val })}
                            originalBarcode={product.barcode}
                            onValidationChange={setBarcodeValid}
                            barcodeType={formData.barcode_type}
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-3">
                          <Label htmlFor="price" className="text-sm font-semibold text-foreground">
                            Giá bán (₫)
                          </Label>
                          <Input
                            id="price"
                            type="text"
                            placeholder="25,000,000"
                            className="h-10 rounded-xl"
                            value={formatCurrencyValue(formData.price)}
                            onChange={(e) => setFormData({ ...formData, price: parseCurrencyValue(e.target.value) })}
                            required={!hasVariants}
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="cost_price" className="text-sm font-semibold text-foreground">
                            Giá nhập (₫)
                          </Label>
                          <Input
                            id="cost_price"
                            type="text"
                            placeholder="20,000,000"
                            className="h-10 rounded-xl"
                            value={formatCurrencyValue(formData.cost_price)}
                            onChange={(e) => setFormData({ ...formData, cost_price: parseCurrencyValue(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="stock" className="text-sm font-semibold text-foreground">
                            Tồn kho
                          </Label>
                          <Input
                            id="stock"
                            type="number"
                            placeholder="10"
                            className="h-10 rounded-xl"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required={!hasVariants}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Variants Section */}
                  <div className="space-y-6 rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold">Phân loại hàng</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Thêm các phiên bản theo màu sắc, kích thước, chất liệu...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="has-variants" className="text-sm font-semibold cursor-pointer">
                          Sản phẩm có biến thể
                        </Label>
                        <Switch 
                          id="has-variants" 
                          checked={hasVariants} 
                          onCheckedChange={(v) => {
                            setHasVariants(v);
                            if (v && attributes.length === 0) {
                              setAttributes([{ id: crypto.randomUUID(), name: "Màu sắc", values: [] }]);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {hasVariants && (
                      <div className="pt-4 border-t">
                        <VariantBuilder
                          attributes={attributes}
                          onAttributesChange={setAttributes}
                          variants={variants}
                          onVariantsChange={setVariants}
                          parentName={formData.name}
                          skuPrefix={formData.sku}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar (4 columns) - Summary */}
                <div className="lg:col-span-4">
                  <div className="sticky top-0 space-y-6 rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
                    <h3 className="text-base font-semibold border-b pb-4">Tóm tắt sản phẩm</h3>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/50">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <p className="truncate font-semibold text-foreground">
                          {formData.name || "Tên sản phẩm..."}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {categories.find((c) => c.id === formData.category_id)?.name || "Chưa chọn danh mục"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Loại sản phẩm</span>
                        <span className="font-medium">{hasVariants ? "Nhiều biến thể" : "Sản phẩm đơn"}</span>
                      </div>
                      
                      {!hasVariants ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Mã SKU</span>
                            <span className="font-medium uppercase">{formData.sku || "-"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Giá bán</span>
                            <span className="font-semibold text-primary">
                              {formatCurrencyValue(formData.price) || "0"} ₫
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Giá nhập</span>
                            <span className="font-semibold text-muted-foreground">
                              {formatCurrencyValue(formData.cost_price) || "0"} ₫
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tồn kho</span>
                            <span className="font-medium">{formData.stock || "0"}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Số biến thể</span>
                            <span className="font-medium">{variants.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tổng tồn kho</span>
                            <span className="font-medium">
                              {variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Khoảng giá bán</span>
                            <span className="font-semibold text-primary text-right">
                              {variantPrices.length === 0
                                ? "Chưa đặt giá"
                                : minVariantPrice === maxVariantPrice
                                  ? fmt.format(minVariantPrice)
                                  : `${fmtCompact(minVariantPrice)} – ${fmtCompact(maxVariantPrice)}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Khoảng giá nhập</span>
                            <span className="font-semibold text-muted-foreground text-right">
                              {variantCostPrices.length === 0
                                ? "Chưa đặt"
                                : minVariantCostPrice === maxVariantCostPrice
                                  ? fmt.format(minVariantCostPrice)
                                  : `${fmtCompact(minVariantCostPrice)} – ${fmtCompact(maxVariantCostPrice)}`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 z-10 mt-0 rounded-none border-t bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-xl sm:h-8 sm:rounded-lg"
              onClick={() => onOpenChange(false)}
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
              {uploadingImage ? "Đang tải ảnh..." : (mode === "copy" ? "Thêm mới" : "Lưu thay đổi")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
