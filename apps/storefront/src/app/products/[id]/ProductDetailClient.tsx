"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { cartAdd } from "../../../actions/cart-actions";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  image_url: string | null;
  attributes: Record<string, any>;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  online_description: string | null;
  online_price: number | null;
  base_price: number;
  online_images: any;
  categories?: {
    id: string;
    name: string;
  } | null;
};

export function ProductDetailClient({
  product,
  variants,
}: {
  product: Product;
  variants: Variant[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    materials: false,
    shipping: false,
  });
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Extract Sizes and Colors dynamically
  const sizeKeys = ["size", "Size", "SIZE", "Kích thước", "Kích cỡ"];
  const colorKeys = ["color", "Color", "COLOR", "Màu sắc", "Màu"];

  const sizes = Array.from(
    new Set(
      variants
        .map((v) => {
          const attr = v.attributes || {};
          const key = Object.keys(attr).find((k) => sizeKeys.includes(k));
          return key ? attr[key] : null;
        })
        .filter(Boolean)
    )
  ) as string[];

  const colors = Array.from(
    new Set(
      variants
        .map((v) => {
          const attr = v.attributes || {};
          const key = Object.keys(attr).find((k) => colorKeys.includes(k));
          return key ? attr[key] : null;
        })
        .filter(Boolean)
    )
  ) as string[];

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length > 0 ? sizes[0] : null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length > 0 ? colors[0] : null
  );

  // Find active variant
  const activeVariant =
    variants.find((v) => {
      const attr = v.attributes || {};
      let matchesSize = true;
      let matchesColor = true;

      if (sizes.length > 0) {
        const sizeKey = Object.keys(attr).find((k) => sizeKeys.includes(k));
        matchesSize = sizeKey ? attr[sizeKey] === selectedSize : false;
      }
      if (colors.length > 0) {
        const colorKey = Object.keys(attr).find((k) => colorKeys.includes(k));
        matchesColor = colorKey ? attr[colorKey] === selectedColor : false;
      }

      return matchesSize && matchesColor;
    }) || variants[0];

  // Resolve Images (STABLE ORDER)
  const images = useMemo(() => {
    let imgs: string[] = [];

    // 1. Add online_images in the EXACT order they were uploaded
    if (Array.isArray(product.online_images) && product.online_images.length > 0) {
      product.online_images.map(String).forEach((img) => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    }

    // 3. Add any variant images that aren't already included
    // Group them by color so images of the same color stand together
    const sortedVariants = [...variants].sort((a, b) => {
      const attrA = a.attributes || {};
      const attrB = b.attributes || {};

      const keyA = Object.keys(attrA).find((k) => colorKeys.includes(k));
      const keyB = Object.keys(attrB).find((k) => colorKeys.includes(k));

      const colorA = keyA ? String(attrA[keyA]) : "";
      const colorB = keyB ? String(attrB[keyB]) : "";

      return colorA.localeCompare(colorB);
    });

    sortedVariants.forEach((v) => {
      if (v.image_url && !imgs.includes(v.image_url)) {
        imgs.push(v.image_url);
      }
    });

    if (imgs.length === 0) {
      imgs = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop"];
    }

    return imgs;
  }, [product.online_images, variants]);

  // Sync current image when active variant changes
  useEffect(() => {
    if (activeVariant?.image_url) {
      const idx = images.indexOf(activeVariant.image_url);
      if (idx !== -1) {
        setCurrentImageIdx(idx);
      }
    }
  }, [activeVariant?.image_url, images]);

  const priceToDisplay = activeVariant?.price || product.online_price || product.base_price || 0;

  const handleAddToCart = () => {
    if (!activeVariant) {
      toast.error("Vui lòng chọn đầy đủ phân loại sản phẩm");
      return;
    }

    startTransition(async () => {
      const result = await cartAdd({
        variant_id: activeVariant.id,
        name: `${product.name} ${selectedSize ? `- ${selectedSize}` : ""} ${selectedColor ? `- ${selectedColor}` : ""}`,
        unit_price: priceToDisplay,
        image: images[0],
        qty: 1,
      });

      if (result.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
      } else {
        toast.error(result.error || "Không thể thêm sản phẩm");
      }
    });
  };

  const handleBuyNow = () => {
    if (!activeVariant) {
      toast.error("Vui lòng chọn đầy đủ phân loại sản phẩm");
      return;
    }

    startTransition(async () => {
      const result = await cartAdd({
        variant_id: activeVariant.id,
        name: `${product.name} ${selectedSize ? `- ${selectedSize}` : ""} ${selectedColor ? `- ${selectedColor}` : ""}`,
        unit_price: priceToDisplay,
        image: images[0],
        qty: 1,
      });

      if (result.success) {
        router.push("/checkout");
      } else {
        toast.error(result.error || "Không thể tiến hành mua ngay");
      }
    });
  };

  const toggleAccordion = (section: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 max-w-7xl mx-auto px-8 py-12" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
      {/* Left Column: Thumbnail + Main Image */}
      <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-4 h-fit">
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-20 lg:w-24 shrink-0 max-h-[600px] md:max-h-[800px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIdx(idx)}
                className={`relative w-16 md:w-full aspect-[3/4] shrink-0 border-2 transition-all duration-300 ${idx === currentImageIdx ? "border-[var(--color-pitch-black)] opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="relative flex-1 w-full aspect-[3/4] md:aspect-[4/5] bg-[#f8f8f8] overflow-hidden group">
          <Image
            src={images[currentImageIdx]}
            alt={`${product.name} - ${currentImageIdx + 1}`}
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 768px) 100vw, 55vw"
            priority
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-black shadow-sm transition-all"
                aria-label="Previous image"
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-black shadow-sm transition-all"
                aria-label="Next image"
              >
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Sticky details */}
      <div className="md:col-span-5 md:sticky md:top-24 h-fit space-y-8 self-start">
        <div>
          {product.categories && (
            <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--color-subtle-gray)' }}>
              {product.categories.name}
            </p>
          )}
          <h1
            className="uppercase tracking-[0.15em] font-light mt-2"
            style={{
              fontSize: 'var(--text-heading-sm)',
              color: 'var(--color-pitch-black)'
            }}
          >
            {product.name}
          </h1>
          <p className="text-sm font-light mt-3" style={{ color: 'var(--color-pitch-black)' }}>
            {priceToDisplay.toLocaleString("vi-VN")} ₫
          </p>
        </div>

        {/* Color Selector */}
        {colors.length > 0 && (
          <div>
            <span className="block text-[10px] tracking-widest uppercase text-black mb-3">MÀU SẮC</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="px-4 py-2 border text-xs tracking-wider uppercase transition-all duration-300"
                  style={{
                    borderRadius: "0",
                    borderColor: selectedColor === color ? "var(--color-pitch-black)" : "#e5e5e5",
                    backgroundColor: selectedColor === color ? "var(--color-pitch-black)" : "transparent",
                    color: selectedColor === color ? "var(--color-luminous-white)" : "var(--color-pitch-black)",
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selector */}
        {sizes.length > 0 && (
          <div>
            <span className="block text-[10px] tracking-widest uppercase text-black mb-3">KÍCH THƯỚC</span>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className="px-4 py-2 border text-xs tracking-wider uppercase transition-all duration-300"
                  style={{
                    borderRadius: "0",
                    borderColor: selectedSize === size ? "var(--color-pitch-black)" : "#e5e5e5",
                    backgroundColor: selectedSize === size ? "var(--color-pitch-black)" : "transparent",
                    color: selectedSize === size ? "var(--color-luminous-white)" : "var(--color-pitch-black)",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add to Cart CTA */}
        <div className="flex gap-4">
          <button
            onClick={handleAddToCart}
            disabled={isPending}
            className="flex-1 bg-white text-black py-4 border border-[#000000] text-xs font-light tracking-widest uppercase transition-colors duration-300 hover:bg-[#f8f8f8] disabled:opacity-50"
            style={{ borderRadius: "0" }}
          >
            {isPending ? "ĐANG THÊM..." : "THÊM VÀO GIỎ HÀNG"}
          </button>
          
          <button
            onClick={handleBuyNow}
            disabled={isPending}
            className="flex-1 bg-[#000000] text-white py-4 border border-[#000000] text-xs font-light tracking-widest uppercase transition-colors duration-300 hover:bg-white hover:text-black disabled:opacity-50"
            style={{ borderRadius: "0" }}
          >
            {isPending ? "ĐANG XỬ LÝ..." : "MUA NGAY"}
          </button>
        </div>

        {/* Accordions details */}
        <div className="border-t border-black divide-y divide-black" style={{ borderColor: 'var(--color-pitch-black)' }}>
          {/* Scroll to Description Button */}
          <div className="py-4">
            <button
              onClick={() => {
                document.getElementById('product-description')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex justify-between items-center text-[10px] tracking-widest uppercase text-black group"
            >
              <span>XEM MÔ TẢ CHI TIẾT</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Materials Accordion */}
          <div className="py-4">
            <button
              onClick={() => toggleAccordion("materials")}
              className="w-full flex justify-between items-center text-[10px] tracking-widest uppercase text-black"
            >
              <span>CHẤT LIỆU & BẢO QUẢN</span>
              {openAccordions.materials ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {openAccordions.materials && (
              <div className="mt-4 text-xs font-light leading-relaxed text-gray-600">
                Làm từ 100% sợi sinh thái bền vững. Chỉ giặt khô hoặc giặt nhẹ bằng tay ở nhiệt độ dưới 30 độ C. Không sử dụng thuốc tẩy. Ủi ở nhiệt độ thấp nếu cần thiết.
              </div>
            )}
          </div>

          {/* Shipping Accordion */}
          <div className="py-4">
            <button
              onClick={() => toggleAccordion("shipping")}
              className="w-full flex justify-between items-center text-[10px] tracking-widest uppercase text-black"
            >
              <span>GIAO HÀNG & TRẢ HÀNG</span>
              {openAccordions.shipping ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {openAccordions.shipping && (
              <div className="mt-4 text-xs font-light leading-relaxed text-gray-600">
                Giao hàng tiêu chuẩn toàn quốc trong vòng 2-4 ngày làm việc. Miễn phí vận chuyển cho tất cả đơn đặt hàng. Hỗ trợ đổi size/mẫu trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên tem mác.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Description Section */}
      <div id="product-description" className="md:col-span-12 mt-16 md:mt-24 pt-16 border-t border-black/10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest" style={{ color: 'var(--color-pitch-black)' }}>
            Chi Tiết Sản Phẩm
          </h2>
          <div 
            className="text-sm md:text-base font-light leading-loose text-gray-700 whitespace-pre-wrap text-left"
          >
            {product.online_description || product.description || "Chưa có thông tin mô tả chi tiết cho sản phẩm này."}
          </div>
        </div>
      </div>
    </div>
  );
}
