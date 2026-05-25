import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to_address, weight = 500, items = [] } = body;

    if (!to_address) {
      return NextResponse.json({ success: false, error: "Thiếu địa chỉ giao hàng" }, { status: 400 });
    }

    const addressStr =
      typeof to_address === "string" ? to_address.toLowerCase() : JSON.stringify(to_address).toLowerCase();

    // Giả định địa chỉ gửi hàng là TP. Hồ Chí Minh
    const isInCity =
      addressStr.includes("hồ chí minh") ||
      addressStr.includes("hcm") ||
      addressStr.includes("quận") ||
      addressStr.includes("tphcm");

    // Danh sách báo giá mẫu từ các hãng vận chuyển dựa trên địa chỉ thực tế
    const quotes = [];

    // 1. Giao Hàng Nhanh (GHN)
    quotes.push({
      provider: "GHN",
      name: "GHN Chuẩn",
      fee: isInCity ? 18000 + Math.floor(weight / 100) * 100 : 35000 + Math.floor(weight / 100) * 200,
      estimated_days: isInCity ? "1 - 2 ngày" : "3 - 5 ngày",
      description: "Giao hàng tận nơi, tối ưu chi phí",
    });

    // 2. Giao Hàng Tiết Kiệm (GHTK)
    quotes.push({
      provider: "GHTK",
      name: "GHTK Tiết Kiệm",
      fee: isInCity ? 16500 + Math.floor(weight / 100) * 80 : 32000 + Math.floor(weight / 100) * 150,
      estimated_days: isInCity ? "1 - 2 ngày" : "2 - 4 ngày",
      description: "Giao hàng siêu tốc & tiết kiệm",
    });

    // 3. Viettel Post
    quotes.push({
      provider: "VIETTEL_POST",
      name: "Viettel Post Nhanh",
      fee: isInCity ? 15000 + Math.floor(weight / 100) * 100 : 28000 + Math.floor(weight / 100) * 180,
      estimated_days: isInCity ? "1 - 3 ngày" : "3 - 5 ngày",
      description: "Độ phủ toàn quốc, an toàn tuyệt đối",
    });

    // Nếu ở trong cùng thành phố thì hỗ trợ giao hỏa tốc AhaMove & Lalamove
    if (isInCity) {
      // 4. AhaMove
      quotes.push({
        provider: "AHAMOVE",
        name: "AhaMove Hỏa Tốc",
        fee: 25000 + Math.floor(weight / 100) * 300,
        estimated_days: "30 - 60 phút",
        description: "Giao hàng bằng xe máy tức thì",
      });

      // 5. Lalamove
      quotes.push({
        provider: "LALAMOVE",
        name: "Lalamove Siêu Tốc",
        fee: 28000 + Math.floor(weight / 100) * 400,
        estimated_days: "20 - 45 phút",
        description: "Giao hàng nhanh nội thành 24/7",
      });
    }

    return NextResponse.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
