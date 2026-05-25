"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Smartphone,
  ShieldCheck,
  Server,
  Layers,
  Activity,
  Terminal,
  ShoppingBag,
  TrendingUp,
  Printer,
  QrCode,
  CreditCard,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Check,
  ChevronRight,
  Package,
  Users,
  BarChart3,
  GitBranch,
  Building,
  Monitor,
  Scan,
  Coins,
  Search,
  WifiOff,
  Database,
  Info,
  PhoneCall,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "../_components/Header";
import { Footer } from "../_components/Footer";
import { LanguageProvider, useLanguage } from "../_components/LanguageContext";

// Local translations for the self-contained Products Page to prevent layout translation bugs
const pageDict = {
  vi: {
    heroBadge: "✨ THIẾT BỊ & NỀN TẢNG BÁN HÀNG THẾ HỆ MỚI",
    heroTitle: "Hệ Sinh Thái POS Toàn Diện",
    heroTitleGradient: "Bứt Phá Doanh Thu Cửa Hàng",
    heroSubtitle:
      "Giải pháp quản lý bán lẻ, nhà hàng và F&B chuyên nghiệp. Tự động đồng bộ hóa kho, kết nối đa kênh & hoạt động offline-first thông minh.",
    heroCtaFree: "Dùng thử miễn phí",
    heroCtaDemo: "Trải nghiệm Simulator",

    // POS Cashier Simulator Section
    simTitle: "Trình Giả Lập Thu Ngân ZPOS Live",
    simSubtitle: "Hãy tự tay trải nghiệm quy trình bán hàng siêu tốc dưới 3 giây của ZPOS ngay bên dưới!",
    simBadge: "TRỰC QUAN LIVE",
    simSelectCate: "Chọn nhóm mặt hàng:",
    simCart: "Đơn Hàng Chờ Thanh Toán",
    simEmptyCart: "Chưa có sản phẩm nào. Chọn mặt hàng ở menu bên trái để thêm vào đơn hàng!",
    simDiscountCode: "Mã giảm giá (ZPOS20, FREE):",
    simApply: "Áp dụng",
    simPlaceholderCode: "Nhập mã...",
    simSubtotal: "Tạm tính",
    simDiscount: "Giảm giá",
    simTax: "Thuế VAT (10%)",
    simTotal: "Tổng thanh toán",
    simMethod: "Phương thức thanh toán:",
    simPayCash: "Tiền mặt",
    simPayCard: "Quẹt thẻ POS",
    simPayQR: "VietQR động",
    simBtnPay: "Thực Hiện Thanh Toán",
    simGeneratingQR: "Đang tạo VietQR động chứa số tiền...",
    simQRTitle: "Quét Mã VietQR Để Thanh Toán",
    simQRSub: "Tự động nhận diện & xác thực giao dịch sau khi chuyển khoản thành công.",
    simReceiptTitle: "HÓA ĐƠN THANH TOÁN ZPOS",
    simReceiptPrint: "In hóa đơn thành công!",
    simReceiptClose: "Tạo đơn mới",
    simReceiptNo: "HĐ số:",
    simReceiptDate: "Ngày bán:",
    simReceiptStaff: "Thu ngân: ZPOS Admin",

    // Modules tabs section
    modTitle: "Phân Hệ Quản Lý Chuyên Sâu",
    modSubtitle:
      "ZPOS tích hợp đầy đủ tính năng trong một nền tảng duy nhất, loại bỏ việc kết nối nhiều phần mềm rời rạc.",
    modSales: "Bán Hàng & Thu Ngân",
    modInventory: "Quản Lý Kho Hàng",
    modCrm: "Chăm Sóc VIP Customer",
    modAnalytics: "Báo Cáo Doanh Số",
    modMultistore: "Đa Chi Nhánh & Cloud",

    // Hardware widget
    hwTitle: "Đề Xuất Combo Phần Cứng Tối Ưu",
    hwSubtitle:
      "Lựa chọn mô hình kinh doanh của bạn để nhận đề xuất trọn bộ thiết bị bán hàng tương thích 100% với ZPOS.",
    hwRetail: "Chuỗi Bán Lẻ / Tạp Hóa",
    hwFnB: "Quán Café / Nhà Hàng / F&B",
    hwFashion: "Thời Trang / Boutique / Mỹ Phẩm",
    hwInclude: "Bộ thiết bị bao gồm:",
    hwSpec: "Thông số kỹ thuật chính",
    hwOrderBtn: "Đăng ký nhận báo giá ưu đãi",

    // Comparison
    compTitle: "Sự Khác Biệt Giữa ZPOS & POS Truyền Thống",
    compSubtitle: "Đột phá về mặt công nghệ giúp ZPOS vận hành ổn định, bảo mật và tiết kiệm chi phí gấp 3 lần.",
    compFeature: "Tính năng / Công nghệ",
    compZpos: "Hệ sinh thái ZPOS Pro",
    compOld: "Hệ thống POS truyền thống",

    // Form
    formTitle: "Đăng Ký Tư Vấn & Dùng Thử 14 Ngày Miễn Phí",
    formSubtitle:
      "Hơn 12,000+ chủ cửa hàng đã tin dùng ZPOS để tự động hóa vận hành và bứt phá doanh số. Đăng ký ngay hôm nay!",
    formName: "Họ và tên của bạn",
    formPhone: "Số điện thoại liên hệ",
    formStore: "Tên cửa hàng / Doanh nghiệp",
    formType: "Mô hình kinh doanh",
    formScale: "Quy mô nhân sự",
    formSubmit: "Kích Hoạt Dùng Thử Miễn Phí",
    formSuccess: "Đăng ký thành công!",
    formSuccessDesc: "Chuyên viên ZPOS sẽ liên hệ hỗ trợ bạn lắp đặt và cấu hình tài khoản trong vòng 15 phút.",
  },
  en: {
    heroBadge: "✨ NEXT-GEN RETAIL INFRASTRUCTURE & POS",
    heroTitle: "Unified Omnichannel POS",
    heroTitleGradient: "Empower Your Store Sales",
    heroSubtitle:
      "Professional solution for retail shops, restaurants, and F&B businesses. Automated stock management, real-time multi-channel sync & offline-first capability.",
    heroCtaFree: "Start Free Trial",
    heroCtaDemo: "Try Simulator",

    // POS Cashier Simulator Section
    simTitle: "ZPOS Live Cashier Simulator",
    simSubtitle: "Experience our sub-3s checkout speed directly in your browser below!",
    simBadge: "INTERACTIVE DEMO",
    simSelectCate: "Select category:",
    simCart: "Pending Customer Cart",
    simEmptyCart: "Your cart is empty. Click items in the left menu to add them!",
    simDiscountCode: "Promo Code (ZPOS20, FREE):",
    simApply: "Apply",
    simPlaceholderCode: "Enter code...",
    simSubtotal: "Subtotal",
    simDiscount: "Discount",
    simTax: "VAT Tax (10%)",
    simTotal: "Grand Total",
    simMethod: "Payment Method:",
    simPayCash: "Cash payment",
    simPayCard: "POS Card Swipe",
    simPayQR: "Dynamic VietQR",
    simBtnPay: "Execute Payment",
    simGeneratingQR: "Generating secure dynamic payment QR code...",
    simQRTitle: "Scan VietQR Code To Pay",
    simQRSub: "Automatically verifies the transaction instantly once payment is successfully received.",
    simReceiptTitle: "OFFICIAL ZPOS RECEIPT",
    simReceiptPrint: "Receipt printed successfully!",
    simReceiptClose: "New Order",
    simReceiptNo: "Receipt ID:",
    simReceiptDate: "Date-Time:",
    simReceiptStaff: "Cashier: ZPOS Admin",

    // Modules tabs section
    modTitle: "Advanced Business Modules",
    modSubtitle:
      "ZPOS bundles all advanced operations into one central platform, avoiding complicated third-party integrations.",
    modSales: "Cashier & Checkout",
    modInventory: "Inventory & Stock",
    modCrm: "VIP Loyalty & CRM",
    modAnalytics: "Analytics & Reports",
    modMultistore: "Multi-Store & Cloud Sync",

    // Hardware widget
    hwTitle: "Optimized Hardware Setup Recommendations",
    hwSubtitle:
      "Choose your business type to find perfectly compatible retail hardware bundles certified to work with ZPOS.",
    hwRetail: "Retail Chain / Supermarket",
    hwFnB: "Café / Restaurant / F&B Outlets",
    hwFashion: "Fashion / Boutique / Cosmetics",
    hwInclude: "Hardware bundle includes:",
    hwSpec: "Key Technical Specs",
    hwOrderBtn: "Request Custom Pricing Quote",

    // Comparison
    compTitle: "Why Choose ZPOS over Traditional Software?",
    compSubtitle: "Technological advancements that keep your data safe, system secure, and operation cost 3x lower.",
    compFeature: "Feature / Capability",
    compZpos: "ZPOS Pro Ecosystem",
    compOld: "Traditional POS Software",

    // Form
    formTitle: "Get Started With Your 14-Day Free Trial",
    formSubtitle:
      "Over 12,000+ business owners trust ZPOS to automate their sales and growth. Sign up to get custom onboarding support today!",
    formName: "Full name",
    formPhone: "Mobile number",
    formStore: "Store / Brand name",
    formType: "Business category",
    formScale: "Business size / Employees",
    formSubmit: "Activate My Free Account",
    formSuccess: "Registration successful!",
    formSuccessDesc: "Our setup expert will contact you to configure your new POS store dashboard in 15 minutes.",
  },
};

// Mock items for Simulator
const SIMULATOR_ITEMS = {
  vi: [
    {
      id: "item-1",
      name: "Cà phê Muối Đá",
      price: 39000,
      category: "fnb",
      code: "CF-SALT",
      color: "bg-amber-100 text-amber-800",
    },
    {
      id: "item-2",
      name: "Trà Đào Cam Sả",
      price: 45000,
      category: "fnb",
      code: "TR-PEACH",
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "item-3",
      name: "Bánh Mì Kẹp Thịt",
      price: 35000,
      category: "fnb",
      code: "BM-MEAT",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "item-4",
      name: "Sữa Chua Trái Cây",
      price: 29000,
      category: "fnb",
      code: "SC-FRUIT",
      color: "bg-emerald-100 text-emerald-800",
    },

    {
      id: "item-5",
      name: "Sữa Tươi Tiệt Trùng 1L",
      price: 32000,
      category: "retail",
      code: "MILK-1L",
      color: "bg-sky-100 text-sky-800",
    },
    {
      id: "item-6",
      name: "Mì Gói Hảo Hảo (Thùng)",
      price: 115000,
      category: "retail",
      code: "MI-HAO",
      color: "bg-red-100 text-red-800",
    },
    {
      id: "item-7",
      name: "Nước Rửa Chén Sunlight 1.5kg",
      price: 58000,
      category: "retail",
      code: "SUN-15",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "item-8",
      name: "Khăn Giấy Ướt Cao Cấp",
      price: 22000,
      category: "retail",
      code: "PAPER-WET",
      color: "bg-blue-100 text-blue-800",
    },

    {
      id: "item-9",
      name: "Áo Thun Unisex Aeonik",
      price: 250000,
      category: "fashion",
      code: "TSHIRT-UN",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "item-10",
      name: "Quần Jeans Nữ Baggy",
      price: 380000,
      category: "fashion",
      code: "JEAN-BAG",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      id: "item-11",
      name: "Mũ Lưỡi Trai Classic",
      price: 120000,
      category: "fashion",
      code: "CAP-CLASS",
      color: "bg-zinc-100 text-zinc-800",
    },
    {
      id: "item-12",
      name: "Son Môi Cao Cấp Z-Pink",
      price: 450000,
      category: "fashion",
      code: "LIP-ZPK",
      color: "bg-rose-100 text-rose-800",
    },
  ],
  en: [
    {
      id: "item-1",
      name: "Salted Iced Coffee",
      price: 39000,
      category: "fnb",
      code: "CF-SALT",
      color: "bg-amber-100 text-amber-800",
    },
    {
      id: "item-2",
      name: "Peach Orange Lemongrass Tea",
      price: 45000,
      category: "fnb",
      code: "TR-PEACH",
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "item-3",
      name: "Vietnamese Pork Banh Mi",
      price: 35000,
      category: "fnb",
      code: "BM-MEAT",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "item-4",
      name: "Fruit Yogurt Bowl",
      price: 29000,
      category: "fnb",
      code: "SC-FRUIT",
      color: "bg-emerald-100 text-emerald-800",
    },

    {
      id: "item-5",
      name: "Fresh Milk 1L Box",
      price: 32000,
      category: "retail",
      code: "MILK-1L",
      color: "bg-sky-100 text-sky-800",
    },
    {
      id: "item-6",
      name: "Hao Hao Instant Noodle (Box)",
      price: 115000,
      category: "retail",
      code: "MI-HAO",
      color: "bg-red-100 text-red-800",
    },
    {
      id: "item-7",
      name: "Sunlight Dishwash Liquid 1.5kg",
      price: 58000,
      category: "retail",
      code: "SUN-15",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "item-8",
      name: "Premium Wet Wipes Pack",
      price: 22000,
      category: "retail",
      code: "PAPER-WET",
      color: "bg-blue-100 text-blue-800",
    },

    {
      id: "item-9",
      name: "Aeonik Unisex Cotton T-Shirt",
      price: 250000,
      category: "fashion",
      code: "TSHIRT-UN",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "item-10",
      name: "Baggy Denim Jeans Women",
      price: 380000,
      category: "fashion",
      code: "JEAN-BAG",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      id: "item-11",
      name: "Classic Cotton Cap",
      price: 120000,
      category: "fashion",
      code: "CAP-CLASS",
      color: "bg-zinc-100 text-zinc-800",
    },
    {
      id: "item-12",
      name: "Lux Velvet Lipstick Red",
      price: 450000,
      category: "fashion",
      code: "LIP-ZPK",
      color: "bg-rose-100 text-rose-800",
    },
  ],
};

// Hardwares configuration
const HARDWARE_BUNDLES = {
  vi: {
    retail: {
      name: "Combo ZPOS Retail Max",
      price: "11,850,000đ",
      desc: "Trọn bộ giải pháp chuyên dùng cho siêu thị, cửa hàng tạp hóa bán lẻ có lượng khách và hàng hóa lớn.",
      devices: [
        { name: "Máy POS cảm ứng đứng Z15G", desc: "Màn hình 15.6 inch HD sắc nét, chip xử lý đa nhiệm cực nhanh." },
        { name: "Máy quét mã vạch Honeywell 2D", desc: "Quét siêu tốc mọi bề mặt barcode, mã QR mờ xước." },
        { name: "Máy in hóa đơn siêu tốc K80", desc: "Tự động cắt giấy, đầu in nhiệt Nhật Bản bền bỉ." },
        { name: "Két đựng tiền thép đúc M410", desc: "4 ngăn tiền giấy + 5 ngăn tiền xu, tự động mở khi in hóa đơn." },
      ],
      specs: [
        { label: "Kết nối", value: "LAN, Wifi, Bluetooth" },
        { label: "Độ bền đầu in", value: "150 Kilomet hóa đơn" },
        { label: "Bảo hành", value: "24 tháng 1 đổi 1 tận nơi" },
      ],
    },
    fnb: {
      name: "Combo ZPOS F&B Air",
      price: "8,900,000đ",
      desc: "Giải pháp nhỏ gọn, tinh tế, sang trọng tối ưu diện tích cho quầy bar nhà hàng, quán café.",
      devices: [
        { name: "Máy POS để bàn tích hợp màn phụ", desc: "Màn hình kép cảm ứng đa điểm, hiển thị số tiền cho khách." },
        { name: "Màn hình order nhà bếp (KDS)", desc: "Nhận đơn tức thì từ bàn, loại bỏ giấy in bill nhầm lẫn." },
        { name: "Máy in bill nhiệt không dây LAN/Wifi", desc: "Hỗ trợ in từ điện thoại, iPad của nhân viên ở xa." },
        { name: "Két đựng tiền an toàn tự động", desc: "Kích thước gọn gàng, khung thép chắc chắn chống cạy mở." },
      ],
      specs: [
        { label: "Màn hình khách", value: "LCD 10.1 inch sắc nét hiển thị mã QR" },
        { label: "Khoảng cách Wifi", value: "Phủ sóng bán kính lên đến 50 mét" },
        { label: "Tính năng nổi bật", value: "Tự nhận tín hiệu từ màn bếp KDS" },
      ],
    },
    fashion: {
      name: "Combo ZPOS Boutique Pro",
      price: "10,500,000đ",
      desc: "Giải pháp quản lý thanh lịch, in tem mác mã vạch sản phẩm phục vụ đắc lực ngành hàng thời trang mỹ phẩm.",
      devices: [
        {
          name: "Máy POS Cầm Tay ZPOS Handheld X2",
          desc: "Tích hợp sẵn máy in hóa đơn trên thân máy, cơ động bán hàng.",
        },
        { name: "Máy in tem nhãn mã vạch barcode", desc: "In nhãn dán quần áo, giày dép bền mực không phai màu." },
        {
          name: "Máy quét mã vạch không dây Bluetooth",
          desc: "Di chuyển linh hoạt trong kho hàng rộng quét mã từ xa.",
        },
        { name: "Két tiền mở khóa tự động ZPOS Pro", desc: "Thiết kế kim loại cao cấp sơn tĩnh điện siêu bền." },
      ],
      specs: [
        { label: "Máy cầm tay", value: "Hệ điều hành Android 11, sạc nhanh Type-C" },
        { label: "Máy in tem", value: "Độ phân giải 203 DPI siêu nét" },
        { label: "Bảo hành", value: "18 tháng toàn quốc" },
      ],
    },
  },
  en: {
    retail: {
      name: "ZPOS Retail Max Bundle",
      price: "$490",
      desc: "Full comprehensive business setup built specifically for high-traffic grocery, retail store & supermarkets.",
      devices: [
        { name: "Touch POS Terminal Z15G", desc: "15.6-inch HD multi-touch responsive panel, high speed processor." },
        {
          name: "Honeywell 2D Barcode Scanner",
          desc: "Ultra-fast laser scanning of scratched, small or digital barcodes.",
        },
        { name: "Heavy Duty Thermal Printer K80", desc: "Auto-cutter mechanism, durable Japanese thermal head." },
        {
          name: "Solid Steel Cash Drawer M410",
          desc: "4 bill + 5 coin compartments, automatically triggers upon printing.",
        },
      ],
      specs: [
        { label: "Connectivity", value: "LAN, Dual-band Wifi, Bluetooth" },
        { label: "Printer Durability", value: "150 Kilometers of receipts" },
        { label: "Warranty Coverage", value: "24-Month on-site replacement" },
      ],
    },
    fnb: {
      name: "ZPOS F&B Air Bundle",
      price: "$380",
      desc: "Elegant, low-profile modular design ideal to save counter space for coffee shops & bars.",
      devices: [
        {
          name: "Dual-Screen Desktop POS Monitor",
          desc: "Allows dual view for cashier and customer displaying payment sum.",
        },
        {
          name: "Kitchen Display Screen (KDS)",
          desc: "Receives table orders instantly, eliminating wrong paper orders.",
        },
        {
          name: "Wireless Thermal receipt printer LAN/Wifi",
          desc: "Supports remote printing from waitress tablet/phones.",
        },
        { name: "Premium Compact Cash Drawer", desc: "Reinforced steel framing, secure lock mechanism." },
      ],
      specs: [
        { label: "Customer Display", value: "10.1-inch LCD showing total and VietQR code" },
        { label: "Wireless Coverage", value: "Radius coverage up to 50 meters wide" },
        { label: "F&B Key feature", value: "Auto-routed kitchen KDS priority sync" },
      ],
    },
    fashion: {
      name: "ZPOS Boutique Pro Bundle",
      price: "$430",
      desc: "Chic design with barcode sticker printer optimized for fashion boutiques and cosmetic stores.",
      devices: [
        {
          name: "ZPOS Smart Handheld X2 Terminal",
          desc: "Tích hợp sẵn printer right on-device, roam around to cash out.",
        },
        { name: "Thermal Barcode Label Sticker Printer", desc: "Print durable price tags, size & wash labels easily." },
        { name: "Wireless Bluetooth Barcode Scanner", desc: "Walk around warehouse to scan barcodes remotely." },
        { name: "Automated Push Cash Drawer", desc: "Premium matte black coating, heavy steel gears." },
      ],
      specs: [
        { label: "Handheld OS", value: "Android 11 with fast charging Type-C port" },
        { label: "Sticker Resolution", value: "203 DPI sharp font output" },
        { label: "Warranty Coverage", value: "18-Month comprehensive hardware warranty" },
      ],
    },
  },
};

export default function ProductIntroductionPage() {
  return (
    <LanguageProvider>
      <ProductContent />
    </LanguageProvider>
  );
}

function ProductContent() {
  const { language, t } = useLanguage();
  const baseDict = pageDict[language] || pageDict.vi;
  const itemsList = SIMULATOR_ITEMS[language] || SIMULATOR_ITEMS.vi;

  const [dynamicConfig, setDynamicConfig] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDynamicConfig() {
      try {
        const res = await fetch("/api/admin/landing-config");
        const json = await res.json();
        if (json.success && json.data) {
          setDynamicConfig(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic landing config:", err);
      }
    }

    async function fetchBlogs() {
      try {
        const res = await fetch("/api/admin/blogs");
        const json = await res.json();
        if (json.success && json.data) {
          setBlogs(json.data.filter((b: any) => b.status === "published"));
        }
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
      }
    }

    fetchDynamicConfig();
    fetchBlogs();
  }, []);

  const dict = {
    ...baseDict,
    logoText: dynamicConfig?.logoText || "ZPOS Solutions",
    heroTitle: dynamicConfig?.heroTitle || baseDict.heroTitle,
    heroSubtitle: dynamicConfig?.heroSub || baseDict.heroSubtitle,
    heroCtaFree: dynamicConfig?.primaryButtonText || baseDict.heroCtaFree,
    heroCtaDemo: dynamicConfig?.secondaryButtonText || baseDict.heroCtaDemo,
    accentColor: dynamicConfig?.accentColor || "#0036ff",
  };

  // Simulator States
  const [selectedSimCategory, setSelectedSimCategory] = useState<"fnb" | "retail" | "fashion">("fnb");
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number; code: string }[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [activeDiscountPercentage, setActiveDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("qr");

  // Payment step
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"cart" | "qr_display" | "receipt">("cart");
  const [generatedReceiptId, setGeneratedReceiptId] = useState("");

  // Product modules tab state
  const [activeModuleTab, setActiveModuleTab] = useState<"sales" | "inventory" | "crm" | "analytics" | "multistore">(
    "sales",
  );

  // Hardware bundle selected state
  const [activeHardwareTab, setActiveHardwareTab] = useState<"retail" | "fnb" | "fashion">("fnb");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    storeName: "",
    businessType: "fnb",
    scale: "1-5",
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Audio printing effect (mock ref)
  const audioContextRef = useRef<AudioContext | null>(null);

  const filteredSimItems = itemsList.filter((item) => item.category === selectedSimCategory);

  // Simulator Subtotals
  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const discountAmount = subtotal * (activeDiscountPercentage / 100);
  const vatAmount = Math.max(0, (subtotal - discountAmount) * 0.1);
  const totalAmount = Math.max(0, subtotal - discountAmount + vatAmount);

  // Trigger simulated POS printing beep & hum
  const playCheckoutSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Beep tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      // Brief thermal printer humming sound (white noise blend)
      setTimeout(() => {
        const bufferSize = ctx.sampleRate * 0.4; // 0.4s hum
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter the noise to sound muffled (like a tiny gear)
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 500;
        filter.Q.value = 3.0;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.03, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.4);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();
      }, 150);
    } catch (e) {
      // AudioContext blocked or unsupported, fail silently
    }
  };

  const handleAddToCart = (item: (typeof SIMULATOR_ITEMS.vi)[0]) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} +1`, {
      position: "bottom-right",
      duration: 1000,
    });
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.id !== itemId));
    } else {
      setCart(cart.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const handleApplyDiscount = () => {
    const cleanCode = discountCode.trim().toUpperCase();
    const cmsCode = (dynamicConfig?.promoCode || "ZPOS20").trim().toUpperCase();

    if (cleanCode === cmsCode) {
      let discountPct = 20;
      const match = (dynamicConfig?.promoDiscount || "20%").match(/(\d+)%/);
      if (match && match[1]) {
        discountPct = parseInt(match[1], 10);
      }
      setActiveDiscountPercentage(discountPct);
      toast.success(`Mã '${cmsCode}' thành công! Giảm ngay ${discountPct}%.`, { position: "bottom-right" });
    } else if (cleanCode === "ZPOS20") {
      setActiveDiscountPercentage(20);
      toast.success("Mã 'ZPOS20' thành công! Giảm ngay 20%.", { position: "bottom-right" });
    } else if (cleanCode === "FREE") {
      setActiveDiscountPercentage(100);
      toast.success("Mã 'FREE' thành công! Giảm ngay 100%.", { position: "bottom-right" });
    } else {
      toast.error("Mã giảm giá không hợp lệ!", { position: "bottom-right" });
    }
  };

  const handleExecutePayment = () => {
    if (cart.length === 0) {
      toast.error(language === "vi" ? "Giỏ hàng rỗng!" : "Your cart is empty!", { position: "bottom-right" });
      return;
    }

    if (paymentMethod === "qr") {
      setPaymentStep("qr_display");
      setIsProcessingPayment(true);

      // Simulate VietQR payment dynamic verification
      setTimeout(() => {
        setIsProcessingPayment(false);
        setGeneratedReceiptId(`ZPOS-${Math.floor(100000 + Math.random() * 900000)}`);
        setPaymentStep("receipt");
        playCheckoutSound();
        toast.success(language === "vi" ? "Thanh toán thành công qua VietQR!" : "VietQR payment confirmed!", {
          position: "bottom-right",
        });
      }, 2500);
    } else {
      // Cash/Card instant simulation
      setPaymentStep("receipt");
      setGeneratedReceiptId(`ZPOS-${Math.floor(100000 + Math.random() * 900000)}`);
      playCheckoutSound();
      toast.success(language === "vi" ? "Giao dịch thanh toán thành công!" : "Payment completed successfully!", {
        position: "bottom-right",
      });
    }
  };

  const handleResetSimulator = () => {
    setCart([]);
    setDiscountCode("");
    setActiveDiscountPercentage(0);
    setPaymentStep("cart");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.storeName) {
      toast.error(language === "vi" ? "Vui lòng nhập đầy đủ thông tin!" : "Please fill in all details.");
      return;
    }

    setIsSubmittingForm(true);

    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          storeName: formData.storeName,
          businessType: formData.businessType,
          scale: formData.scale,
          email: `${formData.name.toLowerCase().replace(/\s+/g, "")}@zpos-store.vn`,
          message: `Khách hàng đăng ký dùng thử 14 ngày. Mô hình kinh doanh: ${
            formData.businessType === "fnb"
              ? "Nhà hàng & F&B"
              : formData.businessType === "retail"
                ? "Bán lẻ & Siêu thị"
                : "Thời trang & Boutique"
          }. Quy mô: ${formData.scale} nhân viên.`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(dict.formSuccess, {
          description: dict.formSuccessDesc,
          duration: 5000,
          className: "cn-toast cn-toast-success",
        });

        // Clear input fields
        setFormData({
          name: "",
          phone: "",
          storeName: "",
          businessType: "fnb",
          scale: "1-5",
        });
      } else {
        toast.error("Đã có lỗi xảy ra khi gửi yêu cầu: " + json.error);
      }
    } catch (err: any) {
      toast.error("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-aeonik-pro overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* ==========================================
            1. HERO SECTION WITH NEON GLOW BACKDROPS
            ========================================== */}
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-slate-950 text-white overflow-hidden">
          {/* Radial light grids */}
          <div
            className="absolute inset-0 opacity-[0.25] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(0, 84, 255, 0.15) 1.2px, transparent 1.2px)`,
              backgroundSize: "30px 30px",
            }}
          />
          {/* Floating glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1240px] mx-auto px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Premium DevOps Tag */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-mono font-bold tracking-widest"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                {dict.heroBadge}
              </motion.div>

              {/* Title with sleek styling */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08] text-white"
              >
                {dict.heroTitle} <br />
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  {dict.heroTitleGradient}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
              >
                {dict.heroSubtitle}
              </motion.p>

              {/* Cta Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-4 pt-4"
              >
                <Link
                  href="#trial-form"
                  className="px-8 py-4 text-white font-bold rounded-lg transition-all hover:scale-[1.02] shadow-lg text-sm flex items-center gap-2 border"
                  style={{
                    backgroundColor: dict.accentColor,
                    borderColor: `${dict.accentColor}50`,
                    boxShadow: `0 10px 15px -3px ${dict.accentColor}30`,
                  }}
                >
                  {dict.heroCtaFree}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="#cashier-simulator"
                  className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold rounded-lg transition-colors text-sm"
                >
                  {dict.heroCtaDemo}
                </Link>
              </motion.div>

              {/* Trust Badge / Metrics grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-3xl mx-auto border-t border-slate-900/60 mt-12"
              >
                {[
                  { value: "0.8s", label: "Đồng bộ đa kênh" },
                  { value: "100%", label: "Bán hàng Offline" },
                  { value: "12,000+", label: "Cửa hàng tin dùng" },
                  { value: "99.99%", label: "Uptime Máy chủ" },
                ].map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-2xl md:text-3xl font-black text-white">{m.value}</div>
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{m.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==========================================
            2. 🎮 INTERACTIVE CASHIER SIMULATOR
            ========================================== */}
        <section className="py-24 bg-white relative" id="cashier-simulator">
          {/* Subtle decoration elements */}
          <div className="absolute top-1/3 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1240px] mx-auto px-6 relative z-10">
            {/* Header Content */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-mono font-bold uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 animate-pulse" />
                {dict.simBadge}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {dict.simTitle}
              </h2>
              <p className="text-slate-500 font-semibold text-sm max-w-xl mx-auto">{dict.simSubtitle}</p>
            </div>

            {/* Interactive Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left POS Register Menu (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200/80 rounded-xl p-6 shadow-md">
                {/* Category Switcher Tabs */}
                <div className="space-y-2 mb-6">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                    {dict.simSelectCate}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "fnb", label: language === "vi" ? "🍺 Ẩm thực & F&B" : "🍺 Food & Beverage", icon: Layers },
                      {
                        id: "retail",
                        label: language === "vi" ? "🛒 Siêu thị & Bán lẻ" : "🛒 Retail & Mart",
                        icon: ShoppingBag,
                      },
                      {
                        id: "fashion",
                        label: language === "vi" ? "👕 Boutique & Thời trang" : "👕 Fashion & Luxury",
                        icon: Users,
                      },
                    ].map((cate) => (
                      <button
                        key={cate.id}
                        onClick={() => setSelectedSimCategory(cate.id as any)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
                          selectedSimCategory === cate.id
                            ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <cate.icon className="w-3.5 h-3.5" />
                        {cate.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
                  {filteredSimItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className="bg-white border border-slate-150 rounded-lg p-4 flex flex-col justify-between cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="space-y-2">
                        <span
                          className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${item.color}`}
                        >
                          {item.code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {item.price.toLocaleString("vi-VN")}đ
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right POS Cart & Receipt (5 Cols) */}
              <div className="lg:col-span-5">
                <div className="bg-slate-950 text-white rounded-xl p-6 border border-slate-800 shadow-2xl relative min-h-[580px] flex flex-col justify-between overflow-hidden">
                  {/* Neon screen scanner accent */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500" />

                  {/* Simulator Screen Rendering */}
                  {paymentStep === "cart" && (
                    <div className="flex-1 flex flex-col justify-between h-full space-y-6">
                      {/* Cart Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <h3 className="font-extrabold text-sm flex items-center gap-2">
                          <ShoppingBag className="w-4.5 h-4.5 text-blue-400" />
                          {dict.simCart}
                        </h3>
                        {cart.length > 0 && (
                          <button
                            onClick={handleResetSimulator}
                            className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Xóa hết
                          </button>
                        )}
                      </div>

                      {/* Cart List or Empty State */}
                      <div className="flex-1 overflow-y-auto max-h-[260px] space-y-3 pr-1 scrollbar-thin-dark">
                        {cart.length === 0 ? (
                          <div className="text-center py-12 px-4 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                              {dict.simEmptyCart}
                            </p>
                          </div>
                        ) : (
                          cart.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-xs truncate text-slate-100">{item.name}</h5>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.price.toLocaleString("vi-VN")}đ
                                </span>
                              </div>

                              {/* Quantity control */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, -1)}
                                  className="w-5.5 h-5.5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-350 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black min-w-[16px] text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, 1)}
                                  className="w-5.5 h-5.5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-350 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Financial Math Summary Area */}
                      <div className="space-y-4 pt-4 border-t border-slate-900">
                        {/* Promo Coupon Inputs */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                            {dict.simDiscountCode}
                          </span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value)}
                              placeholder={dict.simPlaceholderCode}
                              className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white outline-none focus:border-blue-500 flex-1"
                            />
                            <button
                              onClick={handleApplyDiscount}
                              className="bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold rounded-xl text-slate-200 transition-colors"
                            >
                              {dict.simApply}
                            </button>
                          </div>
                          {dynamicConfig?.promoCode && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-400 font-mono">
                              <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse flex-shrink-0" />
                              <span>
                                Mã CMS active:{" "}
                                <b className="text-white bg-blue-900/60 border border-blue-700 px-1 py-0.5 rounded">
                                  {dynamicConfig.promoCode}
                                </b>{" "}
                                ({dynamicConfig.promoDiscount})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Breakdown math rows */}
                        <div className="space-y-2 text-xs font-semibold text-slate-400">
                          <div className="flex justify-between">
                            <span>{dict.simSubtotal}</span>
                            <span className="text-slate-200 font-mono">{subtotal.toLocaleString("vi-VN")}đ</span>
                          </div>
                          {activeDiscountPercentage > 0 && (
                            <div className="flex justify-between text-emerald-400">
                              <span>
                                {dict.simDiscount} (-{activeDiscountPercentage}%)
                              </span>
                              <span className="font-mono">-{discountAmount.toLocaleString("vi-VN")}đ</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>{dict.simTax}</span>
                            <span className="text-slate-200 font-mono">{vatAmount.toLocaleString("vi-VN")}đ</span>
                          </div>

                          <div className="flex justify-between pt-3 border-t border-slate-900 text-white text-sm font-black">
                            <span>{dict.simTotal}</span>
                            <span className="text-blue-400 font-mono text-base">
                              {totalAmount.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>

                        {/* Payment selection methods */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                            {dict.simMethod}
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "cash", label: dict.simPayCash, icon: DollarSign },
                              { id: "card", label: dict.simPayCard, icon: CreditCard },
                              { id: "qr", label: dict.simPayQR, icon: QrCode },
                            ].map((method) => (
                              <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id as any)}
                                className={`p-2 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-1.5 ${
                                  paymentMethod === method.id
                                    ? "bg-blue-600/10 border-blue-500 text-blue-400"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <method.icon className="w-4 h-4" />
                                {method.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Execute payment btn */}
                        <button
                          onClick={handleExecutePayment}
                          className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 px-4 font-bold text-white text-xs rounded-lg flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-300"
                        >
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          {dict.simBtnPay}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VietQR Dynamic Display Screen (Step 2) */}
                  {paymentStep === "qr_display" && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn py-8">
                      {isProcessingPayment ? (
                        <>
                          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm">{dict.simGeneratingQR}</h4>
                            <p className="text-xs text-slate-500">ZPOS cloud dynamic router link active</p>
                          </div>
                        </>
                      ) : null}

                      {!isProcessingPayment && (
                        <>
                          <div className="bg-white p-4 rounded-lg border-4 border-emerald-500/30">
                            {/* Simulated dynamic QR code based on total sum */}
                            <div className="relative w-44 h-44 bg-white flex items-center justify-center">
                              <svg className="w-40 h-40 text-black" viewBox="0 0 100 100" fill="currentColor">
                                {/* Simulated QR grid blocks */}
                                <rect x="5" y="5" width="25" height="25" />
                                <rect x="10" y="10" width="15" height="15" fill="white" />
                                <rect x="70" y="5" width="25" height="25" />
                                <rect x="75" y="10" width="15" height="15" fill="white" />
                                <rect x="5" y="70" width="25" height="25" />
                                <rect x="10" y="75" width="15" height="15" fill="white" />
                                <rect x="40" y="40" width="20" height="20" />
                                <rect x="45" y="45" width="10" height="10" fill="white" />
                                <rect x="35" y="15" width="10" height="10" />
                                <rect x="15" y="35" width="10" height="10" />
                                <rect x="55" y="15" width="10" height="10" />
                                <rect x="75" y="35" width="15" height="10" />
                                <rect x="15" y="55" width="10" height="15" />
                                <rect x="35" y="75" width="10" height="10" />
                                <rect x="55" y="75" width="10" height="15" />
                                <rect x="75" y="75" width="15" height="15" />
                              </svg>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white border-2 border-white shadow">
                                <Sparkles className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 max-w-[280px]">
                            <h4 className="font-extrabold text-base text-slate-100 flex items-center justify-center gap-1.5">
                              <QrCode className="w-5 h-5 text-blue-400" />
                              {dict.simQRTitle}
                            </h4>
                            <p className="text-xs text-slate-400 font-bold font-mono">
                              {totalAmount.toLocaleString("vi-VN")}đ
                            </p>
                            <p className="text-[11px] text-slate-500 leading-normal">{dict.simQRSub}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* High Fidelity Slip Thermal Receipt (Step 3) */}
                  {paymentStep === "receipt" && (
                    <div className="flex-1 flex flex-col justify-between h-full animate-fadeIn">
                      {/* Receipt top print banner */}
                      <div className="text-center space-y-2 py-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <h4 className="font-black text-sm text-emerald-400">{dict.simReceiptPrint}</h4>
                      </div>

                      {/* Physical Slip Box */}
                      <div className="bg-white text-slate-900 rounded-lg p-5 font-mono text-[11px] leading-relaxed shadow-inner border border-slate-200 mx-1 max-h-[300px] overflow-y-auto scrollbar-thin">
                        <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                          <h5 className="font-black text-xs uppercase tracking-tight">{dict.simReceiptTitle}</h5>
                          <p className="text-[9px] text-slate-500">Cửa hàng Trực tuyến Demo</p>
                          <p className="text-[9px] text-slate-400">123 Nguyễn Huệ, Quận 1, TPHCM</p>
                        </div>

                        <div className="py-3 border-b border-dashed border-slate-300 space-y-0.5 text-[9px] text-slate-600">
                          <div className="flex justify-between">
                            <span>{dict.simReceiptNo}</span>
                            <span className="font-bold text-slate-900">{generatedReceiptId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{dict.simReceiptDate}</span>
                            <span>
                              {new Date().toLocaleDateString("vi-VN")}{" "}
                              {new Date().toLocaleTimeString("vi-VN").slice(0, 5)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{dict.simReceiptStaff}</span>
                            <span>Admin</span>
                          </div>
                        </div>

                        {/* Receipt itemized list */}
                        <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                          {cart.map((item) => (
                            <div key={item.id} className="space-y-0.5">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span className="truncate max-w-[160px]">{item.name}</span>
                                <span>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-500">
                                <span>
                                  {item.quantity} x {item.price.toLocaleString("vi-VN")}đ
                                </span>
                                <span>CODE: {item.code}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Breakdown math block */}
                        <div className="pt-3 space-y-1 text-slate-700 text-[9px]">
                          <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                          </div>
                          {activeDiscountPercentage > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>Giảm giá ({activeDiscountPercentage}%):</span>
                              <span>-{discountAmount.toLocaleString("vi-VN")}đ</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Thuế VAT (10%):</span>
                            <span>{vatAmount.toLocaleString("vi-VN")}đ</span>
                          </div>
                          <div className="flex justify-between font-black text-slate-900 text-xs border-t border-dashed border-slate-200 pt-2 mt-1">
                            <span>TỔNG THU:</span>
                            <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
                          </div>
                        </div>

                        <div className="text-center text-[8px] text-slate-400 pt-4 border-t border-dashed border-slate-200 mt-3">
                          ZPOS Technology - Cảm ơn quý khách!
                        </div>
                      </div>

                      {/* Close button */}
                      <button
                        onClick={handleResetSimulator}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 py-3.5 rounded-lg font-bold text-xs transition-colors mt-4"
                      >
                        {dict.simReceiptClose}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            3. 🧹 DEEP BUSINESS FUNCTIONALITY TABS
            ========================================== */}
        <section className="py-24 bg-slate-50 border-y border-slate-200/50 relative">
          <div className="max-w-[1240px] mx-auto px-6">
            {/* Heading */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-mono font-bold uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                ZPOS ARCHITECTURE
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {dict.modTitle}
              </h2>
              <p className="text-slate-500 font-semibold text-sm max-w-xl mx-auto">{dict.modSubtitle}</p>
            </div>

            {/* Tab switch panel */}
            <div className="flex bg-slate-200/80 p-1.5 rounded-lg gap-1 border border-slate-300/40 max-w-4xl mx-auto mb-10 overflow-x-auto scrollbar-none">
              {[
                { id: "sales", label: dict.modSales, icon: Terminal },
                { id: "inventory", label: dict.modInventory, icon: Package },
                { id: "crm", label: dict.modCrm, icon: Users },
                { id: "analytics", label: dict.modAnalytics, icon: BarChart3 },
                { id: "multistore", label: dict.modMultistore, icon: Building },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModuleTab(tab.id as any)}
                  className={`px-4 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    activeModuleTab === tab.id
                      ? "bg-white text-blue-600 shadow"
                      : "text-slate-650 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Animated Tab Screens */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-lg min-h-[400px] flex items-center">
              <AnimatePresence mode="wait">
                {/* 1. SALES SCREEN */}
                {activeModuleTab === "sales" && (
                  <motion.div
                    key="sales"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full"
                  >
                    <div className="lg:col-span-5 space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Terminal className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {language === "vi" ? "Giao Diện Thu Ngân Siêu Tốc" : "Lightning Fast Cashier Terminal"}
                      </h3>
                      <p className="text-slate-550 text-sm font-medium leading-relaxed">
                        {language === "vi"
                          ? "Giao diện thanh toán được tối ưu hóa cho thao tác chạm đa điểm trên máy POS, iPad. Giúp thu ngân phục vụ khách chỉ trong dưới 3 giây, hỗ trợ in hóa đơn tự động và mở két tiền an toàn."
                          : "Cashier panel strictly optimized for high-speed multi-touch operations on POS screens and iPads. Check out clients under 3 seconds with automated drawer releases."}
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-bold">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi" ? "Lưu đơn hàng nháp không giới hạn" : "Unlimited draft receipt saving"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Tách hóa đơn & Gộp bàn ăn F&B linh hoạt"
                            : "F&B Table splitting and merge integration"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Offline-first: Mất mạng vẫn bán hàng bình thường"
                            : "Offline-first database functionality"}
                        </li>
                      </ul>
                    </div>

                    <div className="lg:col-span-7 bg-slate-950 rounded-lg p-5 border border-slate-800 text-slate-300 font-mono text-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] text-slate-500">ZPOS Terminal Live Debugger</span>
                      </div>

                      {/* Code snippets mockup */}
                      <div className="space-y-2">
                        <p className="text-slate-500">// Check offline synchronization state on local SQLite db</p>
                        <p className="text-white">
                          <span className="text-blue-400">const</span> offlineCache ={" "}
                          <span className="text-blue-400">await</span> SQLite.query(
                          <span className="text-emerald-400">"SELECT * FROM sales_queue WHERE synced = 0"</span>);
                        </p>
                        <p className="text-slate-300">
                          Found {`{ pendingTransactions: 0 }`}. Connection state:{" "}
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5 inline-flex">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                            ONLINE
                          </span>
                        </p>
                        <p className="text-slate-500">
                          // Trigger cash drawer lock release signal via Bluetooth ESC/POS
                        </p>
                        <p className="text-white">
                          Printer.sendBuffer(<span className="text-purple-400">new</span> Uint8Array([
                          <span className="text-amber-400">27, 112, 0, 25, 250</span>]));
                        </p>
                        <p className="text-emerald-400">
                          ✓ Signal [ESC p 0] dispatched successfully to ZPOS-K80-Printer
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. INVENTORY SCREEN */}
                {activeModuleTab === "inventory" && (
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full"
                  >
                    <div className="lg:col-span-5 space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Package className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {language === "vi" ? "Kiểm Kho Động & Định Lượng" : "Inventory Control & Sku Metrics"}
                      </h3>
                      <p className="text-slate-550 text-sm font-medium leading-relaxed">
                        {language === "vi"
                          ? "Quản lý hàng trăm nghìn mã SKU sản phẩm đa thuộc tính (size, màu sắc, lô hàng). Tự động trừ nguyên vật liệu thô theo định lượng công thức pha chế của F&B khi thanh toán đơn hàng."
                          : "Seamless inventory controls for millions of SKUs with multiple tags (size, colors, batches). Auto deducts recipes for bar and kitchen drinks when cashier checks out."}
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-bold">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Tự động cảnh báo khi tồn kho xuống mức tối thiểu"
                            : "Automated low-stock threshold triggers"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Quét mã Barcode luân chuyển kho liên chi nhánh"
                            : "Inter-store barcode transfers system"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Đồng bộ tồn kho tức thì với Shopee, TikTok Shop"
                            : "Instant stock sync with Shopee & TikTok Shops"}
                        </li>
                      </ul>
                    </div>

                    {/* Stock listing simulation */}
                    <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4.5 h-4.5 text-blue-600" />
                          {language === "vi" ? "Tồn kho an toàn chi nhánh Quận 1" : "Stock Levels Branch Q1"}
                        </h4>
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                          482 SKUs active
                        </span>
                      </div>

                      <div className="space-y-2">
                        {[
                          {
                            name: "Cà phê hạt Robusta Premium",
                            qty: "4.5 kg",
                            min: "5 kg",
                            status: "low",
                            color: "bg-red-500/10 text-red-600 border-red-500/20",
                          },
                          {
                            name: "Sữa tươi không đường Barista 1L",
                            qty: "24 hộp",
                            min: "12 hộp",
                            status: "safe",
                            color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          },
                          {
                            name: "Áo sơ mi lụa tơ tằm (Size L - Trắng)",
                            qty: "2 cái",
                            min: "5 cái",
                            status: "low",
                            color: "bg-red-500/10 text-red-600 border-red-500/20",
                          },
                          {
                            name: "Nước ngọt lon Coca-Cola 320ml",
                            qty: "185 lon",
                            min: "50 lon",
                            status: "safe",
                            color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          },
                        ].map((p, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-150 rounded-xl p-3.5 flex items-center justify-between text-xs"
                          >
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-650">Tồn: {p.qty}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.color}`}>
                                {p.status === "low"
                                  ? language === "vi"
                                    ? "Sắp hết hàng"
                                    : "Low Stock"
                                  : language === "vi"
                                    ? "An toàn"
                                    : "In Stock"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. CRM SCREEN */}
                {activeModuleTab === "crm" && (
                  <motion.div
                    key="crm"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full"
                  >
                    <div className="lg:col-span-5 space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Users className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {language === "vi" ? "Chăm Sóc Khách Hàng VIP & Loyalty" : "VIP CRM & Customer Loyalty Tiering"}
                      </h3>
                      <p className="text-slate-550 text-sm font-medium leading-relaxed">
                        {language === "vi"
                          ? "Lưu trữ tự động hồ sơ khách hàng, số điện thoại, ngày sinh nhật. Thiết lập chính sách tích điểm đổi thưởng, tự động thăng hạng thẻ VIP (Bronze, Gold, Platinum) để tăng 200% tỷ lệ mua lại."
                          : "Store comprehensive guest profiles, purchase histories, birthdates and loyalty points. Run automated ranking configurations (Bronze, Gold, Platinum) to double retention."}
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-bold">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Tra cứu điểm tích lũy khách hàng bằng số điện thoại"
                            : "Search client history by mobile number"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Tự động gửi tin nhắn SMS/Zalo chăm sóc ngày sinh"
                            : "Auto birthday greetings via Zalo/SMS"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Thống kê thói quen mua sắm chi tiết từng khách"
                            : "Shop preference metrics and analytics"}
                        </li>
                      </ul>
                    </div>

                    {/* Customer database view mock */}
                    <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4.5 h-4.5 text-blue-600" />
                        {language === "vi" ? "Dữ liệu khách hàng trung thành" : "Loyal Customer Index"}
                      </h4>

                      <div className="space-y-2">
                        {[
                          {
                            name: "Nguyễn Hoàng Minh",
                            phone: "0908 *** 456",
                            points: "1,250 pts",
                            badge: "Gold Member",
                            color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          },
                          {
                            name: "Trần Thị Mai Phương",
                            phone: "0977 *** 999",
                            points: "4,800 pts",
                            badge: "Platinum Member",
                            color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
                          },
                          {
                            name: "Phạm Minh Tuấn",
                            phone: "0912 *** 678",
                            points: "450 pts",
                            badge: "Silver Member",
                            color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                          },
                        ].map((c, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-150 rounded-xl p-3.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">SĐT: {c.phone}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-900">{c.points}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c.color}`}>
                                {c.badge}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. ANALYTICS SCREEN */}
                {activeModuleTab === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full"
                  >
                    <div className="lg:col-span-5 space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <BarChart3 className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {language === "vi" ? "Báo Cáo Tài Chính Real-time" : "Real-time Financial Dashboards"}
                      </h3>
                      <p className="text-slate-550 text-sm font-medium leading-relaxed">
                        {language === "vi"
                          ? "Biểu đồ trực quan, theo dõi doanh thu dòng tiền cuối ngày cực kỳ chính xác. Phân tích khung giờ vàng đông khách nhất, hiệu suất của từng ca thu ngân và mặt hàng bán chạy nhất."
                          : "Stunning analytics that tracks raw sales and profit lines accurately. Highlights golden shopping hours, cashier discrepancy ratios, and best selling SKUs."}
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-bold">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Báo cáo doanh thu tự động gửi về Telegram hàng giờ"
                            : "Telegram auto summaries every hour"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Phân tích biên lợi nhuận gộp theo từng ngành hàng"
                            : "Gross margin breakdowns per categories"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Theo dõi dòng tiền chênh lệch két tiền thực tế"
                            : "Real cash register audit logging tools"}
                        </li>
                      </ul>
                    </div>

                    {/* Chart simulator mockup */}
                    <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
                          {language === "vi" ? "Doanh số 7 ngày gần nhất" : "Last 7 Days Sales Trend"}
                        </h4>
                        <span className="text-xs font-black text-emerald-500">+18.4%</span>
                      </div>

                      {/* Bar graph mock */}
                      <div className="h-44 flex items-end justify-between pt-6 px-4">
                        {[
                          { day: "T2", val: "h-20", sales: "12M" },
                          { day: "T3", val: "h-24", sales: "14M" },
                          { day: "T4", val: "h-16", sales: "10M" },
                          { day: "T5", val: "h-28", sales: "16M" },
                          { day: "T6", val: "h-32", sales: "18M" },
                          { day: "T7", val: "h-40", sales: "24M" },
                          { day: "CN", val: "h-36", sales: "22M" },
                        ].map((bar, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                            <span className="text-[9px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              {bar.sales}
                            </span>
                            <div
                              className={`${bar.val} w-7 bg-gradient-to-t from-blue-600 to-sky-400 rounded-lg group-hover:from-blue-700 transition-all shadow-sm`}
                            />
                            <span className="text-[10px] font-bold text-slate-650">{bar.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 5. MULTISTORE SCREEN */}
                {activeModuleTab === "multistore" && (
                  <motion.div
                    key="multistore"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full"
                  >
                    <div className="lg:col-span-5 space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Building className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {language === "vi" ? "Đa Chi Nhánh & Cloud Database" : "Multi-Store Cloud Synchronization"}
                      </h3>
                      <p className="text-slate-550 text-sm font-medium leading-relaxed">
                        {language === "vi"
                          ? "Mở rộng không giới hạn chuỗi cửa hàng của bạn. Cơ sở dữ liệu đồng bộ trung tâm thông qua mạng lưới Supabase Edge, cập nhật thay đổi giá bán hoặc chương trình khuyến mãi cho toàn chuỗi trong 1 giây."
                          : "Scales your retail franchise network endlessly. Database central synchronization via lightning-fast Supabase Edge. Dispatches price changes or store discounts chain-wide in a single click."}
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-bold">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Phân quyền quản lý độc lập từng chi nhánh"
                            : "Separate staff access controls per outlets"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Báo cáo tổng hợp toàn chuỗi tức thì"
                            : "Instant network-wide aggregated insights"}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {language === "vi"
                            ? "Quản lý tồn kho luân chuyển trung tâm"
                            : "Central warehouse dispatch coordination tools"}
                        </li>
                      </ul>
                    </div>

                    <div className="lg:col-span-7 bg-slate-950 rounded-lg p-5 border border-slate-800 text-slate-300 font-mono text-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] text-slate-500">Global Cloud Edge Sync Log</span>
                      </div>

                      {/* Cloud terminal simulation */}
                      <div className="space-y-2">
                        <p className="text-slate-500">// Syncing tenant database with global AWS clusters</p>
                        <p className="text-white">
                          <span className="text-[#0093ff]">~</span> $ npx supabase db push --linked-store
                        </p>
                        <p className="text-white">▸ Connected to asia-east-1.supabase.co</p>
                        <p className="text-slate-350">
                          Syncing local store: <span className="text-blue-400">"Quận 1 - Nguyễn Huệ"</span> (ID:
                          st-109)... Done
                        </p>
                        <p className="text-slate-350">
                          Syncing local store: <span className="text-blue-400">"Quận 3 - Võ Văn Tần"</span> (ID:
                          st-110)... Done
                        </p>
                        <p className="text-emerald-400 font-bold">
                          ✓ Central DB state synchronized successfully. Latitude sync delay: 12ms
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ==========================================
            4. 🔌 HARDWARE COMBOS SELECTOR
            ========================================== */}
        <section className="py-24 bg-white relative">
          <div className="max-w-[1240px] mx-auto px-6">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-mono font-bold uppercase tracking-wider">
                <Printer className="w-3.5 h-3.5" />
                POS HARDWARE SETUP
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {dict.hwTitle}
              </h2>
              <p className="text-slate-550 font-semibold text-sm max-w-xl mx-auto">{dict.hwSubtitle}</p>
            </div>

            {/* Business type buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              {[
                { id: "retail", label: dict.hwRetail },
                { id: "fnb", label: dict.hwFnB },
                { id: "fashion", label: dict.hwFashion },
              ].map((bundle) => (
                <button
                  key={bundle.id}
                  onClick={() => setActiveHardwareTab(bundle.id as any)}
                  className={`p-4 rounded-lg text-xs font-extrabold border transition-all ${
                    activeHardwareTab === bundle.id
                      ? "bg-slate-950 border-slate-950 text-white shadow-lg"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50"
                  }`}
                >
                  {bundle.label}
                </button>
              ))}
            </div>

            {/* Showcase Hardware Detail */}
            {(() => {
              const bundle = (HARDWARE_BUNDLES[language] || HARDWARE_BUNDLES.vi)[activeHardwareTab];
              if (!bundle) return null;
              return (
                <div className="bg-slate-950 text-white rounded-xl p-6 md:p-8 border border-slate-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
                  {/* Left Column info (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-widest block">
                        ZPOS CERTIFIED
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black">{bundle.name}</h3>
                      <p className="text-slate-350 text-xs md:text-sm font-medium">{bundle.desc}</p>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        {dict.hwInclude}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {bundle.devices.map((dev, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                            <span className="font-extrabold text-slate-100 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {dev.name}
                            </span>
                            <p className="text-[10px] text-slate-400">{dev.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column Price Specs (5 cols) */}
                  <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-lg p-6 flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline border-b border-slate-800 pb-4">
                        <span className="text-xs font-black text-slate-400 uppercase">Combo trọn gói:</span>
                        <span className="text-2xl font-black text-blue-400 font-mono">{bundle.price}</span>
                      </div>

                      <div className="space-y-2.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                          {dict.hwSpec}
                        </span>
                        {bundle.specs.map((spec, idx) => (
                          <div key={idx} className="flex justify-between text-2xs border-b border-slate-800/40 pb-2">
                            <span className="font-bold text-slate-400">{spec.label}</span>
                            <span className="font-extrabold text-slate-200 text-right">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      href="#trial-form"
                      className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 px-4 font-bold text-white text-center text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      <PhoneCall className="w-4 h-4" />
                      {dict.hwOrderBtn}
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ==========================================
            5. 📊 COMPARISON TABLE
            ========================================== */}
        <section className="py-24 bg-slate-50 border-t border-slate-200/50">
          <div className="max-w-[1240px] mx-auto px-6">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-mono font-bold uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                ZPOS ADVANTAGE
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {dict.compTitle}
              </h2>
              <p className="text-slate-550 font-semibold text-sm max-w-xl mx-auto">{dict.compSubtitle}</p>
            </div>

            {/* Comparison Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-slate-950 text-white font-black uppercase text-[10px] tracking-wider">
                      <th className="p-4 md:p-5">{dict.compFeature}</th>
                      <th className="p-4 md:p-5 text-blue-400 bg-slate-900">{dict.compZpos}</th>
                      <th className="p-4 md:p-5 text-slate-400">{dict.compOld}</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {[
                      {
                        f: language === "vi" ? "Đồng bộ hóa dữ liệu" : "Data sync latency",
                        z: language === "vi" ? "Tức thì (Dưới 50ms) qua Cloud Edge" : "Instant (<50ms) via Edge",
                        o:
                          language === "vi" ? "Chậm, phải bấm tải lại trang hoặc cuối ngày" : "Manual end-of-day loads",
                      },
                      {
                        f: language === "vi" ? "Khi mất kết nối Internet" : "When Internet is lost",
                        z:
                          language === "vi"
                            ? "Mượt mà (Chế độ Offline-first SQLite local)"
                            : "100% active (Offline-first cache)",
                        o:
                          language === "vi"
                            ? "Ngừng hoạt động, không quét được mã/in bill"
                            : "Freezes completely, cannot print bill",
                      },
                      {
                        f: language === "vi" ? "Kết nối phần cứng" : "Hardware compatibility",
                        z:
                          language === "vi"
                            ? "Tự động phát hiện qua mạng LAN, Wifi, Bluetooth"
                            : "Plug-and-play local discovery",
                        o:
                          language === "vi"
                            ? "Phức tạp, cần cài driver thủ công từ máy tính"
                            : "Complex drivers setup manually",
                      },
                      {
                        f: language === "vi" ? "Thanh toán QR động" : "Dynamic QR payments",
                        z:
                          language === "vi"
                            ? "Hỗ trợ VietQR động tự động xác nhận giao dịch"
                            : "Supported VietQR auto-confirm",
                        o:
                          language === "vi"
                            ? "Không có, hoặc phải chụp bill đối chiếu thủ công"
                            : "Manual photo receipt audit needed",
                      },
                      {
                        f: language === "vi" ? "Mô hình Chuỗi cửa hàng" : "Multi-tenant scalability",
                        z:
                          language === "vi"
                            ? "Đồng bộ tập trung trên một dashboard duy nhất"
                            : "Unified single central console",
                        o:
                          language === "vi"
                            ? "Rời rạc, dữ liệu các kho bị lệch pha"
                            : "Mismatched stock levels in branch",
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 md:p-5 font-extrabold text-slate-900 border-r border-slate-100">{row.f}</td>
                        <td className="p-4 md:p-5 bg-blue-50/20 text-blue-700 font-extrabold border-r border-slate-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                          {row.z}
                        </td>
                        <td className="p-4 md:p-5 text-slate-400">{row.o}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            6. ✍️ TRIAL & INQUIRY FORM INTEGRATION
            ========================================== */}
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden" id="trial-form">
          {/* Neon light patterns */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1240px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column Form Info (6 Cols) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono font-bold uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    GET STARTED NOW
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{dict.formTitle}</h2>
                  <p className="text-slate-450 text-sm font-semibold max-w-lg leading-relaxed">{dict.formSubtitle}</p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Kích hoạt tức thì",
                      desc: "Không cần nhập thẻ tín dụng, tạo tài khoản và dùng ngay sau 3 phút.",
                    },
                    {
                      title: "Tư vấn thiết bị miễn phí",
                      desc: "Đội ngũ kỹ thuật hỗ trợ khảo sát và tư vấn combo phần cứng phù hợp nhất.",
                    },
                    {
                      title: "Chuyển đổi dữ liệu cũ 0đ",
                      desc: "Hỗ trợ import danh mục mặt hàng từ Excel của các phần mềm khác sang ZPOS.",
                    },
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-3 bg-slate-900 border border-slate-850 p-4 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-100">{feat.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-normal">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column Actual Form inputs (6 Cols) */}
              <div className="lg:col-span-6">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl relative">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {dict.formName} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === "vi" ? "Ví dụ: Nguyễn Văn Hùng" : "e.g. John Doe"}
                        className="w-full bg-slate-950 border border-slate-800 text-xs px-4 py-3.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone Number */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {dict.formPhone} *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={language === "vi" ? "Ví dụ: 0908123456" : "e.g. +84 908 123"}
                          className="w-full bg-slate-950 border border-slate-800 text-xs px-4 py-3.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all font-medium"
                        />
                      </div>

                      {/* Store Brand name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {dict.formStore} *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.storeName}
                          onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                          placeholder={language === "vi" ? "Ví dụ: Hùng Phát Cafe" : "e.g. Grand Coffee"}
                          className="w-full bg-slate-950 border border-slate-800 text-xs px-4 py-3.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Business Type Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {dict.formType}
                        </label>
                        <select
                          value={formData.businessType}
                          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 text-xs px-4 py-3.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all font-medium"
                        >
                          <option value="fnb">
                            {language === "vi" ? "Nhà hàng & Café F&B" : "Café & F&B Restaurant"}
                          </option>
                          <option value="retail">
                            {language === "vi" ? "Cửa hàng bán lẻ, siêu thị" : "Retail Store & Mart"}
                          </option>
                          <option value="fashion">
                            {language === "vi" ? "Thời trang, giày dép, mỹ phẩm" : "Fashion & Boutique"}
                          </option>
                        </select>
                      </div>

                      {/* Scale selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {dict.formScale}
                        </label>
                        <select
                          value={formData.scale}
                          onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 text-xs px-4 py-3.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all font-medium"
                        >
                          <option value="1-5">{language === "vi" ? "1-5 nhân viên" : "1-5 employees"}</option>
                          <option value="5-15">{language === "vi" ? "5-15 nhân viên" : "5-15 employees"}</option>
                          <option value="15-50">{language === "vi" ? "15-50 nhân viên" : "15-50 employees"}</option>
                          <option value="50+">{language === "vi" ? "Trên 50 nhân viên" : "Over 50 employees"}</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingForm}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 py-4 px-4 font-bold text-white text-xs rounded-lg flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-300 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmittingForm ? (
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                      )}
                      {dict.formSubmit}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            6. PRICING PLANS (DYNAMIC FROM CMS)
            ========================================== */}
        {(!dynamicConfig || dynamicConfig.showPricing) && (
          <section id="pricing" className="py-24 bg-white relative border-t border-slate-100">
            <div className="max-w-[1240px] mx-auto px-6">
              <div className="text-center space-y-4 mb-16">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-mono font-bold tracking-wider uppercase">
                  Bảng giá dịch vụ
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                  Chi phí linh hoạt, hiệu quả bền lâu
                </h2>
                <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
                  Lựa chọn phiên bản tối ưu cho quy mô vận hành của bạn. Đồng bộ dữ liệu & quản trị tập trung.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Basic Plan */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-8 flex flex-col justify-between hover:border-slate-350 transition-all shadow-sm hover:shadow-md relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">ZPOS Basic</h3>
                        <p className="text-xs text-slate-500 mt-1">Hoàn hảo cho cửa hàng nhỏ & kinh doanh cá thể</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        Cơ bản
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-black text-slate-900">
                        {dynamicConfig?.pricingPlanBasic || "350,000đ"}
                      </span>
                      <span className="text-slate-500 text-xs font-medium"> / tháng</span>
                    </div>

                    <div className="space-y-3.5 border-t border-slate-200/60 pt-6">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>1 Chi nhánh cửa hàng duy nhất</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Hỗ trợ tối đa 3 nhân viên thu ngân</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Quản lý kho hàng & lịch sử đơn hàng cơ bản</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Thanh toán QR chuyển khoản VietQR tự động</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href="#trial-form"
                      className="w-full bg-slate-800 hover:bg-slate-900 py-3.5 px-4 font-bold text-white text-xs rounded-lg flex items-center justify-center gap-2 transition-all text-center"
                    >
                      Bắt đầu dùng thử
                    </Link>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-blue-600 text-[9px] font-black tracking-wider uppercase px-4 py-1.5 rounded-bl-2xl">
                    Khuyên Dùng
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-black text-white">ZPOS Enterprise / Pro</h3>
                        <p className="text-xs text-slate-400 mt-1">Giải pháp tối ưu cho chuỗi & doanh nghiệp lớn</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-black text-blue-400" style={{ color: dict.accentColor }}>
                        {dynamicConfig?.pricingPlanPro || "1,250,000đ"}
                      </span>
                      <span className="text-slate-400 text-xs font-medium"> / tháng</span>
                    </div>

                    <div className="space-y-3.5 border-t border-slate-800 pt-6">
                      <div className="flex items-center gap-2.5 text-xs text-slate-300">
                        <CheckCircle2
                          className="w-4 h-4 text-blue-450 flex-shrink-0"
                          style={{ color: dict.accentColor }}
                        />
                        <span>Không giới hạn số lượng chi nhánh kho</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-300">
                        <CheckCircle2
                          className="w-4 h-4 text-blue-450 flex-shrink-0"
                          style={{ color: dict.accentColor }}
                        />
                        <span>Đồng bộ đa chi nhánh realtime qua Edge DB</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-300">
                        <CheckCircle2
                          className="w-4 h-4 text-blue-450 flex-shrink-0"
                          style={{ color: dict.accentColor }}
                        />
                        <span>Trợ lý AI phân tích doanh thu & Voice AI order</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-300">
                        <CheckCircle2
                          className="w-4 h-4 text-blue-450 flex-shrink-0"
                          style={{ color: dict.accentColor }}
                        />
                        <span>Hỗ trợ tích hợp ERP & API tùy biến riêng biệt</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href="#trial-form"
                      className="w-full py-3.5 px-4 font-bold text-white text-center text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                      style={{
                        backgroundColor: dict.accentColor,
                        boxShadow: `0 10px 15px -3px ${dict.accentColor}30`,
                      }}
                    >
                      Liên hệ tư vấn chuyên gia
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==========================================
            7. BLOG ARTICLES (DYNAMIC FROM CMS)
            ========================================== */}
        {blogs.length > 0 && (
          <section id="blog-insights" className="py-24 bg-slate-950 text-white relative border-t border-slate-900">
            {/* Ambient subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-mono font-bold tracking-widest uppercase">
                    Cổng thông tin & Công nghệ
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
                    Kiến Thức Vận Hành & <br />
                    Xu Hướng Chuyển Đổi Số
                  </h2>
                </div>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                  Cập nhật các bài phân tích chuyên sâu về quản trị kinh doanh, tối ưu chuỗi cung ứng và công nghệ AI
                  bán hàng.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogs.slice(0, 3).map((post) => (
                  <article
                    key={post.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/35 transition-all group flex flex-col h-full cursor-pointer"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className="absolute top-4 left-4 bg-blue-600/90 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full text-white"
                        style={{ backgroundColor: dict.accentColor }}
                      >
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                          <span>{post.publishedAt}</span>
                          <span>•</span>
                          <span>{post.readTime} đọc</span>
                        </div>
                        <h3 className="text-sm font-bold leading-snug group-hover:text-blue-300 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{post.summary}</p>
                      </div>

                      <div
                        className="border-t border-white/10 pt-4 flex items-center justify-between text-[11px] font-bold text-blue-400 group-hover:text-blue-300"
                        style={{ color: dict.accentColor }}
                      >
                        <span>Đọc toàn bộ bài viết</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sticky support widget float */}
        {dynamicConfig?.supportPhone && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <a
              href={`tel:${dynamicConfig.supportPhone}`}
              className="flex items-center gap-2 bg-blue-650 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-full shadow-2xl text-xs"
              style={{ backgroundColor: dict.accentColor }}
            >
              <PhoneCall className="w-4 h-4 text-white" />
              <span>Hỗ trợ: {dynamicConfig.supportPhone}</span>
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
