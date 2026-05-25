"use client";

import { useState, useTransition } from "react";
import { lookupOrder } from "../../../actions/order-lookup";
import { toast } from "sonner";

export function OrderLookupForm({ tenantName }: { tenantName: string }) {
  const [isPending, startTransition] = useTransition();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [orderResult, setOrderResult] = useState<any | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phone) {
      toast.error("Vui lòng nhập đủ mã đơn và số điện thoại");
      return;
    }

    startTransition(async () => {
      const res = await lookupOrder(orderId, phone);
      if (res.success && res.order) {
        setOrderResult(res.order);
      } else {
        toast.error(res.error || "Không tìm thấy đơn hàng");
        setOrderResult(null);
      }
    });
  };

  if (orderResult) {
    return (
      <div>
        <div className="flex justify-between items-end mb-8 pb-4 border-b border-black">
          <h2 
            className="uppercase tracking-widest"
            style={{ 
              fontSize: 'var(--text-body)', 
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--color-pitch-black)' 
            }}
          >
            Đơn hàng #{orderResult.order_number}
          </h2>
          <span className="text-[10px] tracking-widest uppercase border border-black px-3 py-1 font-light" style={{ color: 'var(--color-pitch-black)' }}>
            {orderResult.online_status || orderResult.status}
          </span>
        </div>
        
        <div className="space-y-8">
          <div className="border border-black divide-y divide-black" style={{ borderRadius: '0' }}>
            {orderResult.order_items?.map((item: any) => (
              <div key={item.id} className="p-4 flex justify-between items-center text-xs">
                <div>
                  <p className="uppercase tracking-wider font-light" style={{ color: 'var(--color-pitch-black)' }}>
                    {item.product_variants?.products?.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--color-subtle-gray)' }}>
                    SL: {item.quantity} 
                    {item.product_variants?.attribute_values && ` • ${Object.values(item.product_variants.attribute_values).join(', ')}`}
                  </p>
                </div>
                <p className="font-light" style={{ color: 'var(--color-pitch-black)' }}>
                  {(item.unit_price * item.quantity).toLocaleString('vi-VN')} ₫
                </p>
              </div>
            ))}
          </div>
          
          <div className="border border-black p-4 flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest font-light" style={{ color: 'var(--color-pitch-black)' }}>Tổng cộng</span>
            <span className="text-sm font-normal" style={{ color: 'var(--color-pitch-black)' }}>
              {orderResult.total_amount.toLocaleString('vi-VN')} ₫
            </span>
          </div>
          
          <button 
            onClick={() => setOrderResult(null)}
            className="w-full bg-white text-black py-4 border border-[#000000] text-xs font-light tracking-widest uppercase transition-opacity duration-300 hover:opacity-75"
            style={{ borderRadius: '0' }}
          >
            Tra cứu đơn khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-[10px] tracking-widest uppercase text-black mb-2">Mã đơn hàng</label>
        <input 
          type="text" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full border border-black bg-white px-4 py-3 text-xs focus:outline-none placeholder-[#757575]"
          style={{ borderRadius: '0' }}
          placeholder="VD: ORD-12345"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase text-black mb-2">Số điện thoại đặt hàng</label>
        <input 
          type="tel" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-black bg-white px-4 py-3 text-xs focus:outline-none placeholder-[#757575]"
          style={{ borderRadius: '0' }}
          placeholder="VD: 0912345678"
          required
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-[#000000] text-white py-4 border border-[#000000] text-xs font-light tracking-widest uppercase transition-colors duration-300 hover:bg-white hover:text-black disabled:opacity-50"
        style={{ borderRadius: '0' }}
      >
        {isPending ? "Đang tra cứu..." : "Tra cứu"}
      </button>
    </form>
  );
}
