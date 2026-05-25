"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  online_price: number | null;
  base_price: number;
  online_images: any;
  online_slug: string | null;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  online_image_url: string | null;
};

export function CategoryListingClient({
  category,
  products: initialProducts,
}: {
  category: Category;
  products: Product[];
}) {
  const [sortBy, setSortBy] = useState<string>("default");

  // Sort Products
  const sortedProducts = [...initialProducts].sort((a, b) => {
    const priceA = a.online_price || a.base_price || 0;
    const priceB = b.online_price || b.base_price || 0;

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
      {/* Category Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-black pb-8 mb-12">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--color-subtle-gray)' }}>BỘ SƯU TẬP</span>
          <h1 
            className="uppercase tracking-[0.2em] font-light mt-2"
            style={{ 
              fontSize: 'var(--text-heading-sm)', 
              color: 'var(--color-pitch-black)' 
            }}
          >
            {category.name}
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

      {/* Product Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-24 border border-black" style={{ borderRadius: "0" }}>
          <p className="text-xs uppercase tracking-widest text-[#757575] mb-4">Chưa có sản phẩm nào trong danh mục này</p>
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
            const price = product.online_price || product.base_price || 0;
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
                    {price.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
