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
  Globe,
  ShieldCheck,
  MousePointer2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Box,
  MessageSquare,
  DollarSign,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';

const CYCLING_WORDS = ["đế chế bán lẻ", "chuỗi cửa hàng", "hệ thống vận hành", "doanh nghiệp lớn"];

const PARTNER_LOGOS = [
  "BiboMart", "Juno Shoes", "KidsPlaza", "WinMart+", "An Phước", "Con Cưng", "Genshin Retail", "ViZ Solutions"
];

const PORTFOLIO_TILES = [
  {
    id: 1,
    title: "Giao diện Bán hàng POS Siêu tốc",
    category: "POS SYSTEM",
    badgeType: "overlay",
    bgClass: "bg-gradient-to-br from-indigo-950 via-slate-900 to-black",
    previewElement: (
      <div className="w-full h-full p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-slate-300">CỬA HÀNG QUẬN 1</span>
          </div>
          <span className="text-[11px] font-black text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">ONLINE</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Giỏ hàng (3 món)</span>
            <span>Tổng: 480k</span>
          </div>
          <div className="space-y-2">
            <div className="h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-3">
              <span className="text-xs text-white font-bold">1x Áo sơ mi Oxford</span>
              <span className="text-xs text-indigo-400 font-bold">320,000 ₫</span>
            </div>
            <div className="h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-3">
              <span className="text-xs text-white font-bold">2x Tất cotton cao cấp</span>
              <span className="text-xs text-indigo-400 font-bold">160,000 ₫</span>
            </div>
          </div>
        </div>
        <div className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(79,70,229,0.3)] transition-all">
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
    badgeType: "ember", // YC affiliation representation
    bgClass: "bg-gradient-to-br from-slate-900 via-zinc-900 to-black",
    previewElement: (
      <div className="w-full h-full p-6 flex flex-col justify-between">
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500 text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-white">ZPOS Telegram Bot</h5>
              <p className="text-[10px] text-sky-300 font-medium">Báo cáo cuối ngày (23:59)</p>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-sky-500/10 pt-2.5">
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
    category: "PORTFOLIO WASH",
    badgeType: "overlay",
    bgClass: "bg-gradient-to-br from-[#fe45e2] to-[#b12999]", // Decorative Orchid Flash wash
    previewElement: (
      <div className="w-full h-full p-8 flex flex-col justify-between text-white">
        <Sparkles className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '6s' }} />
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-pink-200">ORCHID FLASH ACCENT</p>
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
    bgClass: "bg-gradient-to-br from-emerald-950 via-teal-900 to-black",
    previewElement: (
      <div className="w-full h-full p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">AI RECOMMENDATION</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white leading-snug">
            "Sức mua nhóm hàng Áo thun sẽ tăng 35% vào tuần tới. Cần bổ sung 50 đơn vị tồn kho."
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
          <span className="text-slate-400">Độ tin cậy dự báo:</span>
          <span className="text-emerald-400 font-bold">94.8%</span>
        </div>
      </div>
    )
  }
];

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleDemoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email hợp lệ!");
      return;
    }
    toast.success(`Cảm ơn bạn! ZPOS sẽ liên hệ hẹn lịch demo qua email ${email} sớm nhất.`);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-mist selection:bg-orchid-flash selection:text-white font-cosmica text-ink overflow-x-hidden antialiased">
      
      {/* 📢 Announcement Banner */}
      <div className="w-full bg-[#111112]/95 backdrop-blur-md text-white py-3.5 px-4 sticky top-0 z-[100] border-b border-white/5">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-ember text-white px-2 py-0.5 rounded">NEW</span>
            <p className="text-xs sm:text-sm font-medium text-slate-200">
              ZPOS vừa huy động thành công vòng hạt giống từ **Y Combinator** để định hình tương lai bán lẻ!
            </p>
          </div>
          <Link 
            href="/login" 
            className="text-xs font-bold text-orchid-flash hover:text-white transition-colors flex items-center gap-1 group"
          >
            <span>Dùng thử Bản Beta Miễn Phí</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 🧭 Premium Sticky Navigation */}
      <nav className="w-full max-w-[1200px] mx-auto px-4 mt-6">
        <div className="bg-white/80 backdrop-blur-xl border border-pebble h-16 rounded-full flex items-center justify-between px-6 sm:px-8 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 bg-obsidian rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              Z
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-obsidian uppercase">ZPOS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-graphite">
            <Link href="#features" className="hover:text-obsidian transition-colors">Tính năng</Link>
            <Link href="#problem" className="hover:text-obsidian transition-colors">Giải quyết</Link>
            <Link href="#portfolio" className="hover:text-obsidian transition-colors">Trải nghiệm</Link>
            <Link href="#stats" className="hover:text-obsidian transition-colors">Số liệu</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-graphite hover:text-obsidian transition-colors">
              Đăng nhập
            </Link>
            <button 
              onClick={() => toast.info("Tính năng Đặt lịch Demo đang được chuẩn bị!")}
              className="btn-primary-pill px-5 sm:px-6 py-2.5 text-xs sm:text-sm"
            >
              Đặt lịch demo
            </button>
          </div>
        </div>
      </nav>

      {/* 🚀 Main Core Canvas */}
      <main className="max-w-[1200px] mx-auto px-4 mt-20 sm:mt-32 space-y-28 sm:space-y-36 pb-24">
        
        {/* 1. Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-pebble rounded-xl shadow-sm">
              <span className="w-2 h-2 rounded-full bg-ember animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-steel">Hệ điều hành bán lẻ Cloud-First</span>
            </div>
            <h1 className="text-48 sm:text-56 lg:text-64 font-black leading-[1.05] tracking-tight text-obsidian">
              Kiến tạo <br />
              <span className="inline-block relative text-ash font-medium h-[1.1em] overflow-hidden min-w-[280px]">
                <span className="absolute left-0 transition-transform duration-500 ease-out">
                  {CYCLING_WORDS[wordIndex]}
                </span>
              </span> <br />
              vượt trội với ZPOS.
            </h1>
          </div>
          
          <div className="lg:col-span-5 lg:pt-6 space-y-6">
            <p className="text-lg sm:text-20 font-medium text-ink leading-relaxed">
              Hệ điều hành bán lẻ đa doanh nghiệp thế hệ mới. Đơn giản hóa thanh toán POS siêu tốc, quản lý tồn kho đa điểm và kết nối CRM tự động trong một giao diện tối giản, đẳng cấp.
            </p>
            <form onSubmit={handleDemoRequest} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email"
                required
                placeholder="Nhập email của doanh nghiệp..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-14 rounded-[14px] border border-pebble/60 bg-white px-5 text-sm font-medium focus:outline-none focus:border-graphite shadow-sm"
              />
              <button type="submit" className="btn-primary-pill h-14 px-8 text-sm font-bold flex items-center justify-center gap-2 group">
                <span>Trải nghiệm ngay</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
            <div className="flex items-center gap-6 text-steel font-medium text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-obsidian" />
                Không cần thẻ tín dụng
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-obsidian" />
                14 ngày dùng thử miễn phí
              </div>
            </div>
          </div>
        </section>

        {/* 2. Scrolling Partner Logo Ticker */}
        <section className="overflow-hidden py-4 border-y border-pebble/40 relative">
          <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-mist to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-mist to-transparent z-10 pointer-events-none" />
          <div className="logo-ticker-track gap-12 sm:gap-20 items-center">
            {/* First sequence */}
            {PARTNER_LOGOS.map((logo, index) => (
              <div key={`logo-1-${index}`} className="text-steel font-black text-sm uppercase tracking-[0.25em] flex items-center gap-3">
                <Zap className="w-3.5 h-3.5 text-ash" />
                <span>{logo}</span>
              </div>
            ))}
            {/* Duplicated sequence for infinite scroll */}
            {PARTNER_LOGOS.map((logo, index) => (
              <div key={`logo-2-${index}`} className="text-steel font-black text-sm uppercase tracking-[0.25em] flex items-center gap-3">
                <Zap className="w-3.5 h-3.5 text-ash" />
                <span>{logo}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Alternating Feature Cards Section */}
        <section id="features" className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-32 sm:text-40 font-black tracking-tight max-w-lg leading-tight">
              Một hệ điều hành. <br />
              Mở khóa <span className="text-ash font-medium">mọi điểm chạm</span> vận hành bán lẻ.
            </h2>
            <button 
              onClick={() => toast.info("Toàn bộ tính năng cao cấp đã được tích hợp mặc định!")}
              className="btn-outlined-white h-12 px-6 font-bold self-start md:self-auto"
            >
              Xem tất cả tài liệu tính năng
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: POS (Light card) */}
            <div className="card-light p-8 h-[520px] flex flex-col justify-between overflow-hidden relative group">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-[16px] bg-mist flex items-center justify-center text-obsidian border border-pebble/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-28 sm:text-32 font-extrabold tracking-tight text-obsidian">POS Siêu Tốc 0.5s</h3>
                <p className="text-steel font-medium text-sm leading-relaxed">
                  Thiết kế tối ưu cho tốc độ thanh toán. Xử lý hàng nghìn giao dịch cùng lúc không giật lag. Hoạt động offline hoàn hảo khi mất mạng.
                </p>
              </div>
              
              {/* Interactive simulated checkout panel */}
              <div className="bg-mist border border-pebble/30 h-56 rounded-[24px] p-5 flex flex-col justify-between translate-y-4 group-hover:translate-y-2 transition-transform duration-350">
                <div className="flex items-center justify-between border-b border-pebble/40 pb-3">
                  <span className="text-xs font-bold text-slate-700">Khách Hàng Thân Thiết</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">VIP KHÁCH</span>
                </div>
                <div className="space-y-2 py-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Áo Polo Classic</span>
                    <span className="font-bold text-obsidian">350,000đ</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Khuyến mãi chiết khấu</span>
                    <span className="font-bold text-rose-500">-35,000đ</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white border border-pebble/40 rounded-xl p-2.5">
                  <span className="text-[11px] font-black uppercase text-slate-500">Cần Thu</span>
                  <span className="text-sm font-black text-obsidian">315,000đ</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Analytics / Reporting (Dark Obsidian card) */}
            <div className="bg-obsidian rounded-[36px] p-8 h-[520px] flex flex-col justify-between overflow-hidden relative text-white group">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-[16px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-28 sm:text-32 font-extrabold tracking-tight">AI & Tự động báo cáo</h3>
                <p className="text-ash font-medium text-sm leading-relaxed">
                  Quản lý hiệu suất kinh doanh qua dữ liệu trực quan. Tự động tổng hợp báo cáo gửi về Telegram mỗi ngày, tuần, tháng hoàn toàn rảnh tay.
                </p>
              </div>

              {/* Simulated Analytics Graph */}
              <div className="flex-1 flex items-end justify-between gap-2.5 pt-8 px-4 h-48">
                {[45, 75, 55, 95, 65, 85, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                    <div 
                      className="w-full bg-zinc-800 hover:bg-[#fe45e2] rounded-t-lg transition-all duration-300 relative group-hover/bar:scale-x-105" 
                      style={{ height: `${h * 0.9}px` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#fe45e2] text-white text-[9px] font-black px-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        {h}%
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">T{i+2}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 3: CRM (Vivid Orchid Flash decorative card) */}
            <div className="bg-gradient-to-br from-[#fe45e2] to-[#b12999] rounded-[36px] p-8 h-[520px] flex flex-col justify-between overflow-hidden relative text-white group">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-28 sm:text-32 font-extrabold tracking-tight">CRM Đồng Bộ Đa Điểm</h3>
                <p className="text-white/85 font-medium text-sm leading-relaxed">
                  Lưu trữ dữ liệu khách hàng tập trung. Đồng bộ tức thì điểm thưởng, thứ hạng thành viên và ưu đãi cá nhân hóa trên toàn chuỗi.
                </p>
              </div>

              {/* Simulated CRM Member Badges */}
              <div className="space-y-3 relative z-10 pb-4">
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white text-pink-600 font-black flex items-center justify-center text-xs">
                    BK
                  </div>
                  <div className="flex-1">
                    <h6 className="text-xs font-bold text-white">Bá Khởi - VIP Platinum</h6>
                    <p className="text-[10px] text-pink-200">Chi tiêu tích lũy: 12.4 Tr ₫</p>
                  </div>
                  <span className="text-[9px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded">HOẠT ĐỘNG</span>
                </div>
                <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-white text-pink-600 font-black flex items-center justify-center text-xs">
                    NZ
                  </div>
                  <div className="flex-1">
                    <h6 className="text-xs font-bold text-white">Nguyen Zak - VIP Gold</h6>
                    <p className="text-[10px] text-pink-200">Chi tiêu tích lũy: 8.2 Tr ₫</p>
                  </div>
                  <span className="text-[9px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded">ĐÃ LƯU</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Dark Problem Panel with Inline Weight Contrast */}
        <section id="problem" className="bg-obsidian rounded-[36px] p-8 sm:p-16 text-center space-y-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-ash text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em]">Giải mã khó khăn</h2>
            <p className="text-28 sm:text-40 lg:text-48 font-black text-white leading-tight max-w-4xl mx-auto">
              Kinh doanh cần tốc độ. <span className="text-ash font-light">Phần mềm cũ làm bạn chậm chân?</span> ZPOS chính là câu trả lời <span className="text-white underline decoration-[#fe45e2] decoration-4 underline-offset-8">nhanh hơn</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative z-10 pt-6 text-left">
            <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-[24px]">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-ash font-bold text-xs">01</div>
              <h4 className="text-white text-lg sm:text-20 font-black">
                <span className="text-ash font-light">Quên đi </span>
                sự chậm trễ
              </h4>
              <p className="text-ash text-xs sm:text-sm leading-relaxed">
                Không còn phải ngồi đợi màn hình tải xoay vòng. Giao diện POS của ZPOS được tối ưu hóa toàn diện để xử lý tức thì dưới 0.5 giây.
              </p>
            </div>
            
            <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-[24px]">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-ash font-bold text-xs">02</div>
              <h4 className="text-white text-lg sm:text-20 font-black">
                <span className="text-ash font-light">Đập tan </span>
                rào cản dữ liệu
              </h4>
              <p className="text-ash text-xs sm:text-sm leading-relaxed">
                Tồn kho, doanh thu và dữ liệu khách hàng được đồng bộ hóa tức thì (real-time) trên Cloud giữa tất cả các điểm bán hàng vật lý.
              </p>
            </div>

            <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-[24px]">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-ash font-bold text-xs">03</div>
              <h4 className="text-white text-lg sm:text-20 font-black">
                <span className="text-ash font-light">Loại bỏ </span>
                sự phức tạp
              </h4>
              <p className="text-ash text-xs sm:text-sm leading-relaxed">
                Chuẩn hóa mọi khâu vận hành với quy trình cực kỳ trực quan, tối giản hóa tối đa giúp nhân viên bán hàng tiếp cận trong 5 phút.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Horizontal Scrolling Portfolio / UI Showcase */}
        <section id="portfolio" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-32 sm:text-40 font-black tracking-tight text-obsidian">Trải nghiệm sản phẩm thực tế</h2>
              <p className="text-steel font-medium text-sm sm:text-base mt-2">Vuốt ngang để xem chi tiết các phân hệ thiết kế chất lượng cao của ZPOS.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-ash">Cuộn ngang để khám phá ➔</span>
            </div>
          </div>

          {/* Horizontal Scroll Track */}
          <div className="portfolio-scroll-container flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 snap-x">
            {PORTFOLIO_TILES.map((tile) => (
              <div 
                key={tile.id} 
                className="w-[300px] sm:w-[360px] shrink-0 h-[480px] rounded-[36px] overflow-hidden flex flex-col justify-between relative shadow-md snap-start border border-pebble/40"
              >
                {/* Visual Preview Layer */}
                <div className={`flex-1 ${tile.bgClass} relative overflow-hidden`}>
                  {tile.previewElement}
                </div>

                {/* Overlaid Bottom Title & Badges */}
                <div className="bg-white p-6 space-y-3.5 border-t border-pebble/30">
                  <h4 className="text-base sm:text-lg font-black text-obsidian truncate">{tile.title}</h4>
                  <div className="flex items-center gap-2">
                    {tile.badgeType === "ember" ? (
                      <span className="badge-ember flex items-center gap-1">
                        <span>Y COMBINATOR</span>
                        <span className="text-[10px] font-black bg-white/20 px-1 rounded">S26</span>
                      </span>
                    ) : (
                      <span className="badge-filled">{tile.category}</span>
                    )}
                    <span className="badge-overlay bg-slate-100 text-slate-700 border-slate-300 text-[10px] py-0.5 font-bold uppercase">
                      CLOUD LIVE
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Muted Stat blocks (Sitting directly on canvas with no border - RAW typographic emphasis) */}
        <section id="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center py-12 border-t border-b border-pebble/30">
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-black tracking-tight text-obsidian leading-none">20,000+</div>
            <div className="text-steel font-bold text-[10px] sm:text-xs uppercase tracking-widest pt-2">Cửa hàng tin dùng</div>
          </div>
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-black tracking-tight text-obsidian leading-none">99.99%</div>
            <div className="text-steel font-bold text-[10px] sm:text-xs uppercase tracking-widest pt-2">Cam kết Uptime Cloud</div>
          </div>
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-black tracking-tight text-obsidian leading-none">15 Giây</div>
            <div className="text-steel font-bold text-[10px] sm:text-xs uppercase tracking-widest pt-2">Thiết lập chi nhánh</div>
          </div>
          <div className="space-y-1">
            <div className="text-48 sm:text-56 font-black tracking-tight text-obsidian leading-none">24/7/365</div>
            <div className="text-steel font-bold text-[10px] sm:text-xs uppercase tracking-widest pt-2">Hỗ trợ kỹ thuật vip</div>
          </div>
        </section>

        {/* 7. Premium conversion Footer Card */}
        <section className="bg-white rounded-[36px] p-8 sm:p-16 flex flex-col items-center text-center space-y-8 shadow-sm border border-pebble/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <h2 className="text-36 sm:text-48 lg:text-56 font-black tracking-tight text-obsidian max-w-2xl leading-none">
            Sẵn sàng nâng tầm <br />
            <span className="text-ash font-light italic">đế chế kinh doanh</span>?
          </h2>
          
          <p className="text-base sm:text-lg text-ink max-w-xl font-medium leading-relaxed">
            Tham gia cùng hàng nghìn nhà bán lẻ thông thái đã chuyển đổi số thành công và tự động hóa vận hành xuất sắc cùng ZPOS.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/login" className="btn-primary-pill h-14 px-10 text-base font-bold flex items-center justify-center gap-2">
              <span>Bắt đầu dùng thử miễn phí</span>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </Link>
            <button 
              onClick={() => toast.success("Số hotline kỹ thuật: 038.892.5432 (Zalo hỗ trợ 24/7).")}
              className="btn-outlined-white h-14 px-10 text-base font-bold flex items-center justify-center"
            >
              Liên hệ tư vấn viên
            </button>
          </div>
        </section>

        {/* 8. Elegant Footer */}
        <footer className="pt-12 border-t border-pebble flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-obsidian rounded-lg flex items-center justify-center text-white font-black text-xs">
              Z
            </div>
            <span className="font-extrabold text-sm tracking-tight text-obsidian">ZPOS SYSTEM © 2026</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs sm:text-sm font-semibold text-steel">
            <Link href="#" onClick={() => toast.info("Chính sách bảo mật dữ liệu chuẩn mã hóa AES-256.")} className="hover:text-obsidian transition-colors">Bảo mật</Link>
            <Link href="#" onClick={() => toast.info("Điều khoản sử dụng phần mềm SaaS ZPOS.")} className="hover:text-obsidian transition-colors">Điều khoản</Link>
            <Link href="#" onClick={() => toast.info("Hệ thống Cloud lưu trữ bảo mật trên AWS & Cloudflare.")} className="hover:text-obsidian transition-colors">Hạ tầng Cloud</Link>
            <Link href="#" onClick={() => toast.info("Hệ thống hoạt động bình thường 100% Uptime.")} className="hover:text-obsidian transition-colors">Trạng thái hệ thống</Link>
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
