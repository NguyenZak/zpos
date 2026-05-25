import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Database,
  ShieldCheck,
  Zap,
  TrendingUp,
  Layers,
} from "lucide-react";
import { getMetadata } from "@/utils/seo";
import { APP_CONFIG } from "@/config/app-config";
import { SoftwareApplicationJsonLd, FAQPageJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Header } from "../../_components/Header";
import { Footer } from "../../_components/Footer";
import { LanguageProvider } from "../../_components/LanguageContext";

// Enable Incremental Static Regeneration (ISR)
export const revalidate = 86400; // 24 hours caching

interface SolutionData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  badge: string;
  features: { title: string; desc: string }[];
  faqs: { question: string; answer: string }[];
  seoTitle: string;
  seoDescription: string;
  accentColor: string;
  glowColor: string;
}

const SOLUTIONS_DATA: Record<string, SolutionData> = {
  retail: {
    slug: "retail",
    title: "Phần mềm POS Quản lý Bán lẻ chuyên nghiệp",
    subtitle:
      "Giải pháp chuyển đổi số toàn diện cho chuỗi cửa hàng bán lẻ tạp hóa, siêu thị mini và cửa hàng tiện lợi.",
    description:
      "Đồng bộ hóa tức thì từ kho hàng đến máy tính tiền. Hỗ trợ đầy đủ các nghiệp vụ quản lý sản phẩm đa quy cách, mã vạch barcode thông minh, tính toán tồn kho an toàn và báo cáo tự động cuối ngày.",
    icon: TrendingUp,
    badge: "ZPOS CHO BÁN LẺ",
    features: [
      {
        title: "Kiểm kho tự động siêu tốc",
        desc: "Quét mã vạch kiểm kho nhanh hơn 300%. Tự động cảnh báo khi tồn kho xuống dưới mức tối thiểu.",
      },
      {
        title: "Đồng bộ hóa bán hàng đa kênh",
        desc: "Liên kết trực tiếp và tự động đồng bộ tồn kho với Shopee, Lazada và TikTok Shop.",
      },
      {
        title: "Báo cáo tài chính chuyên sâu",
        desc: "Theo dõi doanh thu, dòng tiền, lợi nhuận gộp và công nợ nhà cung cấp theo thời gian thực.",
      },
    ],
    faqs: [
      {
        question: "ZPOS có hỗ trợ import sản phẩm từ file Excel không?",
        answer:
          "Có, ZPOS hỗ trợ bạn tải lên hàng loạt danh sách sản phẩm, giá bán, tồn kho ban đầu từ file CSV hoặc Excel chỉ trong 1 cú nhấp chuột.",
      },
      {
        question: "Khi mất mạng Internet, phần mềm bán lẻ ZPOS có hoạt động được không?",
        answer:
          "Hoàn toàn được. ZPOS áp dụng cơ chế offline-first tiên tiến, cho phép thu ngân tiếp tục quét mã vạch và in hóa đơn bình thường. Dữ liệu sẽ tự động đồng bộ lên đám mây khi có kết nối trở lại.",
      },
    ],
    seoTitle: "Phần mềm Quản lý Bán lẻ & Siêu thị Mini Tốt Nhất | ZPOS",
    seoDescription:
      "Phần mềm POS quản lý bán lẻ chuyên nghiệp cho siêu thị, cửa hàng tiện lợi. Đồng bộ kho hàng tự động, quét mã vạch barcode, quản lý công nợ chặt chẽ.",
    accentColor: "from-blue-600 to-indigo-650",
    glowColor: "rgba(59, 130, 246, 0.15)",
  },
  "cafe-restaurant": {
    slug: "cafe-restaurant",
    title: "Hệ thống POS Nhà hàng, Quán Café & F&B",
    subtitle:
      "Tối ưu quy trình gọi món tại bàn, đồng bộ chế biến bếp nhanh chóng và thanh toán không tiền mặt mượt mà.",
    description:
      "Giải pháp chuyên dụng cho ngành ăn uống F&B. Trực quan hóa sơ đồ phòng bàn động, tách hóa đơn thông minh, quản lý định lượng nguyên vật liệu tránh thất thoát và hỗ trợ quét mã QR gọi món tiện dụng.",
    icon: Layers,
    badge: "ZPOS F&B SOLUTION",
    features: [
      {
        title: "Sơ đồ phòng bàn trực quan",
        desc: "Thiết lập sơ đồ quán động dễ dàng. Chuyển bàn, gộp bàn và xem trạng thái bàn trống tức thì.",
      },
      {
        title: "Định lượng nguyên vật liệu tránh hao hụt",
        desc: "Tự động trừ kho nguyên liệu thô theo công thức pha chế ngay khi thanh toán hóa đơn.",
      },
      {
        title: "Tích hợp màn hình bếp (KDS)",
        desc: "Đơn hàng từ nhân viên order gửi thẳng xuống bếp tức thì, phân loại khu chế biến rõ ràng.",
      },
    ],
    faqs: [
      {
        question: "ZPOS F&B có hỗ trợ in hóa đơn chia lẻ theo từng bàn không?",
        answer:
          "Có. Bạn có thể dễ dàng tách bàn, gộp hóa đơn hoặc chia nhỏ thanh toán theo số lượng khách lẻ tại bàn cực kỳ tiện lợi.",
      },
      {
        question: "Phần mềm có tích hợp thanh toán QR động ngân hàng không?",
        answer:
          "ZPOS liên kết trực tiếp với cổng VietQR, tự động tạo mã QR động chứa số tiền và nội dung chuyển khoản để khách quét, hệ thống tự xác nhận có tiền ngay trên màn hình thu ngân.",
      },
    ],
    seoTitle: "Phần mềm Quản lý Nhà hàng, Quán Cafe, F&B Chuyên nghiệp | ZPOS",
    seoDescription:
      "Hệ thống máy tính tiền POS nhà hàng, quán cafe, trà sữa. Sơ đồ phòng bàn trực quan, định lượng nguyên liệu kho, thanh toán QR động siêu tốc.",
    accentColor: "from-purple-600 to-pink-600",
    glowColor: "rgba(168, 85, 247, 0.15)",
  },
  "boutique-fashion": {
    slug: "boutique-fashion",
    title: "Phần mềm POS Thời trang, Giày dép & Mỹ phẩm",
    subtitle:
      "Quản lý tồn kho theo biến thể màu sắc, kích thước (size) thông minh và chăm sóc khách hàng VIP hiệu quả.",
    description:
      "Thiết kế giao diện thanh lịch và thao tác mượt mà dành riêng cho các shop thời trang, boutique và chuỗi cửa hàng mỹ phẩm cao cấp. Tích hợp sẵn hệ thống thẻ thành viên loyalty points giúp tăng tỷ lệ mua lại lên 200%.",
    icon: Smartphone,
    badge: "ZPOS CHO BOUTIQUE",
    features: [
      {
        title: "Quản lý thuộc tính màu/size",
        desc: "Tạo một sản phẩm gốc với hàng trăm biến thể màu sắc, kích cỡ, chất liệu khác nhau cực nhanh.",
      },
      {
        title: "Chăm sóc khách hàng tự động",
        desc: "Lưu lịch sử mua sắm, tự động xếp hạng thẻ VIP và gửi tin nhắn chúc mừng sinh nhật, ưu đãi.",
      },
      {
        title: "In tem mã vạch sản phẩm",
        desc: "Tự sinh mã vạch barcode cho sản phẩm mới nhập và kết nối trực tiếp với máy in tem chuyên dụng.",
      },
    ],
    faqs: [
      {
        question: "Làm thế nào để quản lý hàng tồn kho giữa các chi nhánh thời trang?",
        answer:
          "ZPOS cung cấp tính năng luân chuyển kho liên chi nhánh. Bạn có thể tạo lệnh chuyển kho và theo dõi lộ trình vận chuyển hàng hóa giữa các shop thời gian thực.",
      },
    ],
    seoTitle: "Phần mềm Quản lý Shop Thời trang, Mỹ phẩm Tốt Nhất | ZPOS",
    seoDescription:
      "Giải pháp phần mềm bán hàng shop quần áo, giày dép, mỹ phẩm. Quản lý thuộc tính màu sắc, size sản phẩm, tích điểm loyalty khách hàng thân thiết.",
    accentColor: "from-emerald-500 to-teal-650",
    glowColor: "rgba(16, 185, 129, 0.15)",
  },
};

// SSG static path generation for all solutions at build time
export async function generateStaticParams() {
  return Object.keys(SOLUTIONS_DATA).map((slug) => ({ slug }));
}

// Next.js dynamic metadata generation based on routing parameters
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const data = SOLUTIONS_DATA[slug];

  if (!data) {
    return getMetadata({
      title: "Không tìm thấy giải pháp",
      description: "Trang giải pháp kinh doanh không tồn tại.",
    });
  }

  return getMetadata({
    title: data.seoTitle,
    description: data.seoDescription,
    path: `/solutions/${slug}`,
    keywords: [
      `phan mem pos ${slug}`,
      `phan mem quan ly ${slug}`,
      "he thong pos zpos",
      "giai phap ban hang enterprise",
    ],
  });
}

export default async function SolutionPage({ params }: { params: any }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const data = SOLUTIONS_DATA[slug];

  if (!data) {
    notFound();
  }

  const IconComponent = data.icon;

  return (
    <LanguageProvider>
      {/* Structural Data Injection */}
      <SoftwareApplicationJsonLd
        name={`ZPOS - ${data.title}`}
        url={`${APP_CONFIG.url}/solutions/${slug}`}
        category="BusinessApplication"
        operatingSystem="iOS, Android, Windows, macOS, Web"
        description={data.seoDescription}
        price="399000"
        priceCurrency="VND"
      />
      <FAQPageJsonLd mainEntity={data.faqs} />

      <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-aeonik-pro">
        <Header />

        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Dynamic breadcrumbs */}
            <Breadcrumbs
              customLabels={{
                solutions: "Giải pháp",
                [slug]: data.title.split(" | ")[0],
              }}
              className="mb-8"
            />

            {/* Dynamic Hero Layout */}
            <div className="relative overflow-hidden rounded-xl bg-slate-950 p-8 md:p-12 text-white border border-slate-800 shadow-2xl mb-12">
              <div
                className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full blur-3xl"
                style={{ backgroundColor: data.glowColor }}
              />

              <div className="relative z-10 max-w-3xl space-y-5">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-300 text-xs font-extrabold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  {data.badge}
                </span>

                <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">{data.title}</h1>

                <p className="text-slate-350 text-base md:text-lg font-medium">{data.subtitle}</p>

                <p className="text-slate-400 text-sm md:text-base leading-relaxed">{data.description}</p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link
                    href="/#pricing"
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-bold bg-gradient-to-r ${data.accentColor} text-white shadow-lg transition-transform hover:scale-[1.02] duration-200`}
                  >
                    Bắt đầu dùng thử miễn phí
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/#contact"
                    className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-bold bg-slate-900 border border-slate-800 hover:bg-slate-850 transition-colors duration-200 text-slate-200"
                  >
                    Nhận tư vấn lắp đặt
                  </Link>
                </div>
              </div>
            </div>

            {/* Key Programmatic Features Grid */}
            <div className="mb-16 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Tính năng cốt lõi được tối ưu hóa</h2>
                <p className="text-slate-500 text-sm font-semibold">
                  Quy trình vận hành khép kín và an toàn tuyệt đối cho mô hình của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.features.map((feat, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-lg bg-white border border-slate-100 shadow-md flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.accentColor} flex items-center justify-center text-white shadow-md`}
                      >
                        <IconComponent className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured FAQ Accordion Section */}
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center">Câu hỏi thường gặp (FAQ)</h2>

              <div className="space-y-4">
                {data.faqs.map((faq, i) => (
                  <div key={i} className="p-5 rounded-lg bg-white border border-slate-150/80 shadow-sm space-y-2">
                    <h4 className="font-black text-base text-slate-900 flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      {faq.question}
                    </h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed pl-7">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </LanguageProvider>
  );
}
