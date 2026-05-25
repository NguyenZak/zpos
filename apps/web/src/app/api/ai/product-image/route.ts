import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Thiếu tham số tên sản phẩm!" }, { status: 400 });
    }

    // Search Unsplash public napi search engine
    const response = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(name)}&per_page=3`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Lỗi truy cập dữ liệu Unsplash");
    }

    const data = await response.json();
    const photo = data?.results?.[0];

    if (!photo) {
      // Fallback: A premium, minimalist generic Apple-like product placeholder image
      return NextResponse.json({
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
      });
    }

    // Customize image size and crop parameter for fast UI rendering
    const imageUrl = `${photo.urls.raw || photo.urls.regular}&auto=format&fit=crop&q=80&w=600`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      photographer: photo.user?.name,
      description: photo.alt_description || photo.description,
    });
  } catch (error: any) {
    console.error("AI Product image dynamic search error:", error);
    // Bulletproof fallback so POS operations are never interrupted
    return NextResponse.json({
      success: false,
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    });
  }
}
