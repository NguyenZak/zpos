"use client";

import React, { useState } from "react";
import { Plus, Loader2, Package, Image as ImageIcon, Sparkles, Barcode } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { posService } from "@/services/pos.service";
import { convertToWebP } from "@/lib/image-utils";
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";


export function AddProductDialog({ onShowSuccess }: { onShowSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category_id: "",
    image: ""
  });

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
      const sku = `SP${nextNumber.toString().padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, sku }));
    } catch (error) {
      const random = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, sku: `SP${random}` }));
    }
  };

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
      // Compress to lightweight WebP client-side
      const webpFile = await convertToWebP(file, 0.8);
      
      const uploadForm = new FormData();
      uploadForm.append("file", webpFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể tải ảnh lên");
      }

      setFormData(prev => ({ ...prev, image: json.url }));
      toast.success("Đã tải ảnh sản phẩm thành công!", { id: toastId });
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

      setFormData(prev => ({ ...prev, image: json.url }));
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

      await posService.createProduct({
        name: formData.name,
        barcode: formData.sku,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image: finalImageUrl || null
      });
      
      toast.success("Đã thêm sản phẩm thành công!");
      setOpen(false);
      setFormData({ name: "", sku: "", price: "", stock: "", category_id: "", image: "" });
      if (onShowSuccess) onShowSuccess();
    } catch (error) {
      toast.error("Lỗi khi thêm sản phẩm");
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
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Thêm sản phẩm mới
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin chi tiết cho sản phẩm mới của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Product Image Uploader Box */}
            <div className="flex gap-4 items-center p-3 rounded-xl border bg-muted/10 relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
              <div 
                onClick={handleImageChange}
                className="w-20 h-20 rounded-lg bg-muted flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:bg-muted/85 cursor-pointer overflow-hidden transition-all flex-shrink-0 relative group"
              >
                {formData.image ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Hình ảnh sản phẩm</span>
                <p className="text-[10px] text-muted-foreground leading-normal italic">
                  Tải ảnh thực tế (webp nén) hoặc để trống để AI tự động tìm hình ảnh trên Internet khi lưu.
                </p>
                <div className="flex gap-2 mt-1.5">
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
                    className="h-7 text-xs gap-1 text-violet-500 font-bold border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/20" 
                    onClick={handleAiFindImage}
                    disabled={aiFindingImage || !formData.name.trim()}
                  >
                    {aiFindingImage ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    AI Tự Tìm Ảnh
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input 
                id="name" 
                placeholder="Ví dụ: iPhone 15 Pro Max" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">Mã SKU / Barcode</Label>
                <div className="flex gap-2">
                  <Input 
                    id="sku" 
                    placeholder="Mã SP hoặc Mã vạch" 
                    className="uppercase flex-1"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 text-purple-500 bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/15 shrink-0"
                    onClick={() => setScannerOpen(true)}
                    title="Quét mã vạch bằng camera"
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={generateSKU}>
                    Tự tạo
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Giá bán (₫)</Label>
                <Input 
                  id="price" 
                  type="text" 
                  placeholder="25,000,000" 
                  value={formatCurrencyValue(formData.price)}
                  onChange={(e) => setFormData({ ...formData, price: parseCurrencyValue(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Tồn kho ban đầu</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  placeholder="10" 
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu sản phẩm
            </Button>
          </DialogFooter>
        </form>
        <BarcodeScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onRawScan={(code) => setFormData(prev => ({ ...prev, sku: code }))}
        />
      </DialogContent>
    </Dialog>
  );
}
