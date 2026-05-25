import { getCart } from "../../actions/cart-actions";
import { headers } from "next/headers";
import { resolveTenantFromHost } from "../../lib/tenant";
import { redirect } from "next/navigation";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  
  if (!tenant) return null;

  const cart = await getCart();
  if (cart.items.length === 0) {
    redirect("/cart");
  }

  const total = cart.items.reduce((acc, item) => acc + item.unit_price * item.qty, 0);

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
        THANH TOÁN
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 
            className="uppercase tracking-wider mb-8"
            style={{ 
              fontSize: 'var(--text-body)', 
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--color-pitch-black)' 
            }}
          >
            Thông tin giao hàng
          </h2>
          <CheckoutForm tenantId={tenant.id} cartToken={cart.token} />
        </div>
        
        <div>
          <div className="p-8 border border-[#000000] sticky top-8" style={{ background: 'var(--color-luminous-white)' }}>
            <h2 
              className="uppercase tracking-wider mb-8"
              style={{ 
                fontSize: 'var(--text-body)', 
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-pitch-black)' 
              }}
            >
              Đơn hàng của bạn
            </h2>
            
            <ul className="divide-y divide-[#000000] border-t border-b border-[#000000] mb-8">
              {cart.items.map((item) => (
                <li key={item.variant_id} className="py-6 flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-100 shrink-0" style={{ borderRadius: 'var(--radius-all)' }}>
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <h4 
                        className="uppercase"
                        style={{ 
                          fontSize: 'var(--text-body-sm)', 
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--color-pitch-black)' 
                        }}
                      >
                        {item.name}
                      </h4>
                      <p className="text-[10px] tracking-wider uppercase mt-1" style={{ color: 'var(--color-subtle-gray)' }}>SL: {item.qty}</p>
                    </div>
                  </div>
                  <div className="text-xs font-light" style={{ color: 'var(--color-pitch-black)' }}>
                    {(item.unit_price * item.qty).toLocaleString('vi-VN')} ₫
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="space-y-4 mb-6 pb-6 border-b border-[#000000] text-xs uppercase tracking-wider" style={{ color: 'var(--color-subtle-gray)' }}>
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-light">{total.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm uppercase tracking-widest" style={{ color: 'var(--color-pitch-black)', fontWeight: 'var(--font-weight-regular)' }}>
              <span>Tổng cộng</span>
              <span>{total.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
