"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Zap,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  MessageSquare,
  Heart,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

// Tonal accent cycling words in Hero display headline as defined in DESIGN Landing.md
const ACCENT_WORDS = ["bán lẻ", "tồn kho", "doanh thu", "chi nhánh"];

const CLIENTS = [
  "BiboMart", "Juno Shoes", "KidsPlaza", "WinMart+", "An Phước", "Con Cưng", "Genshin Retail", "ViZ Solutions"
];

const PORTFOLIO_CARDS = [
  {
    id: 1,
    title: "Giao diện Bán hàng POS Siêu tốc",
    category: "POS SYSTEM",
    badgeType: "overlay",
    bgClass: "bg-[#09090b]",
    previewElement: (
      <div className="w-full h-full p-6 flex flex-col justify-between text-white select-none">
        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-slate-300">QUẦN 1 - CHI NHÁNH CHÍNH</span>
          </div>
          <span className="text-[10px] font-bold bg-[#ff5a00] text-white px-2 py-0.5 rounded border border-[#ff5a00]/20">LIVE</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-[#a1a1aa] font-medium">
            <span>Giỏ hàng (3 sản phẩm)</span>
            <span>Tổng: 480k</span>
          </div>
          <div className="space-y-2">
            <div className="h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-3">
              <span className="text-xs font-bold text-white">1x Áo sơ mi Oxford</span>
              <span className="text-xs text-[#fe45e2] font-bold">320,000 ₫</span>
            </div>
            <div className="h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-3">
              <span className="text-xs font-bold text-white">2x Tất cotton cao cấp</span>
              <span className="text-xs text-[#fe45e2] font-bold">160,000 ₫</span>
            </div>
          </div>
        </div>
        <div className="h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm">
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Thanh toán VietQR (F2)</span>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Hệ thống Báo cáo Tự động",
    category: "TELEGRAM BOT",
    badgeType: "ember", // Representing YC affiliation / special status
    bgClass: "bg-[#222222]",
    previewElement: (
      <div className="w-full h-full p-6 flex flex-col justify-between text-white select-none">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500 text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">ZPOS Telegram Bot</h5>
              <p className="text-[10px] text-sky-400 font-medium">Báo cáo cuối ngày (23:59)</p>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-white/10 pt-2.5">
            <p className="text-[10px] text-slate-300 leading-normal">
              📊 <b>Doanh thu:</b> 12,450,000đ<br />
              🛒 <b>Đơn hàng:</b> 48 đơn (AOV: 259k)<br />
              💳 <b>VietQR:</b> 80% | 💵 <b>Tiền mặt:</b> 20%
            </p>
          </div>
        </div>
        <div className="h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
          <Clock className="w-3.5 h-3.5" />
          <span>Đã gửi vào 23:59 Chủ Nhật</span>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Tuyên ngôn Thiết kế Trực quan",
    category: "DECORATIVE WASH",
    badgeType: "overlay",
    bgClass: "bg-[#fe45e2]", // Decorative Orchid Flash wash
    previewElement: (
      <div className="w-full h-full p-8 flex flex-col justify-between text-white select-none">
        <Sparkles className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '6s' }} />
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-pink-200">ORCHID FLASH</p>
          <h4 className="text-32 font-bold tracking-tight leading-none text-white">
            Tận tâm.<br />Tinh tế.<br />Khác biệt.
          </h4>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "Phân tích tồn kho thông minh AI",
    category: "AI OPERATIONS",
    badgeType: "overlay",
    bgClass: "bg-[#09090b]",
    previewElement: (
      <div className="w-full h-full p-6 flex flex-col justify-between select-none">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">AI RECOMMENDATION</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white leading-snug">
            "Sức mua nhóm hàng Áo thun sẽ tăng 35% vào tuần tới. Cần bổ sung 50 đơn vị tồn kho."
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs text-slate-300">
          <span>Độ tin cậy dự báo:</span>
          <span className="text-emerald-400 font-bold">94.8%</span>
        </div>
      </div>
    )
  }
];

export default function LandingPage() {
  const [cyclingIndex, setCyclingIndex] = useState(0);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCyclingIndex((prev) => (prev + 1) % ACCENT_WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast.error("Vui lòng điền thông tin email!");
      return;
    }
    toast.success(`Cảm ơn bạn! ZPOS sẽ liên hệ hẹn lịch demo qua email ${emailInput}.`);
    setEmailInput("");
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] selection:bg-[#fe45e2] selection:text-white font-cosmica text-[#18181b] overflow-x-hidden antialiased">
      
      {/* 📢 Announcement Banner */}
      <div className="w-full px-4 pt-4">
        <div className="max-w-[1200px] mx-auto bg-[#222222] backdrop-blur-md rounded-full py-2.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center text-white border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-[#ff5a00] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">YC</span>
            <p className="text-xs font-semibold text-slate-200">
              ZPOS vinh hạnh gia nhập cộng đồng danh giá **Y Combinator** để tái định nghĩa ngành bán lẻ đa quốc gia!
            </p>
          </div>
          <Link 
            href="/login" 
            className="text-xs font-bold text-[#fe45e2] hover:text-white transition-colors flex items-center gap-1 group"
          >
            <span>Dùng thử Beta Bản chuẩn</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 🧭 Sticky Top Navigation Bar */}
      <nav className="w-full max-w-[1200px] mx-auto px-4 mt-6 sticky top-4 z-[90]">
        <div className="bg-white/80 backdrop-blur-xl border border-[#d4d4d8] h-16 rounded-full flex items-center justify-between px-6 sm:px-8 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 bg-[#09090b] rounded-xl flex items-center justify-center text-white font-black text-lg">
              Z
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#09090b] uppercase">ZPOS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3f3f46]">
            <Link href="#features" className="hover:text-[#09090b] transition-colors">Tính năng</Link>
            <Link href="#problem" className="hover:text-[#09090b] transition-colors">Giải pháp</Link>
            <Link href="#portfolio" className="hover:text-[#09090b] transition-colors">Thiết kế</Link>
            <Link href="#stats" className="hover:text-[#09090b] transition-colors">Chỉ số</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-[#3f3f46] hover:text-[#09090b] transition-colors">
              Đăng nhập
            </Link>
            <button 
              onClick={() => toast.info("Tính năng đặt lịch Demo đã sẵn sàng kết nối!")}
              className="btn-primary-pill px-5 sm:px-6 py-2.5 text-xs sm:text-sm"
            >
              Book demo
            </button>
          </div>
        </div>
      </nav>

      {/* 🚀 Main Core Frame Container */}
      <main className="max-w-[1200px] mx-auto px-4 mt-20 sm:mt-28 space-y-20 sm:space-y-28 pb-20">
        
        {/* 1. Hero 2-Column Split Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#d4d4d8] rounded-xl shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#ff5a00]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Cloud Multi-Tenant OS</span>
            </div>
            <h1 className="text-56 sm:text-64 font-bold leading-[1.0] tracking-tight text-[#09090b]">
              Bứt phá <br />
              <span className="inline-block relative text-[#a1a1aa] font-medium h-[1.1em] overflow-hidden min-w-[280px]">
                <span className="absolute left-0 transition-transform duration-500 ease-out">
                  {ACCENT_WORDS[cyclingIndex]}
                </span>
              </span> <br />
              tận gốc với ZPOS.
            </h1>
          </div>
          
          <div className="lg:col-span-5 lg:pt-6 space-y-6">
            <p className="text-lg sm:text-20 font-medium text-[#18181b] leading-relaxed">
              Phần mềm tối ưu cho vận hành doanh nghiệp bán lẻ. POS siêu tốc 0.5 giây, quản lý hàng hóa tập trung và đồng bộ tự động trên đám mây hiện đại.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email"
                required
                placeholder="Điền địa chỉ email của bạn..." 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 h-14 rounded-[14px] border border-[#d4d4d8]/60 bg-white px-5 text-sm font-medium focus:outline-none focus:border-[#3f3f46] shadow-sm text-[#18181b]"
              />
              <button type="submit" className="btn-primary-pill h-14 px-8 text-sm font-bold flex items-center justify-center gap-2 group">
                <span>Book demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
            <div className="flex items-center gap-6 text-[#71717a] font-medium text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#09090b]" />
                Không cần thẻ tín dụng
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#09090b]" />
                14 ngày dùng thử miễn phí
              </div>
            </div>
          </div>
        </section>

        {/* 2. Horizontal client logos ticker */}
        <section className="overflow-hidden py-4 border-y border-[#d4d4d8]/40 relative">
          <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-[#f4f4f5] to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-[#f4f4f5] to-transparent z-10 pointer-events-none" />
          <div className="logo-ticker-track gap-12 sm:gap-20 items-center">
            {CLIENTS.map((client, index) => (
              <div key={`client-1-${index}`} className="text-[#71717a] font-bold text-xs sm:text-sm uppercase tracking-[0.25em] flex items-center gap-3">
                <Zap className="w-3.5 h-3.5 text-[#a1a1aa]" />
                <span>{client}</span>
              </div>
            ))}
            {CLIENTS.map((client, index) => (
              <div key={`client-2-${index}`} className="text-[#71717a] font-bold text-xs sm:text-sm uppercase tracking-[0.25em] flex items-center gap-3">
                <Zap className="w-3.5 h-3.5 text-[#a1a1aa]" />
                <span>{client}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. White & Muted alternating cards layouts */}
        <section id="features" className="space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <h2 className="text-32 sm:text-40 font-bold tracking-tight text-[#09090b]">
              Trực quan hóa vận hành.<br />
              Thiết lập tối giản, <span className="text-[#a1a1aa] font-medium">hiệu quả tối đa</span>.
            </h2>
            <button 
              onClick={() => toast.info("Toàn bộ giải pháp ZPOS đang chạy thời gian thực!")}
              className="btn-outlined-white h-12 px-6 font-bold self-start sm:self-auto"
            >
              Xem tài liệu đầy đủ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature Card 1 (Light Surface Bubble Card 36px) */}
            <div className="card-light p-8 h-[500px] flex flex-col justify-between overflow-hidden relative group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-[16px] bg-[#f4f4f5] flex items-center justify-center border border-[#d4d4d8]/40 text-[#09090b]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-28 sm:text-32 font-bold tracking-tight text-[#09090b]">POS Bán Hàng 0.5s</h3>
                <p className="text-[#71717a] font-medium text-xs sm:text-sm leading-relaxed">
                  Trải nghiệm thanh toán nhanh như chớp. Hỗ trợ offline, tự động đồng bộ khi có kết nối internet trở lại.
                </p>
              </div>

              {/* Simulated cashier window */}
              <div className="bg-[#f4f4f5] border border-[#d4d4d8]/40 h-52 rounded-[24px] p-5 flex flex-col justify-between translate-y-4 group-hover:translate-y-2 transition-transform duration-300">
                <div className="flex items-center justify-between border-b border-[#d4d4d8]/40 pb-2.5">
                  <span className="text-[11px] font-bold text-slate-600">GIỎ HÀNG</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">HOẠT ĐỘNG</span>
                </div>
                <div className="space-y-1.5 py-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Áo sơ mi Oxford</span>
                    <span className="text-slate-800">320k</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Tất Cotton (2x)</span>
                    <span className="text-slate-800">160k</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white border border-[#d4d4d8]/40 rounded-xl p-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">CẦN THU</span>
                  <span className="text-sm font-black text-[#09090b]">480,000 đ</span>
                </div>
              </div>
            </div>

            {/* Feature Card 2 (Muted Surface Card 28px) */}
            <div className="card-muted p-8 h-[500px] flex flex-col justify-between overflow-hidden relative group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-[16px] bg-white border border-[#d4d4d8]/40 flex items-center justify-center text-[#09090b]">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-28 sm:text-32 font-bold tracking-tight text-[#09090b]">AI Tự Động Báo Cáo</h3>
                <p className="text-[#71717a] font-medium text-xs sm:text-sm leading-relaxed">
                  Thiết lập báo cáo tự động đẩy thẳng về kênh Telegram riêng biệt vào cuối ngày, tuần, tháng rảnh tay.
                </p>
              </div>

              {/* Simulated reporting bot widget */}
              <div className="bg-white border border-[#d4d4d8]/40 h-52 rounded-[24px] p-5 flex flex-col justify-between translate-y-4 group-hover:translate-y-2 transition-transform duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-sky-100 text-sky-600 rounded-md">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">ZPOS TELEGRAM BOT</span>
                </div>
                <div className="bg-[#f4f4f5] border border-[#d4d4d8]/40 rounded-xl p-3 text-[10px] font-semibold text-slate-600 leading-normal">
                  📊 <b>Doanh thu:</b> 12,450kđ<br />
                  🛒 <b>Đơn hàng:</b> 48 đơn<br />
                  🏦 <b>VietQR:</b> 80% | 💵 <b>Cash:</b> 20%
                </div>
                <span className="text-[9px] text-[#71717a] text-center font-bold uppercase">Tự động đồng bộ lúc 23:59</span>
              </div>
            </div>

            {/* Feature Card 3 (Vivid Orchid Flash Wash Card 36px) */}
            <div className="bg-[#fe45e2] rounded-[36px] p-8 h-[500px] flex flex-col justify-between overflow-hidden relative text-white group">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-[16px] bg-white/20 border border-white/10 flex items-center justify-center text-white">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-28 sm:text-32 font-bold tracking-tight text-white leading-none">Đồng Bộ CRM Đa Điểm</h3>
                <p className="text-white/80 font-medium text-xs sm:text-sm leading-relaxed">
                  Đồng bộ tệp thành viên, tích lũy điểm thưởng và ưu đãi cá nhân hóa ngay tại POS của tất cả cửa hàng.
                </p>
              </div>

              {/* Simulated CRM members */}
              <div className="space-y-2.5 relative z-10 translate-y-4 group-hover:translate-y-2 transition-transform duration-300">
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white text-pink-600 font-bold flex items-center justify-center text-xs">BK</div>
                  <div className="flex-1">
                    <h6 className="text-xs font-bold text-white leading-none">Bá Khởi</h6>
                    <span className="text-[9px] text-pink-200">Khách Platinum</span>
                  </div>
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded text-white font-extrabold">12.4M</span>
                </div>
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-white text-pink-600 font-bold flex items-center justify-center text-xs">NZ</div>
                  <div className="flex-1">
                    <h6 className="text-xs font-bold text-white leading-none">Nguyen Zak</h6>
                    <span className="text-[9px] text-pink-200">Khách Gold</span>
                  </div>
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded text-white font-extrabold">8.2M</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Dark Problem Panel (Adhering strictly to markdown color and typography guidelines) */}
        <section id="problem" className="bg-[#09090b] rounded-[36px] p-8 sm:p-16 text-center space-y-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-[#a1a1aa] text-xs sm:text-sm font-bold uppercase tracking-[0.25em]">We solve the bottlenecks</h2>
            <p className="text-28 sm:text-40 lg:text-48 font-bold text-white leading-tight max-w-4xl mx-auto">
              Bán lẻ đòi hỏi tốc độ. <span className="text-[#a1a1aa] font-light">Đừng để hệ thống cũ cản bước</span> doanh nghiệp của bạn.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6 text-left relative z-10">
            {/* Inline weight contrast - weight 300 for lead-in, weight 700 for key words */}
            <div className="flex items-center gap-4 bg-[#18181b]/50 border border-zinc-800 p-5 rounded-[20px] transition-colors hover:bg-[#18181b]">
              <div className="w-6 h-6 rounded-full border-2 border-[#3f3f46] flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a00]" />
              </div>
              <p className="text-base sm:text-lg text-white">
                <span className="text-[#a1a1aa] font-light">Forget about </span> 
                <span className="font-bold">màn hình chờ tải xoay vòng</span> mỗi khi thanh toán đơn hàng.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#18181b]/50 border border-zinc-800 p-5 rounded-[20px] transition-colors hover:bg-[#18181b]">
              <div className="w-6 h-6 rounded-full border-2 border-[#3f3f46] flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fe45e2]" />
              </div>
              <p className="text-base sm:text-lg text-white">
                <span className="text-[#a1a1aa] font-light">Eliminate </span> 
                <span className="font-bold">sai lệch số liệu kho hàng</span> và doanh số giữa các chi nhánh vật lý.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#18181b]/50 border border-zinc-800 p-5 rounded-[20px] transition-colors hover:bg-[#18181b]">
              <div className="w-6 h-6 rounded-full border-2 border-[#3f3f46] flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a00]" />
              </div>
              <p className="text-base sm:text-lg text-white">
                <span className="text-[#a1a1aa] font-light">Stop losing </span> 
                <span className="font-bold">khách hàng tiềm năng</span> vì không có hệ thống tích điểm tập trung.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Horizontal Snapping Portfolio scroll row (36px border-radius clipping tall rounded tiles) */}
        <section id="portfolio" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-32 sm:text-40 font-bold tracking-tight text-[#09090b]">Khám phá Portfolio Giao diện</h2>
              <p className="text-[#71717a] font-medium text-sm sm:text-base mt-2">Hệ thống ZPOS hoạt động dựa trên triết lý tối giản, trơn tru bậc nhất.</p>
            </div>
            <span className="text-xs font-bold text-[#a1a1aa] self-start sm:self-auto uppercase tracking-widest">Cuộn ngang để xem ➔</span>
          </div>

          <div className="portfolio-scroll-container flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 snap-x scroll-smooth">
            {PORTFOLIO_CARDS.map((card) => (
              <div 
                key={card.id} 
                className="w-[280px] sm:w-[340px] shrink-0 h-[480px] rounded-[36px] overflow-hidden flex flex-col justify-between snap-start border border-[#d4d4d8]/40 shadow-sm bg-white"
              >
                {/* Simulated dynamic visuals */}
                <div className={`flex-1 ${card.bgClass} relative overflow-hidden`}>
                  {card.previewElement}
                </div>

                {/* Overlaid Title Area */}
                <div className="p-6 border-t border-[#d4d4d8]/30">
                  <h4 className="text-base font-bold text-[#09090b] truncate">{card.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    {card.badgeType === "ember" ? (
                      <span className="badge-ember flex items-center gap-1 shadow-sm">
                        <span>Y COMBINATOR</span>
                        <span className="text-[10px] font-black bg-white/20 px-1 rounded">S26</span>
                      </span>
                    ) : (
                      <span className="badge-filled">{card.category}</span>
                    )}
                    <span className="badge-overlay bg-slate-100 text-slate-700 border-slate-300 text-[10px] py-0.5 font-bold uppercase">
                      STABLE
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Muted Stat blocks (Sitting directly on canvas with no border - RAW typographic emphasis) */}
        <section id="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center py-12 border-y border-[#d4d4d8]/40">
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-bold tracking-tight text-[#09090b] leading-none">20,000+</div>
            <div className="text-[#71717a] font-medium text-xs uppercase tracking-widest pt-2">Cửa hàng vận hành</div>
          </div>
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-bold tracking-tight text-[#09090b] leading-none">99.99%</div>
            <div className="text-[#71717a] font-medium text-xs uppercase tracking-widest pt-2">Cam kết Uptime Cloud</div>
          </div>
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-bold tracking-tight text-[#09090b] leading-none">70%</div>
            <div className="text-[#71717a] font-medium text-xs uppercase tracking-widest pt-2">Giảm thiểu thời gian bán</div>
          </div>
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-bold tracking-tight text-[#09090b] leading-none">24/7/365</div>
            <div className="text-[#71717a] font-medium text-xs uppercase tracking-widest pt-2">Hỗ trợ kỹ thuật viên</div>
          </div>
        </section>

        {/* 7. Conversion Section */}
        <section className="bg-white rounded-[36px] p-8 sm:p-16 flex flex-col items-center text-center space-y-8 shadow-sm border border-[#d4d4d8]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <h2 className="text-36 sm:text-48 lg:text-56 font-bold tracking-tight text-[#09090b] max-w-2xl leading-none">
            Sẵn sàng để <span className="text-[#a1a1aa] font-light italic">đột phá</span> doanh số?
          </h2>
          
          <p className="text-base sm:text-lg text-[#18181b] max-w-xl font-medium leading-relaxed">
            Đăng ký sử dụng hệ điều hành bán lẻ đa doanh nghiệp thế hệ mới ZPOS ngay hôm nay. Hoàn toàn miễn phí thiết lập.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/login" className="btn-primary-pill h-14 px-10 text-base font-bold flex items-center justify-center gap-2 shadow-lg">
              <span>Bắt đầu dùng thử miễn phí</span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </Link>
            <button 
              onClick={() => toast.success("Số điện thoại hỗ trợ kỹ thuật: 038.892.5432 (Zalo 24/7).")}
              className="btn-outlined-white h-14 px-10 text-base font-bold flex items-center justify-center"
            >
              Liên hệ tư vấn viên
            </button>
          </div>
        </section>

        {/* 8. Elegant Footer */}
        <footer className="pt-12 border-t border-[#d4d4d8] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#09090b] rounded-lg flex items-center justify-center text-white font-black text-xs">
              Z
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[#09090b]">ZPOS SYSTEM © 2026</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs sm:text-sm font-semibold text-[#71717a]">
            <Link href="#" onClick={() => toast.info("Bảo mật dữ liệu chuẩn mã hóa AES-256 cao cấp.")} className="hover:text-[#09090b] transition-colors">Bảo mật</Link>
            <Link href="#" onClick={() => toast.info("Điều khoản sử dụng SaaS ZPOS.")} className="hover:text-[#09090b] transition-colors">Điều khoản</Link>
            <Link href="#" onClick={() => toast.info("Cloud AWS và Cloudflare đảm bảo 100% sao lưu.")} className="hover:text-[#09090b] transition-colors">Hạ tầng</Link>
            <Link href="#" onClick={() => toast.info("Hệ thống ZPOS Cloud hoạt động ổn định.")} className="hover:text-[#09090b] transition-colors">Trạng thái</Link>
          </div>

          <div className="flex items-center gap-3">
            {/* YC batch badge representation */}
            <span className="badge-ember text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
              <span>Y COMBINATOR S26</span>
            </span>
            <span className="text-xs text-rose-500 font-bold flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-rose-500 animate-bounce" />
              <span>Việt Nam</span>
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
}
