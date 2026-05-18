import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

// API giả lập tạo đơn hàng vận chuyển
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, provider, service_name, shipping_fee, cod_amount } = body;

    if (!order_id || !provider) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin Đơn hàng hoặc Đơn vị vận chuyển" },
        { status: 400 }
      );
    }

    // Sinh mã vận đơn giả lập theo định dạng của từng hãng
    let trackingCode = "";
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    
    switch (provider.toUpperCase()) {
      case "GHN":
        trackingCode = `GHN${rand}`;
        break;
      case "GHTK":
        trackingCode = `GHTK.${rand.toString().slice(0, 6)}`;
        break;
      case "VIETTEL_POST":
        trackingCode = `VTP${rand}`;
        break;
      case "AHAMOVE":
        trackingCode = `AHA-${rand.toString().slice(0, 6)}`;
        break;
      case "LALAMOVE":
        trackingCode = `LALA-${rand.toString().slice(0, 6)}`;
        break;
      default:
        trackingCode = `SHP${rand}`;
    }

    // Thời gian giao dự kiến tùy hãng
    const estimatedDelivery = new Date();
    if (["AHAMOVE", "LALAMOVE"].includes(provider.toUpperCase())) {
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 45);
    } else {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
    }

    // Lưu vào database giả lập thông qua Supabase hoặc trả về kết quả thành công ngay lập tức để frontend update
    // Trong thực tế, ta sẽ insert vào bảng `shipping_orders`
    const shippingOrder = {
      id: `shp-${Date.now()}`,
      order_id,
      provider_code: provider,
      tracking_code: trackingCode,
      status: "READY_TO_PICK",
      shipping_fee: shipping_fee || 25000,
      cod_amount: cod_amount || 0,
      estimated_delivery_time: estimatedDelivery.toISOString(),
      label_url: `https://zpos.vn/shipping/labels/${trackingCode}`
    };

    return NextResponse.json({
      success: true,
      data: shippingOrder,
      message: `Đã đẩy đơn hàng sang ${provider} thành công!`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
