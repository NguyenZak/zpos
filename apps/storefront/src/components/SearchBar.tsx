"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchProducts } from "../actions/search-actions";
import Link from "next/link";
import Image from "next/image";

export function SearchBar({ tenantId }: { tenantId: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await searchProducts(query, tenantId);
          setSuggestions(results);
        } catch (error) {
          console.error(error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="relative flex items-center" ref={searchRef}>
      {isOpen ? (
        <div className="absolute right-0 top-0 w-72 md:w-80 bg-white border border-black shadow-lg z-50 flex flex-col">
          <form onSubmit={handleSearch} className="flex items-center w-full border-b border-black/10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH"
              autoFocus
              className="flex-1 px-4 py-3 text-xs outline-none tracking-wide"
              style={{ color: 'var(--color-pitch-black)' }}
            />
            <button type="submit" className="px-3 hover:opacity-60">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="px-3 border-l border-black/10 hover:opacity-60 h-full py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {query.trim().length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-xs text-center text-gray-500 uppercase tracking-widest">Đang tìm...</div>
              ) : suggestions.length > 0 ? (
                <div className="flex flex-col">
                  {suggestions.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.online_slug || product.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-3 p-3 border-b border-black/5 hover:bg-black/5 transition-colors"
                    >
                      {product.online_images && product.online_images.length > 0 ? (
                        <div className="relative w-10 h-14 shrink-0 bg-gray-100">
                          <Image src={String(product.online_images[0])} alt={product.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-14 shrink-0 bg-gray-100" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider font-light line-clamp-1">{product.name}</span>
                        <span className="text-[10px] text-gray-500 mt-1">
                          {(product.online_price || product.price || 0).toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="p-3 text-xs text-center font-medium uppercase tracking-widest hover:bg-black/5 transition-colors w-full"
                  >
                    Xem tất cả kết quả
                  </button>
                </div>
              ) : (
                <div className="p-4 text-xs text-center text-gray-500 uppercase tracking-widest">Không tìm thấy sản phẩm</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="hover:opacity-60 transition-opacity flex items-center gap-1 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span className="hidden md:inline">SEARCH</span>
        </button>
      )}
    </div>
  );
}
