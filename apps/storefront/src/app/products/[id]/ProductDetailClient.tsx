"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { cartAdd } from "../../../actions/cart-actions";
import { submitProductReview } from "../../../actions/review-actions";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight, X, Maximize2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  author_name: string;
  content: string;
  rating: number;
  created_at: string;
};

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  image_url: string | null;
  attributes: Record<string, any>;
  stock?: number | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  online_description: string | null;
  online_price: number | null;
  size_guide?: string | null;
  base_price: number;
  online_images: any;
  categories?: {
    id: string;
    name: string;
  } | null;
};

type RelatedProduct = {
  id: string;
  name: string;
  online_slug: string | null;
  online_price: number | null;
  base_price: number;
  online_images: any;
};

export function ProductDetailClient({
  product,
  variants,
  relatedProducts = [],
  reviews = [],
  tenantId = "",
}: {
  product: Product;
  variants: Variant[];
  relatedProducts?: RelatedProduct[];
  reviews?: Review[];
  tenantId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    materials: false,
    shipping: false,
  });
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Không thể xác định cửa hàng");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.append("productId", product.id);
    formData.append("rating", reviewRating.toString());
    formData.append("tenantId", tenantId);
    
    setIsSubmittingReview(true);
    const res = await submitProductReview(formData);
    setIsSubmittingReview(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Đánh giá của bạn đã được gửi thành công!");
      setShowReviewModal(false);
    }
  };

  // Size Guide States
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const calculateSize = () => {
    const h = parseInt(height);
    const w = parseInt(weight);
    
    if (!h || !w) {
      toast.error("Vui lòng nhập chiều cao và cân nặng");
      return;
    }

    if (w >= 76 || h >= 177) setRecommendedSize("2XL");
    else if (w >= 69 || h >= 172) setRecommendedSize("XL");
    else if (w >= 62 || h >= 165) setRecommendedSize("L");
    else if (w >= 55 || h >= 160) setRecommendedSize("M");
    else setRecommendedSize("S");
  };

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
        toast.custom((t) => (
          <div className="relative w-full sm:w-[350px] items-start gap-2 px-6 py-4 md:pr-7 bg-white shadow-[0px_1px_4px_0px_hsla(0,0%,0%,0.06),_0px_0px_24px_0px_hsla(0,0%,0%,0.06)] rounded-2xl border border-neutral-200">
            <button 
              onClick={() => toast.dismiss(t)}
              className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center text-neutral-900 hover:text-neutral-600"
            >
              <X size={16} />
            </button>
            <p className="mb-4 border-b border-neutral-200 pb-3 text-base font-semibold text-neutral-900">
              Thêm vào giỏ hàng thành công
            </p>
            <div className="flex items-stretch justify-start gap-4">
              <div className="h-auto w-16 flex-shrink-0">
                <Image 
                  src={images[0]} 
                  alt={product.name}
                  width={64}
                  height={85}
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-base text-neutral-900 line-clamp-2">{product.name}</p>
                <p className="my-1 text-sm text-neutral-500">
                  {[selectedColor, selectedSize].filter(Boolean).join(" / ")}
                </p>
                <p className="text-base text-neutral-500">
                  <ins className="mr-2 font-semibold text-neutral-900 no-underline">
                    {priceToDisplay.toLocaleString('vi-VN')}đ
                  </ins>
                  {(product.base_price > priceToDisplay) && (
                    <del className="font-thin text-neutral-400">
                      {product.base_price.toLocaleString('vi-VN')}đ
                    </del>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <button 
                onClick={() => {
                  toast.dismiss(t);
                  router.push("/cart");
                }}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full uppercase text-sm border border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-900 px-6 py-2 transition-all"
              >
                Xem giỏ hàng
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ), {
          position: 'top-right',
          duration: 5000,
        });
      } else {
        toast.error((result as any).error || "Không thể thêm sản phẩm");
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
        toast.error((result as any).error || "Không thể tiến hành mua ngay");
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
    <>
      <div className="max-w-7xl mx-auto px-8 py-12" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
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
            <div className="flex justify-between items-center mb-3">
              <span className="block text-[10px] tracking-widest uppercase text-black">KÍCH THƯỚC</span>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="text-[10px] font-medium underline text-black hover:text-gray-600 transition-colors"
              >
                Hướng dẫn chọn size
              </button>
            </div>
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

        {/* Stock info */}
        {activeVariant?.stock !== undefined && activeVariant?.stock !== null && (
          <div className="text-sm font-medium tracking-wide" style={{ color: activeVariant.stock > 0 ? 'var(--color-pitch-black)' : 'var(--color-danger, #ef4444)' }}>
            {activeVariant.stock > 0 
              ? `Còn lại ${activeVariant.stock} sản phẩm`
              : 'Hết hàng'}
          </div>
        )}

        {/* Add to Cart CTA */}
        <button
          onClick={handleAddToCart}
          disabled={isPending || activeVariant?.stock === 0}
          className="w-full bg-[#000000] text-white py-4 border border-[#000000] text-xs font-light tracking-widest uppercase transition-colors duration-300 hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: "0" }}
        >
          {isPending ? "ĐANG THÊM..." : activeVariant?.stock === 0 ? "HẾT HÀNG" : "THÊM VÀO GIỎ HÀNG"}
        </button>

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
        </div>
      </div>
      </div>
      </div>

      <div className="w-full px-4 md:px-8 pb-12" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
      {/* Full-width Description Section */}
      <div id="product-description" className="mt-16 md:mt-24 pt-16 border-t border-black/10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest" style={{ color: 'var(--color-pitch-black)' }}>
            Chi Tiết Sản Phẩm
          </h2>
          <div 
            className="text-sm md:text-base font-light leading-loose text-gray-700 whitespace-pre-wrap text-left prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.online_description || product.description || "Chưa có thông tin mô tả chi tiết cho sản phẩm này." }}
          />
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16 md:mt-24 pt-16 border-t border-black/10">
          <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest text-center mb-12" style={{ color: 'var(--color-pitch-black)' }}>
            Gợi Ý Sản Phẩm
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {relatedProducts.map((rp) => {
              const rpImage = (Array.isArray(rp.online_images) && rp.online_images.length > 0)
                ? String(rp.online_images[0])
                : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop";
              const rpPrice = rp.online_price || rp.base_price || 0;
              const rpUrl = `/products/${rp.online_slug || rp.id}`;

              return (
                <Link href={rpUrl} key={rp.id} className="group flex flex-col cursor-pointer">
                  <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] overflow-hidden mb-4">
                    <Image
                      src={rpImage}
                      alt={rp.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="text-xs font-medium uppercase tracking-widest mb-2 line-clamp-2" style={{ color: 'var(--color-pitch-black)' }}>
                    {rp.name}
                  </h3>
                  <p className="text-sm font-light mt-auto" style={{ color: 'var(--color-pitch-black)' }}>
                    {rpPrice.toLocaleString("vi-VN")} ₫
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Reviews */}
      <div className="mt-16 md:mt-24 pt-16 border-t border-black/10">
        <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest text-center mb-12" style={{ color: 'var(--color-pitch-black)' }}>
          Đánh Giá Sản Phẩm
        </h2>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12">
          {/* Summary */}
          <div className="md:w-1/3 flex flex-col items-center justify-center space-y-4">
            <div className="text-5xl font-light">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
                return (
                  <Star
                    key={star}
                    size={20}
                    className={star <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-yellow-400"}
                    strokeWidth={1.5}
                  />
                );
              })}
            </div>
            <p className="text-sm font-light text-gray-500">Dựa trên {reviews.length} đánh giá</p>
            <button 
              onClick={() => setShowReviewModal(true)}
              className="mt-4 px-6 py-3 border border-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-300"
            >
              Viết Đánh Giá
            </button>
          </div>
          
          {/* Review List */}
          <div className="md:w-2/3 space-y-8">
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 border-b border-gray-100">Chưa có đánh giá nào cho sản phẩm này.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-yellow-400"}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium ml-2">{review.author_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(review.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-sm font-light text-gray-700 leading-relaxed">
                    {review.content}
                  </p>
                </div>
              ))
            )}
            
            {reviews.length > 5 && (
              <button className="text-xs uppercase tracking-widest text-black underline hover:text-gray-500 transition-colors">
                Xem Thêm Đánh Giá
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recently Viewed Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16 md:mt-24 pt-16 border-t border-black/10">
          <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest text-center mb-12" style={{ color: 'var(--color-pitch-black)' }}>
            Sản Phẩm Đã Xem
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[...relatedProducts].reverse().map((rp) => {
              const rpImage = (Array.isArray(rp.online_images) && rp.online_images.length > 0)
                ? String(rp.online_images[0])
                : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop";
              const rpPrice = rp.online_price || rp.base_price || 0;
              const rpUrl = `/products/${rp.online_slug || rp.id}`;

              return (
                <Link href={rpUrl} key={`recent-${rp.id}`} className="group flex flex-col cursor-pointer">
                  <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] overflow-hidden mb-4">
                    <Image
                      src={rpImage}
                      alt={rp.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="text-xs font-medium uppercase tracking-widest mb-2 line-clamp-2" style={{ color: 'var(--color-pitch-black)' }}>
                    {rp.name}
                  </h3>
                  <p className="text-sm font-light mt-auto" style={{ color: 'var(--color-pitch-black)' }}>
                    {rpPrice.toLocaleString("vi-VN")} ₫
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
      
      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-bold text-[#0A1128]">Hướng dẫn chọn size</h3>
              <button onClick={() => setShowSizeGuide(false)} className="text-gray-400 hover:text-black transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {product.size_guide ? (
                <div 
                  className="prose prose-sm max-w-none text-gray-700 font-light"
                  dangerouslySetInnerHTML={{ __html: product.size_guide }}
                />
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 mb-2">Chiều cao</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={height} 
                          onChange={(e) => setHeight(e.target.value)} 
                          className="w-full border rounded-lg px-4 py-3 outline-none focus:border-black"
                          placeholder="155"
                        />
                        <span className="absolute right-4 top-3 text-gray-400">cm</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 mb-2">Cân nặng</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={weight} 
                          onChange={(e) => setWeight(e.target.value)} 
                          className="w-full border rounded-lg px-4 py-3 outline-none focus:border-black"
                          placeholder="40"
                        />
                        <span className="absolute right-4 top-3 text-gray-400">kg</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={calculateSize}
                    className="bg-black text-white px-8 py-3 rounded-full text-sm font-medium tracking-wider mb-8"
                  >
                    TÍNH TOÁN
                  </button>

                  {recommendedSize && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center border">
                      <p className="text-gray-600">Size phù hợp với bạn là:</p>
                      <p className="text-3xl font-bold mt-1 text-black">{recommendedSize}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold uppercase mb-2">THÔNG SỐ SẢN PHẨM</h4>
                    <p className="text-xs text-gray-500 mb-4">*Thông số sản phẩm khi trải phẳng, có thể chênh lệch so với số đo cơ thể do độ co giãn vải.</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-center">
                        <thead className="border-b-2 border-t-2 border-gray-100">
                          <tr>
                            <th className="py-3 px-2 text-left w-10"><Maximize2 size={16} /></th>
                            <th className="py-3 px-2 font-bold">S</th>
                            <th className="py-3 px-2 font-bold">M</th>
                            <th className="py-3 px-2 font-bold">L</th>
                            <th className="py-3 px-2 font-bold">XL</th>
                            <th className="py-3 px-2 font-bold">2XL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr className="bg-gray-50">
                            <td className="py-3 px-2 text-left font-semibold">Cân nặng (kg)</td>
                            <td className="py-3 px-2">48-55</td>
                            <td className="py-3 px-2">55-62</td>
                            <td className="py-3 px-2">62-69</td>
                            <td className="py-3 px-2">69-76</td>
                            <td className="py-3 px-2">76-85</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 text-left font-semibold">Chiều cao (cm)</td>
                            <td className="py-3 px-2">155-160</td>
                            <td className="py-3 px-2">160-165</td>
                            <td className="py-3 px-2">165-172</td>
                            <td className="py-3 px-2">172-177</td>
                            <td className="py-3 px-2">177-183</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-3 px-2 text-left font-semibold">Dài quần</td>
                            <td className="py-3 px-2">41.5</td>
                            <td className="py-3 px-2">42.5</td>
                            <td className="py-3 px-2">43.5</td>
                            <td className="py-3 px-2">44.5</td>
                            <td className="py-3 px-2">45</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 text-left font-semibold">1/2 ngang lưng</td>
                            <td className="py-3 px-2">32</td>
                            <td className="py-3 px-2">34</td>
                            <td className="py-3 px-2">36</td>
                            <td className="py-3 px-2">38</td>
                            <td className="py-3 px-2">40</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="py-3 px-2 text-left font-semibold">Ngang mông</td>
                            <td className="py-3 px-2">49</td>
                            <td className="py-3 px-2">51</td>
                            <td className="py-3 px-2">53</td>
                            <td className="py-3 px-2">55</td>
                            <td className="py-3 px-2">57</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-2 text-left font-semibold">Ngang đùi</td>
                            <td className="py-3 px-2">32.5</td>
                            <td className="py-3 px-2">33.5</td>
                            <td className="py-3 px-2">34.5</td>
                            <td className="py-3 px-2">35.5</td>
                            <td className="py-3 px-2">36</td>
                          </tr>
                          <tr className="bg-gray-50 border-b-4 border-gray-300">
                            <td className="py-3 px-2 text-left font-semibold">Ngang ống</td>
                            <td className="py-3 px-2">29</td>
                            <td className="py-3 px-2">30</td>
                            <td className="py-3 px-2">31</td>
                            <td className="py-3 px-2">32</td>
                            <td className="py-3 px-2">33</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg uppercase tracking-widest font-light text-[#0A1128]">Viết đánh giá</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                <p className="text-sm text-gray-500 uppercase tracking-widest">Đánh giá của bạn</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= (reviewHoverRating || reviewRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-transparent text-gray-300"
                        } transition-colors`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="authorName" className="block text-xs uppercase tracking-widest text-gray-700 mb-2">Tên của bạn</label>
                  <input
                    type="text"
                    id="authorName"
                    name="authorName"
                    required
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="Nhập tên của bạn"
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-xs uppercase tracking-widest text-gray-700 mb-2">Nội dung đánh giá</label>
                  <textarea
                    id="content"
                    name="content"
                    required
                    rows={4}
                    className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                    placeholder="Nhập nội dung đánh giá của bạn về sản phẩm này..."
                  ></textarea>
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-black text-white uppercase tracking-widest text-xs py-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
