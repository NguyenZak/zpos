import { headers } from "next/headers";
import { resolveTenantFromHost } from "../../../lib/tenant";
import { OrderLookupForm } from "./order-lookup-form";

export default async function OrderLookupPage() {
  const h = await headers();
  const host = h.get("host") || h.get("x-forwarded-host") || "";
  const tenant = await resolveTenantFromHost(host);
  
  if (!tenant) return null;

  return (
    <div className="w-full px-4 md:px-8 py-16" style={{ backgroundColor: 'var(--color-luminous-white)' }}>
      <h1 
        className="uppercase tracking-widest text-left mb-4"
        style={{ 
          fontSize: 'var(--text-heading-sm)', 
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--color-pitch-black)' 
        }}
      >
        Tra cứu đơn hàng
      </h1>
      <p className="text-[10px] tracking-widest uppercase mb-12" style={{ color: 'var(--color-subtle-gray)' }}>
        Nhập số điện thoại và mã đơn hàng của bạn để xem tình trạng
      </p>
      
      <div className="border border-[#000000] p-8" style={{ background: 'var(--color-luminous-white)', borderRadius: '0' }}>
        <OrderLookupForm tenantName={tenant.name} />
      </div>
    </div>
  );
}
