import { getCart } from "../../actions/cart-actions";
import { headers } from "next/headers";
import { resolveTenantFromHost } from "../../lib/tenant";
import Link from "next/link";
import { CartItems } from "./cart-items";

export default async function CartPage() {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  
  if (!tenant) return null;

  const cart = await getCart();

  return (
    <div className="w-full px-4 md:px-8 py-16" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
      <h1 
        className="uppercase tracking-widest text-left mb-12"
        style={{ 
          fontSize: 'var(--text-heading-sm)', 
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--color-pitch-black)'
        }}
      >
        GIỎ HÀNG CỦA BẠN
      </h1>
      
      {cart.items.length === 0 ? (
        <div className="text-left py-12 border border-[#000000] p-8" style={{ background: 'var(--color-luminous-white)' }}>
          <p className="mb-6 uppercase tracking-wider text-xs" style={{ color: 'var(--color-subtle-gray)' }}>Giỏ hàng đang trống</p>
          <Link 
            href="/" 
            className="inline-block uppercase text-xs tracking-wider border border-[#000000] px-8 py-3 transition-opacity hover:opacity-70"
            style={{ 
              color: 'var(--color-pitch-black)',
              background: 'transparent'
            }}
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <CartItems initialItems={cart.items} />
          </div>
          
          <div className="p-8 border border-[#000000] h-fit" style={{ background: 'var(--color-luminous-white)' }}>
            <h2 
              className="uppercase tracking-widest mb-6"
              style={{ 
                fontSize: 'var(--text-body)', 
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-pitch-black)' 
              }}
            >
              TÓM TẮT ĐƠN HÀNG
            </h2>
            <div className="flex justify-between mb-4 text-xs uppercase tracking-wider" style={{ color: 'var(--color-subtle-gray)' }}>
              <span>Tạm tính</span>
              <span className="font-light">
                {cart.items.reduce((acc, item) => acc + item.unit_price * item.qty, 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <div className="flex justify-between mb-6 pb-6 border-b border-[#000000] text-xs uppercase tracking-wider" style={{ color: 'var(--color-subtle-gray)' }}>
              <span>Phí vận chuyển</span>
              <span>Tính khi thanh toán</span>
            </div>
            <div className="flex justify-between text-sm uppercase tracking-widest mb-8" style={{ color: 'var(--color-pitch-black)', fontWeight: 'var(--font-weight-regular)' }}>
              <span>Tổng cộng</span>
              <span>
                {cart.items.reduce((acc, item) => acc + item.unit_price * item.qty, 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
            
            <Link 
              href="/checkout" 
              className="block w-full text-center uppercase text-xs tracking-widest py-4 border border-[#000000] transition-colors duration-300 hover:bg-[#000000] hover:text-white"
              style={{
                color: 'var(--color-pitch-black)',
                background: 'transparent',
              }}
            >
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
