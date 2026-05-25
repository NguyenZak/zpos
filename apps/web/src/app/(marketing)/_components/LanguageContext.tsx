"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "vi" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Define translation dictionary
const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header
    "nav.features": "Tính năng",
    "nav.products": "Sản phẩm",
    "nav.security": "Bảo mật",
    "nav.pricing": "Bảng giá",
    "nav.login": "Đăng nhập",
    "nav.signup": "Đăng ký",
    "nav.docs": "Tài liệu",
    "nav.changelog": "Cập nhật",
    "nav.blog": "Blog",

    // Hero
    "hero.badge": "⚡️ Hệ thống Quản lý Bán hàng & POS Toàn diện",
    "hero.title1": "Thanh toán Siêu tốc, Bảo mật và",
    "hero.title2": "Tối ưu hóa Cửa hàng ZPOS của bạn",
    "hero.subtitle":
      "Giải pháp quản lý bán hàng đa kênh, đồng bộ thời gian thực và hoạt động mượt mà ngay cả khi ngoại tuyến.",
    "hero.cta.trial": "Dùng thử miễn phí",
    "hero.cta.docs": "Xem tính năng",
    "hero.feature1.meta": "01 // ĐỒNG BỘ NGOẠI TUYẾN",
    "hero.feature1.title": "Bán hàng Không gián đoạn",
    "hero.feature1.desc": "Hỗ trợ chế độ offline-first, tự động đồng bộ hóa dữ liệu ngay khi có kết nối trở lại.",
    "hero.feature2.meta": "02 // QUẢN LÝ ĐA THIẾT BỊ",
    "hero.feature2.title": "Đồng bộ Tức thì",
    "hero.feature2.desc": "Kết nối mượt mà giữa máy POS, máy tính bảng, điện thoại và máy in hóa đơn.",
    "hero.feature3.meta": "03 // BÁO CÁO CHI TIẾT",
    "hero.feature3.title": "Phân tích Doanh thu",
    "hero.feature3.desc": "Theo dõi doanh số, quản lý ca làm việc và tồn kho theo thời gian thực từ xa.",

    // FeatureGrid
    "grid.badge": "HỆ SINH THÁI BÁN HÀNG",
    "grid.title": "Mọi công cụ chuyên nghiệp để vận hành",
    "grid.subtitle":
      "Không còn phải kết hợp các phần mềm rời rạc. Quản lý toàn bộ hoạt động kinh doanh từ một nền tảng POS đồng bộ và bảo mật.",
    "grid.f1.title": "Thanh toán dưới 3 giây",
    "grid.f1.desc":
      "Giao diện tối giản, tối ưu hóa thao tác chạm giúp nhân viên thu ngân phục vụ khách hàng nhanh hơn.",
    "grid.f2.title": "Bảo mật Dữ liệu Ca làm",
    "grid.f2.desc": "Phân quyền nhân viên chặt chẽ, chống thất thoát doanh thu và mã hóa lịch sử giao dịch.",
    "grid.f3.title": "Quản lý Chuỗi Cửa hàng",
    "grid.f3.desc": "Quản lý nhiều chi nhánh, kho hàng độc lập hoặc liên kết chỉ trên một tài khoản quản trị duy nhất.",
    "grid.f4.title": "Đơn hàng & Phòng bàn",
    "grid.f4.desc": "Trực quan hóa sơ đồ phòng bàn, chuyển bàn, gộp hóa đơn và quản lý đơn hàng chờ tiện lợi.",
    "grid.f5.title": "Tích hợp Cổng Thanh toán",
    "grid.f5.desc": "Hỗ trợ quét mã QR động, thẻ ngân hàng, ví điện tử và tự động xác nhận giao dịch thành công.",
    "grid.f6.title": "Báo cáo Tự động",
    "grid.f6.desc": "Tự động tổng hợp doanh thu, số lượng đơn hàng, phương thức thanh toán và gửi báo cáo cuối ngày.",

    // ProductDemo
    "demo.badge": "TRẢI NGHIỆM GIAO DIỆN POS",
    "demo.title": "Mạnh mẽ, Trực quan & Dễ sử dụng",
    "demo.desc":
      "Thiết kế tối ưu cho máy POS cảm ứng và máy tính bảng. Tăng năng suất làm việc của nhân viên thu ngân lên tới 150%.",
    "demo.f1.title": "Tạo đơn hàng siêu tốc",
    "demo.f1.desc": "Chọn sản phẩm, áp dụng khuyến mãi, chọn bàn và in hóa đơn chỉ trong vài thao tác chạm.",
    "demo.f2.title": "Quản lý nhiều tab hóa đơn",
    "demo.f2.desc": "Phục vụ nhiều khách hàng cùng lúc bằng tính năng lưu trữ tạm thời và mở nhiều tab thanh toán.",
    "demo.f3.title": "Báo cáo ca trực trực quan",
    "demo.f3.desc": "Xem doanh thu theo ca, tiền mặt đầu ca, chênh lệch két tiền và lịch sử bàn giao ca.",
    "demo.f4.title": "Thiết lập máy in & Két tiền",
    "demo.f4.desc": "Kết nối trực tiếp qua LAN, Wifi hoặc Bluetooth với tính năng tự động mở két tiền khi thanh toán.",

    // FeatureDeepDive
    "dive.f1.title": "Đồng bộ thời gian thực trên mọi thiết bị",
    "dive.f1.desc":
      "Mọi thay đổi về sản phẩm, giá bán, hoặc trạng thái đơn hàng đều được đồng bộ tức thì đến tất cả máy POS và thiết bị cầm tay của nhân viên.",
    "dive.f1.cta": "Khám phá tính năng đồng bộ",
    "dive.f2.title": "Số liệu phân tích thúc đẩy tăng trưởng",
    "dive.f2.desc":
      "Biểu đồ trực quan giúp bạn nắm bắt mặt hàng bán chạy, khung giờ cao điểm và hiệu suất làm việc của từng nhân viên.",
    "dive.f2.cta": "Xem báo cáo mẫu",
    "dive.f3.title": "Hệ thống mở rộng & Tích hợp",
    "dive.f3.desc":
      "Dễ dàng kết nối với các ứng dụng giao hàng (Grab, ShopeeFood), phần mềm kế toán và quản lý khách hàng thân thiết (CRM).",
    "dive.f3.cta": "Xem tài liệu tích hợp",

    // SecuritySection
    "sec.badge": "AN TOÀN & BẢO MẬT DỮ LIỆU",
    "sec.title": "Mặc định an toàn tuyệt đối",
    "sec.desc":
      "Chúng tôi áp dụng các tiêu chuẩn bảo mật dữ liệu nghiêm ngặt nhất để bảo vệ thông tin kinh doanh và lịch sử giao dịch của bạn.",
    "sec.f1.title": "Mã hóa dữ liệu đám mây",
    "sec.f1.desc": "Mọi giao dịch và thông tin khách hàng được mã hóa hai chiều theo tiêu chuẩn doanh nghiệp.",
    "sec.f2.title": "Cam kết Hoạt động Liên tục",
    "sec.f2.desc": "Hạ tầng máy chủ đám mây mạnh mẽ, sao lưu tự động hàng giờ giúp dữ liệu của bạn luôn an toàn.",
    "sec.f3.title": "Lịch sử kiểm tra hoạt động",
    "sec.f3.desc": "Ghi lại mọi hoạt động sửa xóa hóa đơn, hoàn tiền, điều chỉnh kho của nhân viên để tránh gian lận.",

    // Pricing
    "pricing.badge": "BẢNG GIÁ PHÙ HỢP CỬA HÀNG",
    "pricing.title": "Chọn gói dịch vụ phù hợp",
    "pricing.desc": "Bắt đầu dùng thử miễn phí và nâng cấp linh hoạt theo quy mô số lượng máy POS và chi nhánh.",
    "pricing.annual": "Thanh toán năm (Tiết kiệm 20%)",
    "pricing.monthly": "Thanh toán tháng",
    "pricing.popular": "Phổ biến nhất",
    "pricing.cta": "Bắt đầu ngay",
    "pricing.free.title": "Cơ bản",
    "pricing.free.desc": "Hoàn hảo cho 1 cửa hàng nhỏ bắt đầu số hóa bán hàng.",
    "pricing.pro.title": "Chuyên nghiệp",
    "pricing.pro.desc": "Dành cho các cửa hàng, nhà hàng quy mô lớn hoặc nhiều thiết bị.",
    "pricing.ent.title": "Doanh nghiệp",
    "pricing.ent.desc": "Gói tùy biến hạ tầng riêng cho chuỗi bán lẻ, chuỗi nhượng quyền lớn.",

    // CTA
    "cta.title": "Sẵn sàng nâng tầm cửa hàng của bạn?",
    "cta.desc": "Trải nghiệm hệ thống quản lý bán hàng và thanh toán POS hiện đại bậc nhất của ZPOS ngay hôm nay.",
    "cta.start": "Dùng thử miễn phí ngay",
    "cta.contact": "Liên hệ tư vấn lắp đặt",

    // Footer
    "footer.desc": "Hệ thống phần mềm quản lý bán hàng, thanh toán và đồng bộ dữ liệu POS chuyên nghiệp.",
    "footer.product": "Sản phẩm",
    "footer.company": "Công ty",
    "footer.resources": "Tài nguyên",
    "footer.legal": "Pháp lý",
  },
  en: {
    // Header
    "nav.features": "Features",
    "nav.products": "Products",
    "nav.security": "Security",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.signup": "Sign up",
    "nav.docs": "Docs",
    "nav.changelog": "Updates",
    "nav.blog": "Blog",

    // Hero
    "hero.badge": "⚡️ All-in-One POS & Sales Management",
    "hero.title1": "Superfast Checkout, Secure &",
    "hero.title2": "Optimize Your ZPOS Store Network",
    "hero.subtitle": "Multi-channel sales management with real-time sync and seamless offline-first operation.",
    "hero.cta.trial": "Start free trial",
    "hero.cta.docs": "Explore features",
    "hero.feature1.meta": "01 // OFFLINE SYNC",
    "hero.feature1.title": "Uninterrupted Sales",
    "hero.feature1.desc": "Supports offline-first mode, automatically syncing data once connection is restored.",
    "hero.feature2.meta": "02 // MULTI-DEVICE",
    "hero.feature2.title": "Instant Sync",
    "hero.feature2.desc": "Seamless connection between POS terminal, tablet, phone, and receipt printer.",
    "hero.feature3.meta": "03 // ADVANCED METRICS",
    "hero.feature3.title": "Real-time Analytics",
    "hero.feature3.desc": "Monitor sales, manage shifts, and track inventory in real-time from anywhere.",

    // FeatureGrid
    "grid.badge": "SALES ECOSYSTEM",
    "grid.title": "Everything you need to operate",
    "grid.subtitle":
      "No more piecing together fragmented software. Manage your entire business from a unified, secure POS platform.",
    "grid.f1.title": "Sub-3s Checkout",
    "grid.f1.desc": "Minimalist touch-optimized interface helps cashiers serve customers faster.",
    "grid.f2.title": "Shift & Data Security",
    "grid.f2.desc": "Strict staff permission controls, preventing revenue leaks and encrypting transaction history.",
    "grid.f3.title": "Multi-Store Network",
    "grid.f3.desc": "Manage multiple branches and independent or linked warehouses on a single admin dashboard.",
    "grid.f4.title": "Table & Room Layout",
    "grid.f4.desc": "Visualize table layouts, split/merge bills, and manage pending orders effortlessly.",
    "grid.f5.title": "Payment Gateways",
    "grid.f5.desc": "Supports dynamic QR codes, bank cards, e-wallets, and auto-verifies successful transactions.",
    "grid.f6.title": "Automated Reporting",
    "grid.f6.desc":
      "Automatically aggregates revenue, orders, payment methods, and sends reports at the end of the day.",

    // ProductDemo
    "demo.badge": "POS INTERFACE EXPERIENCE",
    "demo.title": "Powerful, Intuitive & Easy to Use",
    "demo.desc": "Optimized design for touchscreens and tablets. Boost cashier productivity by up to 150%.",
    "demo.f1.title": "Fast order creation",
    "demo.f1.desc": "Select items, apply discounts, assign tables, and print bills in just a few taps.",
    "demo.f2.title": "Multi-tab order management",
    "demo.f2.desc": "Serve multiple guests simultaneously using temporary save and multi-tab billing.",
    "demo.f3.title": "Visual shift reports",
    "demo.f3.desc": "View shift-based sales, starting cash, register discrepancies, and hand-over history.",
    "demo.f4.title": "Printer & Drawer Setup",
    "demo.f4.desc": "Connect directly via LAN, Wi-Fi, or Bluetooth with auto-open cash drawer functionality.",

    // FeatureDeepDive
    "dive.f1.title": "Real-time sync across all devices",
    "dive.f1.desc":
      "Any updates to products, prices, or order status are instantly synced across all POS terminals and handheld staff devices.",
    "dive.f1.cta": "Explore sync features",
    "dive.f2.title": "Insights that drive growth",
    "dive.f2.desc": "Visual charts help you capture top-selling items, peak hours, and individual staff performance.",
    "dive.f2.cta": "View sample reports",
    "dive.f3.title": "Extensible & Scalable",
    "dive.f3.desc":
      "Easily connect with delivery apps (Grab, ShopeeFood), accounting software, and loyalty programs (CRM).",
    "dive.f3.cta": "View integration docs",

    // SecuritySection
    "sec.badge": "DATA SECURITY & RELIABILITY",
    "sec.title": "Secure by default",
    "sec.desc":
      "We apply the strictest data security standards to protect your business information and transaction history.",
    "sec.f1.title": "Cloud Data Encryption",
    "sec.f1.desc": "All transactions and customer profiles are bi-directionally encrypted using enterprise standards.",
    "sec.f2.title": "Continuous Uptime",
    "sec.f2.desc": "Robust cloud infrastructure with hourly auto-backups keeps your data safe forever.",
    "sec.f3.title": "Activity Audit Logs",
    "sec.f3.desc": "Log all invoice modifications, refunds, and inventory adjustments to prevent fraud.",

    // Pricing
    "pricing.badge": "AFFORDABLE RETAIL PRICING",
    "pricing.title": "Choose your perfect plan",
    "pricing.desc": "Start completely free and upgrade easily as your store network and POS terminals scale.",
    "pricing.annual": "Billed annually (Save 20%)",
    "pricing.monthly": "Billed monthly",
    "pricing.popular": "Most Popular",
    "pricing.cta": "Get Started",
    "pricing.free.title": "Starter",
    "pricing.free.desc": "Perfect for small shops starting to digitalize sales.",
    "pricing.pro.title": "Professional",
    "pricing.pro.desc": "For large stores, restaurants, or multi-device setups.",
    "pricing.ent.title": "Enterprise",
    "pricing.ent.desc": "Custom infrastructure for large retail and franchise chains.",

    // CTA
    "cta.title": "Ready to scale your store network?",
    "cta.desc": "Start experiencing the most advanced POS management and payment capabilities of ZPOS today.",
    "cta.start": "Start free trial",
    "cta.contact": "Contact sales & setup",

    // Footer
    "footer.desc": "Professional sales management, payments, and data sync system for POS stores.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.resources": "Resources",
    "footer.legal": "Legal",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    // Load from localStorage if set
    const saved = localStorage.getItem("zpos-lang") as Language;
    if (saved === "vi" || saved === "en") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("zpos-lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["vi"][key] || key;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
