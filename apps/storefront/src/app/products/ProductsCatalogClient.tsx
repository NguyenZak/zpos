"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  online_price: number | null;
  price: number;
  online_images: any;
  online_slug: string | null;
  created_at: string;
  categories?: { id: string; name: string } | null;
  product_variants?: any[];
};

export function ProductsCatalogClient({
  products: initialProducts,
}: {
  products: Product[];
}) {
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  // Extract unique categories
  const categories = Array.from(
    new Map(
      initialProducts
        .filter((p) => p.categories)
        .map((p) => [p.categories!.id, p.categories!])
    ).values()
  );

  const sizes = Array.from(
    new Set(
      initialProducts.flatMap(p => p.product_variants?.map(v => v.sizes?.name).filter(Boolean) || [])
    )
  ) as string[];

  const colors = Array.from(
    new Set(
      initialProducts.flatMap(p => p.product_variants?.map(v => v.colors?.name).filter(Boolean) || [])
    )
  ) as string[];

  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({
    category: true,
    size: false,
    color: false,
    price: false,
  });

  const toggleFilter = (key: string) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  // Filter Products
  const filteredProducts = initialProducts.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery)) {
      return false;
    }

    if (selectedCategory && p.categories?.id !== selectedCategory) {
      return false;
    }
    
    // Check sizes
    if (selectedSizes.length > 0) {
      const productSizes = p.product_variants?.map(v => v.sizes?.name).filter(Boolean) || [];
      if (!selectedSizes.some(s => productSizes.includes(s))) return false;
    }

    // Check colors
    if (selectedColors.length > 0) {
      const productColors = p.product_variants?.map(v => v.colors?.name).filter(Boolean) || [];
      if (!selectedColors.some(c => productColors.includes(c))) return false;
    }

    // Check price
    if (priceRange) {
      const priceVal = p.online_price || p.price || 0;
      if (priceRange === 'under-500' && priceVal >= 500000) return false;
      if (priceRange === '500-1000' && (priceVal < 500000 || priceVal > 1000000)) return false;
      if (priceRange === 'over-1000' && priceVal <= 1000000) return false;
    }

    return true;
  });

  // Sort Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.online_price || a.price || 0;
    const priceB = b.online_price || b.price || 0;

    if (sortBy === "price-asc") {
      return priceA - priceB;
    }
    if (sortBy === "price-desc") {
      return priceB - priceA;
    }
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0; // Default
  });

  return (
    <div className="w-full px-4 md:px-8 py-16" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-black pb-8 mb-12">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--color-subtle-gray)' }}>
            {searchQuery ? 'KẾT QUẢ TÌM KIẾM' : 'BỘ SƯU TẬP'}
          </span>
          <h1 
            className="uppercase tracking-[0.2em] font-light mt-2"
            style={{ 
              fontSize: 'var(--text-heading-sm)', 
              color: 'var(--color-pitch-black)' 
            }}
          >
            {searchQuery ? `TÌM KIẾM: "${searchParams.get("q")}"` : 'TẤT CẢ SẢN PHẨM'}
          </h1>
        </div>

        {/* Minimalist Sorting Dropdown */}
        <div className="mt-6 md:mt-0 flex items-center gap-4">
          <span className="text-[10px] tracking-widest uppercase text-black font-light">SẮP XẾP</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-black bg-white px-4 py-2 text-[10px] tracking-widest uppercase focus:outline-none cursor-pointer"
            style={{ borderRadius: "0" }}
          >
            <option value="default">MẶC ĐỊNH</option>
            <option value="price-asc">GIÁ: THẤP ĐẾN CAO</option>
            <option value="price-desc">GIÁ: CAO ĐẾN THẤP</option>
            <option value="newest">MỚI NHẤT</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Filter */}
        <div className="w-full md:w-[280px] shrink-0 space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-lg font-bold">Bộ lọc</h2>
            <span className="text-sm text-gray-500">{filteredProducts.length} kết quả</span>
          </div>

          {/* Categories Filter */}
          <div className="border-b border-black/10 pb-4">
            <button 
              onClick={() => toggleFilter('category')}
              className="flex w-full items-center justify-between py-2 text-base font-medium text-gray-600 hover:text-black transition-colors"
            >
              Danh mục
              <span className={`transform transition-transform ${openFilters.category ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            {openFilters.category && (
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedCategory === null ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
                    {selectedCategory === null && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                  <span className="text-sm text-gray-700">Tất cả</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedCategory === cat.id ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
                      {selectedCategory === cat.id && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <input 
                      type="radio" 
                      className="hidden" 
                      checked={selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Size Filter */}
          {sizes.length > 0 && (
            <div className="border-b border-black/10 pb-4">
              <button 
                onClick={() => toggleFilter('size')}
                className="flex w-full items-center justify-between py-2 text-base font-medium text-gray-600 hover:text-black transition-colors"
              >
                Kích thước
                <span className={`transform transition-transform ${openFilters.size ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              {openFilters.size && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1 border text-sm transition-colors ${
                        selectedSizes.includes(size)
                          ? "border-black bg-black text-white"
                          : "border-gray-300 text-gray-600 hover:border-black hover:text-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Color Filter */}
          {colors.length > 0 && (
            <div className="border-b border-black/10 pb-4">
              <button 
                onClick={() => toggleFilter('color')}
                className="flex w-full items-center justify-between py-2 text-base font-medium text-gray-600 hover:text-black transition-colors"
              >
                Màu sắc
                <span className={`transform transition-transform ${openFilters.color ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              {openFilters.color && (
                <div className="mt-4 flex flex-col gap-2">
                  {colors.map((color) => (
                    <label key={color} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                        selectedColors.includes(color) ? 'border-black bg-black' : 'border-gray-300 group-hover:border-black'
                      }`}>
                        {selectedColors.includes(color) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{color}</span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selectedColors.includes(color)}
                        onChange={() => toggleColor(color)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price Filter */}
          <div className="border-b border-black/10 pb-4">
            <button 
              onClick={() => toggleFilter('price')}
              className="flex w-full items-center justify-between py-2 text-base font-medium text-gray-600 hover:text-black transition-colors"
            >
              Giá
              <span className={`transform transition-transform ${openFilters.price ? 'rotate-180' : ''}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            {openFilters.price && (
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${priceRange === null ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
                    {priceRange === null && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                  <span className="text-sm text-gray-700">Tất cả</span>
                  <input type="radio" className="hidden" checked={priceRange === null} onChange={() => setPriceRange(null)} />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${priceRange === 'under-500' ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
                    {priceRange === 'under-500' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                  <span className="text-sm text-gray-700">Dưới 500,000 ₫</span>
                  <input type="radio" className="hidden" checked={priceRange === 'under-500'} onChange={() => setPriceRange('under-500')} />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${priceRange === '500-1000' ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
                    {priceRange === '500-1000' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                  <span className="text-sm text-gray-700">500,000 ₫ - 1,000,000 ₫</span>
                  <input type="radio" className="hidden" checked={priceRange === '500-1000'} onChange={() => setPriceRange('500-1000')} />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${priceRange === 'over-1000' ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
                    {priceRange === 'over-1000' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                  <span className="text-sm text-gray-700">Trên 1,000,000 ₫</span>
                  <input type="radio" className="hidden" checked={priceRange === 'over-1000'} onChange={() => setPriceRange('over-1000')} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1">
          {sortedProducts.length === 0 ? (
        <div className="text-center py-24 border border-black" style={{ borderRadius: "0" }}>
          <p className="text-xs uppercase tracking-widest text-[#757575] mb-4">Hiện tại chưa có sản phẩm nào</p>
          <Link
            href="/"
            className="inline-block border border-black px-8 py-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
            style={{ borderRadius: "0" }}
          >
            Về Trang Chủ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {sortedProducts.map((product) => {
            const priceVal = product.online_price || product.price || 0;
            let image = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop";
            if (Array.isArray(product.online_images) && product.online_images.length > 0) {
              image = String(product.online_images[0]);
            }
            const productHref = `/products/${product.online_slug || product.id}`;

            return (
              <div key={product.id} className="group relative flex flex-col">
                <Link href={productHref} className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50 mb-4" style={{ borderRadius: "0" }}>
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </Link>
                <div className="flex flex-col items-start text-left">
                  <Link 
                    href={productHref}
                    className="text-xs uppercase tracking-wider font-light line-clamp-1 hover:opacity-75 transition-opacity"
                    style={{ color: 'var(--color-pitch-black)' }}
                  >
                    {product.name}
                  </Link>
                  <span className="text-[11px] font-light mt-1.5" style={{ color: 'var(--color-pitch-black)' }}>
                    {priceVal.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            );
          })}
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
