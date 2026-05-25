"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { placeOrder, reserveStock } from "../../actions/order-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên đầy đủ"),
  phone: z.string().regex(/^(0|\+84)[3-9]\d{8}$/, "Số điện thoại không hợp lệ"),
  address: z.string().min(10, "Vui lòng nhập địa chỉ giao hàng đầy đủ"),
  note: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm({ tenantId, cartToken }: { tenantId: string, cartToken: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    setError(null);
    startTransition(async () => {
      // 1. Reserve Stock First
      const reserveRes = await reserveStock();
      if (!reserveRes.success || !reserveRes.reservation_ids) {
        setError(reserveRes.error || "Có lỗi xảy ra khi kiểm tra tồn kho");
        return;
      }

      // 2. Place Order
      const customerInfo = {
        name: data.fullName,
        phone: data.phone,
        address: data.address,
        note: data.note,
      };

      const orderRes = await placeOrder(customerInfo, reserveRes.reservation_ids, tenantId);
      
      if (!orderRes.success) {
        setError(orderRes.error || "Không thể tạo đơn hàng");
        return;
      }

      // 3. Success Redirect
      toast.success("Đặt hàng thành công!");
      router.push(`/checkout/success?order=${orderRes.order}`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="border border-red-600 bg-white text-red-600 p-4 text-xs uppercase tracking-wider">
          {error}
        </div>
      )}

      <div>
        <label className="block text-[10px] tracking-widest uppercase text-black mb-2">Họ và tên *</label>
        <input 
          {...register("fullName")}
          type="text" 
          className="w-full border border-black bg-white px-4 py-3 text-xs focus:outline-none placeholder-[#757575]"
          style={{ borderRadius: '0' }}
          placeholder="VD: NGUYỄN VĂN A"
        />
        {errors.fullName && <p className="text-red-600 text-[10px] tracking-wider uppercase mt-2">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase text-black mb-2">Số điện thoại *</label>
        <input 
          {...register("phone")}
          type="tel" 
          className="w-full border border-black bg-white px-4 py-3 text-xs focus:outline-none placeholder-[#757575]"
          style={{ borderRadius: '0' }}
          placeholder="VD: 0912345678"
        />
        {errors.phone && <p className="text-red-600 text-[10px] tracking-wider uppercase mt-2">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase text-black mb-2">Địa chỉ nhận hàng *</label>
        <textarea 
          {...register("address")}
          rows={3}
          className="w-full border border-black bg-white px-4 py-3 text-xs focus:outline-none placeholder-[#757575]"
          style={{ borderRadius: '0' }}
          placeholder="NHẬP ĐỊA CHỈ NHẬN HÀNG CHI TIẾT"
        />
        {errors.address && <p className="text-red-600 text-[10px] tracking-wider uppercase mt-2">{errors.address.message}</p>}
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase text-black mb-2">Ghi chú (Tuỳ chọn)</label>
        <textarea 
          {...register("note")}
          rows={2}
          className="w-full border border-black bg-white px-4 py-3 text-xs focus:outline-none placeholder-[#757575]"
          style={{ borderRadius: '0' }}
          placeholder="GHI CHÚ VỀ ĐƠN HÀNG, THỜI GIAN GIAO HÀNG..."
        />
      </div>

      <div className="pt-4">
        <div className="border border-black p-4 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" defaultChecked className="w-4 h-4 accent-black" />
            <span className="text-xs uppercase tracking-widest text-black font-light">Thanh toán khi nhận hàng (COD)</span>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-[#000000] text-white py-4 border border-[#000000] text-xs font-light tracking-widest uppercase transition-colors duration-300 hover:bg-white hover:text-black disabled:opacity-50"
          style={{ borderRadius: '0' }}
        >
          {isPending ? "Đang xử lý..." : "Hoàn tất đặt hàng"}
        </button>
      </div>
    </form>
  );
}
