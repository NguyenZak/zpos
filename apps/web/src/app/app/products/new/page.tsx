"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle, ArrowLeft, BadgeCheck, Check, Image as ImageIcon, Layers, Loader2, Package, Plus, Sparkles, Tag, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { convertToWebP } from "@/lib/image-utils";
import { posService } from "@/services/pos.service";

import { ProductBarcodeField } from "../_components/product-barcode-field";
import { type AttributeDef, VariantBuilder, type VariantRow } from "../_components/variant-builder";

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    cost_price: "",
    stock: "",
    category_id: "",
    image: "",
    barcode_type: "CODE128",
  });

  const [barcodeValid, setBarcodeValid] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiFindingImage, setAiFindingImage] = useState(false);

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    posService.getCategoryList().then(setCategories).catch(console.error);
  }, []);

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

  const handleImageChange = () => fileInputRef.current?.click();

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

      const res = await fetch("/api/upload", { method: "POST", body: uploadForm });
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
      if (!res.ok || !json.url) throw new Error(json.error || "Không tìm thấy ảnh phù hợp");
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
        : undefined;

      const basePrice = hasVariants
        ? Math.min(...variants.map((v) => parseFloat(v.price) || 0))
        : parseFloat(formData.price.toString());
      const baseCostPrice = hasVariants
        ? Math.min(...variants.map((v) => parseFloat(v.cost_price) || 0))
        : parseFloat(formData.cost_price.toString());
      const baseStock = hasVariants
        ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
        : parseInt(formData.stock.toString(), 10);

      await posService.createProduct({
        name: formData.name,
        sku: hasVariants ? null : formData.sku,
        barcode: hasVariants ? null : formData.barcode,
        category_id: formData.category_id || null,
        price: basePrice,
        cost_price: baseCostPrice,
        stock: baseStock,
        image: finalImageUrl || null,
        barcode_type: hasVariants ? null : formData.barcode_type,
        variants: variantPayload,
      });

      toast.success("Đã thêm sản phẩm thành công!");
      router.push("/app/products");
      router.refresh();
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

  const parseCurrencyValue = (value: string) => value.replace(/,/g, "");

  // ---- Derived values for sidebar summary ----
  const variantPrices = variants.map((v) => parseFloat(v.price) || 0).filter((p) => p > 0);
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;
  
  const variantCostPrices = variants.map((v) => parseFloat(v.cost_price) || 0).filter((p) => p > 0);
  const minVariantCostPrice = variantCostPrices.length > 0 ? Math.min(...variantCostPrices) : 0;
  const maxVariantCostPrice = variantCostPrices.length > 0 ? Math.max(...variantCostPrices) : 0;

  const variantTotalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
  const variantsWithImage = variants.filter((v) => v.image).length;

  const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  const fmtCompact = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}tr` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`;

  // Readiness checklist used in the sidebar summary
  const checklistItems: { label: string; ok: boolean }[] = [
    { label: "Có tên sản phẩm", ok: !!formData.name.trim() },
    { label: "Đã chọn danh mục", ok: !!formData.category_id },
    hasVariants
      ? { label: `Đã tạo ít nhất 1 biến thể`, ok: variants.length > 0 }
      : { label: "Có giá bán hợp lệ", ok: parseFloat(formData.price) > 0 },
    hasVariants
      ? { label: "Mọi biến thể đều có giá", ok: variants.length > 0 && variants.every((v) => parseFloat(v.price) > 0) }
      : { label: "Mã vạch hợp lệ", ok: barcodeValid },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => router.push("/app/products")}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-lg font-semibold sm:text-xl">Thêm sản phẩm mới</h1>
              <p className="text-xs text-muted-foreground">
                Nhập thông tin bán hàng, tồn kho và mã vạch. Bật biến thể nếu SP có nhiều màu/size.
              </p>
            </div>
          </div>
        </div>
        <div className="hidden gap-2 lg:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            onClick={() => router.push("/app/products")}
          >
            Hủy
          </Button>
          <Button type="submit" size="sm" className="h-9 rounded-lg" disabled={loading || uploadingImage}>
            {(loading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadingImage ? "Đang tải ảnh..." : "Lưu sản phẩm"}
          </Button>
        </div>
      </div>

      {/* Body: 12-col grid — content 8, sidebar 4 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {/* SECTION 1: Thông tin chung */}
          <section className="overflow-hidden rounded-2xl border bg-background">
            <header className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thông tin chung
              </h2>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Tên sản phẩm <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ví dụ: Áo phông unisex"
                  className="h-10 rounded-xl"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="category" className="text-xs font-semibold">
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
                    <SelectTrigger className="h-10 w-full rounded-xl">
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
              {/* Một slot trống để giữ grid cân, có thể là field "Đơn vị" sau này */}
              <div className="hidden sm:block" />
            </div>
          </section>

          {/* SECTION 2: Định giá & tồn kho — header có toggle biến thể */}
          <section className="overflow-hidden rounded-2xl border bg-background">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Định giá &amp; tồn kho
                </h2>
              </div>
              <label
                htmlFor="has-variants"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs"
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold">Có biến thể (màu, size...)</span>
                <Switch
                  id="has-variants"
                  checked={hasVariants}
                  onCheckedChange={setHasVariants}
                  className="ml-1"
                />
              </label>
            </header>

            <div className="p-5">
              {!hasVariants ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="sku" className="text-xs font-semibold">
                      Mã SKU
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="sku"
                        placeholder="SP0001"
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
                  <div className="xl:col-span-2">
                    <ProductBarcodeField
                      value={formData.barcode}
                      onChange={(val) => setFormData({ ...formData, barcode: val })}
                      onValidationChange={setBarcodeValid}
                      barcodeType={formData.barcode_type}
                      onBarcodeTypeChange={(val) => setFormData({ ...formData, barcode_type: val })}
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="price" className="text-xs font-semibold">
                      Giá bán (₫) <span className="text-destructive">*</span>
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
                  <div className="grid gap-1.5">
                    <Label htmlFor="cost_price" className="text-xs font-semibold">
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
                  <div className="grid gap-1.5">
                    <Label htmlFor="stock" className="text-xs font-semibold">
                      Tồn kho ban đầu <span className="text-destructive">*</span>
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
                </>
              ) : (
                <VariantBuilder
                  attributes={attributes}
                  onAttributesChange={setAttributes}
                  variants={variants}
                  onVariantsChange={setVariants}
                  parentName={formData.name}
                  skuPrefix={formData.sku}
                />
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: 4 cột */}
        <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-4 lg:self-start">
          {/* Hình ảnh */}
          <section className="overflow-hidden rounded-2xl border bg-background">
            <header className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Hình ảnh sản phẩm
              </h2>
            </header>
            <div className="p-5">
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
                className="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/40 transition-all hover:bg-muted"
              >
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-xs font-bold uppercase text-white">Đổi ảnh</span>
                    </div>
                  </>
                ) : uploadingImage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[10px] font-bold uppercase">Tải ảnh lên</span>
                  </div>
                )}
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Tải ảnh thực tế hoặc để trống để AI tự tìm ảnh khi lưu.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
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
                  className="h-9 gap-1 rounded-xl border-violet-500/20 bg-violet-500/10 text-xs font-bold text-violet-500 hover:bg-violet-500/20"
                  onClick={handleAiFindImage}
                  disabled={aiFindingImage || !formData.name.trim()}
                >
                  {aiFindingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI tự tìm ảnh
                </Button>
              </div>
            </div>
          </section>

          {/* Tóm tắt + checklist sẵn sàng lưu */}
          <section className="overflow-hidden rounded-2xl border bg-background">
            <header className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
              <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tóm tắt</h2>
            </header>
            <div className="space-y-3 p-5">
              {hasVariants ? (
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-muted-foreground">Số biến thể</dt>
                    <dd className="text-lg font-bold text-primary">{variants.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-muted-foreground">Tổng tồn kho</dt>
                    <dd className="text-lg font-bold">{variantTotalStock}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-muted-foreground">Khoảng giá bán</dt>
                    <dd className="text-sm font-bold text-primary">
                      {variantPrices.length === 0
                        ? "Chưa đặt giá"
                        : minVariantPrice === maxVariantPrice
                          ? fmt.format(minVariantPrice)
                          : `${fmtCompact(minVariantPrice)} – ${fmtCompact(maxVariantPrice)}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-muted-foreground">Khoảng giá nhập</dt>
                    <dd className="text-sm font-bold text-muted-foreground">
                      {variantCostPrices.length === 0
                        ? "Chưa đặt"
                        : minVariantCostPrice === maxVariantCostPrice
                          ? fmt.format(minVariantCostPrice)
                          : `${fmtCompact(minVariantCostPrice)} – ${fmtCompact(maxVariantCostPrice)}`}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[10px] font-semibold uppercase text-muted-foreground">Ảnh biến thể</dt>
                    <dd className="text-xs">
                      {variantsWithImage} / {variants.length} biến thể có ảnh riêng
                    </dd>
                  </div>
                </dl>
              ) : (
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Giá bán</dt>
                    <dd className="font-bold text-primary">
                      {formData.price ? fmt.format(parseFloat(formData.price) || 0) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Giá nhập</dt>
                    <dd className="font-bold text-muted-foreground">
                      {formData.cost_price ? fmt.format(parseFloat(formData.cost_price) || 0) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tồn kho</dt>
                    <dd className="font-bold">{formData.stock || "—"}</dd>
                  </div>
                </dl>
              )}

              <div className="-mx-2 border-t" />

              <ul className="space-y-1.5 text-xs">
                {checklistItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    {item.ok ? (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span className={item.ok ? "text-muted-foreground" : "font-medium"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>

      {/* Sticky bottom action bar — mobile + tablet (lg ẩn) */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 flex-1 rounded-xl"
          onClick={() => router.push("/app/products")}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-11 flex-[2] rounded-xl text-sm font-semibold"
          disabled={loading || uploadingImage}
        >
          {(loading || uploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {uploadingImage ? "Đang tải ảnh..." : "Lưu sản phẩm"}
        </Button>
      </div>
    </form>
  );
}
