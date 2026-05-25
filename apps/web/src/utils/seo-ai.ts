import { generateSlug } from "./seo";

export interface AISEOResult {
  title: string;
  description: string;
  slug: string;
  keywords: string;
  score: number;
  suggestions: string[];
}

/**
 * Enterprise-grade AI SEO assistant simulating a highly specialized LLM model
 * tailored for Vietnamese retail, ecommerce, and SaaS.
 */
export async function generateAISEOMetadata(
  sourceTitle: string,
  category: string,
  customKeywords: string = "",
): Promise<AISEOResult> {
  // Simulate network latency of AI models
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const cleanTitle = sourceTitle.trim();
  const slug = generateSlug(cleanTitle);

  // Fallback if title is empty
  if (!cleanTitle) {
    return {
      title: "ZPOS — Hệ điều hành bán lẻ thế hệ mới",
      description:
        "Giải pháp quản lý bán lẻ, kho hàng, thanh toán POS đồng bộ và bảo mật tuyệt đối cho mọi mô hình kinh doanh.",
      slug: "",
      keywords: "phan mem ban hang, pos, quan ly kho, zpos",
      score: 65,
      suggestions: ["Vui lòng điền tiêu đề bài viết để AI phân tích tối ưu."],
    };
  }

  // Pre-curated high-converting templates based on categories
  let metaTitle = `${cleanTitle} | ZPOS`;
  let metaDescription = `Tìm hiểu cách ${cleanTitle.toLowerCase()} giúp nâng cao hiệu quả vận hành, tiết kiệm chi phí và tăng trưởng doanh thu vượt bậc cho cửa hàng bán lẻ của bạn.`;
  let defaultKeywords = "phan mem ban hang, phan mem pos, quan ly kho, zpos, chuyen doi so ban le";

  if (category.toLowerCase().includes("marketing") || category.toLowerCase().includes("tăng trưởng")) {
    metaTitle = `${cleanTitle} | Bí quyết Tăng Trưởng ZPOS`;
    metaDescription = `Làm thế nào để ${cleanTitle.toLowerCase()}? Đọc ngay cẩm nang chuyên sâu từ các chuyên gia bán lẻ ZPOS để thu hút 200% khách hàng quay lại.`;
    defaultKeywords += ", loyalty points, marketing ban le, tang truong doanh thu, cham soc khach hang";
  } else if (category.toLowerCase().includes("vận hành") || category.toLowerCase().includes("xu thế")) {
    metaTitle = `${cleanTitle} — Xu thế Bán lẻ Hiện đại`;
    metaDescription = `Giải pháp ${cleanTitle.toLowerCase()} tối ưu quy trình bán hàng dưới 3 giây, tự động đồng bộ kho hàng tránh hao hụt thất thoát. Khám phá ngay!`;
    defaultKeywords += ", dong bo ngoai tuyen, offline pos, quan ly chuoi, pos ban hang";
  } else if (category.toLowerCase().includes("công nghệ") || category.toLowerCase().includes("bảo mật")) {
    metaTitle = `${cleanTitle} | Tiêu chuẩn An toàn ZPOS`;
    metaDescription = `${cleanTitle}. Hệ điều hành bán lẻ ZPOS cam kết mã hóa dữ liệu 2 chiều và lưu trữ đám mây an toàn tuyệt đối theo chuẩn bảo mật ngân hàng.`;
    defaultKeywords += ", ma hoa du lieu, bao mat pos, cloud pos, audit log pos";
  }

  // Cap meta description at search engine friendly lengths (under 160 characters)
  if (metaDescription.length > 160) {
    metaDescription = metaDescription.slice(0, 157) + "...";
  }

  const finalKeywords = customKeywords ? `${customKeywords.trim().toLowerCase()}, ${defaultKeywords}` : defaultKeywords;

  // Advanced SEO scoring heuristics
  let score = 75;
  const suggestions: string[] = [];

  if (cleanTitle.length < 10) {
    score -= 15;
    suggestions.push("⚠️ Tiêu đề quá ngắn (dưới 10 ký tự). Hãy viết thêm từ khóa chính để hấp dẫn người đọc.");
  } else if (cleanTitle.length > 60) {
    score -= 10;
    suggestions.push(
      "⚠️ Tiêu đề quá dài (trên 60 ký tự). Có thể bị cắt bớt hiển thị trên trang kết quả tìm kiếm Google.",
    );
  } else {
    score += 10;
    suggestions.push("✅ Chiều dài tiêu đề hoàn hảo (10 - 60 ký tự).");
  }

  if (metaDescription.length < 100) {
    score -= 10;
    suggestions.push(
      "⚠️ Mô tả Meta quá ngắn. Nên viết từ 110 - 150 ký tự để truyền tải đủ nội dung hấp dẫn khách hàng nhấp chuột.",
    );
  } else {
    score += 10;
    suggestions.push("✅ Chiều dài mô tả Meta đạt chuẩn hiển thị công cụ tìm kiếm.");
  }

  if (finalKeywords.split(",").length < 4) {
    score -= 5;
    suggestions.push("⚠️ Hãy thêm ít nhất 4 thẻ từ khóa (keywords) để bot tìm kiếm phân loại chủ đề tốt hơn.");
  } else {
    score += 5;
    suggestions.push("✅ Thẻ từ khóa phong phú, hỗ trợ phân loại từ khóa ngữ nghĩa tốt.");
  }

  return {
    title: metaTitle,
    description: metaDescription,
    slug,
    keywords: finalKeywords,
    score: Math.min(score, 100),
    suggestions,
  };
}
