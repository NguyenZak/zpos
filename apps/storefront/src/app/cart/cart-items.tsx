"use client";

import { useState, useTransition } from "react";
import { cartRemove, cartUpdateQuantity, type CartItem } from "../../actions/cart-actions";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";

export function CartItems({ initialItems }: { initialItems: CartItem[] }) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const handleUpdateQuantity = (variantId: string, qty: number) => {
    if (qty < 1) return;
    
    // Optimistic update
    setItems((current) => 
      current.map(item => item.variant_id === variantId ? { ...item, qty } : item)
    );

    startTransition(async () => {
      const res = await cartUpdateQuantity(variantId, qty);
      if (res.success && res.cart) {
        setItems(res.cart.items);
      } else {
        toast.error("Không thể cập nhật số lượng");
        // Revert on error
        setItems(initialItems);
      }
    });
  };

  const handleRemove = (variantId: string) => {
    // Optimistic update
    setItems((current) => current.filter(item => item.variant_id !== variantId));

    startTransition(async () => {
      const res = await cartRemove(variantId);
      if (res.success && res.cart) {
        setItems(res.cart.items);
        toast.success("Đã xoá sản phẩm khỏi giỏ hàng");
      } else {
        toast.error("Không thể xoá sản phẩm");
        setItems(initialItems);
      }
    });
  };

  if (items.length === 0) {
    return <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-subtle-gray)' }}>Giỏ hàng của bạn đã trống sau khi cập nhật.</div>;
  }

  return (
    <ul className="divide-y divide-[#000000] border-t border-b border-[#000000]">
      {items.map((item) => (
        <li key={item.variant_id} className="py-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="w-24 h-32 bg-gray-100 overflow-hidden relative shrink-0" style={{ borderRadius: '0' }}>
            {item.image ? (
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-gray-400">No Img</div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left flex flex-col justify-between h-32">
            <div>
              <h3 
                className="uppercase tracking-wide"
                style={{ 
                  fontSize: 'var(--text-body)', 
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--color-pitch-black)' 
                }}
              >
                {item.name}
              </h3>
              <p className="mt-2 text-xs tracking-wider" style={{ color: 'var(--color-pitch-black)' }}>
                {item.unit_price.toLocaleString('vi-VN')} ₫
              </p>
            </div>

            <div className="hidden sm:block">
              <button 
                onClick={() => handleRemove(item.variant_id)}
                disabled={isPending}
                className="text-[10px] tracking-widest uppercase hover:underline underline-offset-4 disabled:opacity-50"
                style={{ color: 'var(--color-subtle-gray)' }}
              >
                Xóa sản phẩm
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center sm:items-end justify-between h-32">
            <div className="flex items-center border border-[#000000]" style={{ borderRadius: '0' }}>
              <button 
                onClick={() => handleUpdateQuantity(item.variant_id, item.qty - 1)}
                disabled={item.qty <= 1 || isPending}
                className="p-2 hover:bg-gray-50 disabled:opacity-30"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center text-xs font-light">{item.qty}</span>
              <button 
                onClick={() => handleUpdateQuantity(item.variant_id, item.qty + 1)}
                disabled={isPending}
                className="p-2 hover:bg-gray-50 disabled:opacity-30"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="sm:hidden mt-4">
              <button 
                onClick={() => handleRemove(item.variant_id)}
                disabled={isPending}
                className="text-[10px] tracking-widest uppercase hover:underline underline-offset-4 disabled:opacity-50"
                style={{ color: 'var(--color-subtle-gray)' }}
              >
                Xóa sản phẩm
              </button>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-subtle-gray)' }}>Tổng</span>
              <p className="text-sm font-light mt-1" style={{ color: 'var(--color-pitch-black)' }}>
                {(item.unit_price * item.qty).toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
