import { headers } from "next/headers";
import { resolveTenantFromHost } from "../../../lib/tenant";
import Link from "next/link";
import { Check } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  
  if (!tenant) return null;

  const orderId = searchParams.order;

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 py-16" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
      <div className="max-w-md w-full bg-white border border-[#000000] p-8 text-center" style={{ borderRadius: '0' }}>
        <div className="w-16 h-16 border border-[#000000] flex items-center justify-center mx-auto mb-6" style={{ borderRadius: '0' }}>
          <Check className="w-8 h-8 text-black" />
        </div>
        
        <h1 
          className="uppercase tracking-widest mb-4"
          style={{ 
            fontSize: 'var(--text-heading-sm)', 
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--color-pitch-black)' 
          }}
        >
          Đặt hàng thành công!
        </h1>
        <p className="text-xs uppercase tracking-wider mb-8" style={{ color: 'var(--color-subtle-gray)' }}>
          Cảm ơn bạn đã mua sắm tại {tenant.name}. Đơn hàng của bạn đang được xử lý.
        </p>
        
        {orderId && (
          <div className="border-t border-b border-[#000000] py-6 mb-8">
            <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--color-subtle-gray)' }}>Mã đơn hàng của bạn</p>
            <p className="font-mono text-lg font-normal tracking-wide" style={{ color: 'var(--color-pitch-black)' }}>{orderId}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Link 
            href="/account/orders"
            className="block w-full bg-[#000000] text-white py-4 text-xs tracking-widest uppercase border border-[#000000] transition-colors duration-300 hover:bg-white hover:text-black"
            style={{ borderRadius: '0' }}
          >
            Tra cứu đơn hàng
          </Link>
          <Link 
            href="/"
            className="block w-full bg-white text-black py-4 text-xs tracking-widest uppercase border border-[#000000] transition-opacity duration-300 hover:opacity-75"
            style={{ borderRadius: '0' }}
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
