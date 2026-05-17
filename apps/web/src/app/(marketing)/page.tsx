"use client";

import React from 'react';
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
  MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-mist selection:bg-orchid-flash selection:text-white font-sans text-ink">
      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1200px] px-4">
        <div className="bg-snow/80 backdrop-blur-xl border border-pebble h-16 rounded-pill flex items-center justify-between px-8 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-obsidian rounded-xl flex items-center justify-center text-white font-black text-xl">
              Z
            </div>
            <span className="font-bold text-xl tracking-tight text-obsidian uppercase">ZPOS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-obsidian transition-colors">Tính năng</Link>
            <Link href="#solutions" className="text-sm font-medium hover:text-obsidian transition-colors">Giải pháp</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-obsidian transition-colors">Bảng giá</Link>
            <Link href="#about" className="text-sm font-medium hover:text-obsidian transition-colors">Về chúng tôi</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-graphite hover:text-obsidian">Đăng nhập</Link>
            <Button className="bg-obsidian hover:bg-ink text-white rounded-pill px-6 h-10 font-bold shadow-subtle border-none">
              Đặt lịch demo
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-4 pt-40 space-y-32">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-snow border border-pebble rounded-xl shadow-sm">
              <span className="w-2 h-2 rounded-full bg-ember animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-steel">Hệ điều hành bán lẻ Cloud-First</span>
            </div>
            <h1 className="text-64 lg:text-[72px] font-bold leading-[1.05] tracking-tight text-obsidian">
              Nâng tầm <br />
              <span className="text-ash font-medium">đế chế bán lẻ</span> <br />
              của bạn với ZPOS.
            </h1>
          </div>
          <div className="lg:col-span-5 pt-4 space-y-6">
            <p className="text-20 font-medium text-ink leading-relaxed">
              Hệ điều hành hiện đại cho doanh nghiệp bán lẻ. POS, kho hàng và CRM tất cả trong một nền tảng tinh tế, tốc độ cao.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input 
                  placeholder="Nhập email của bạn" 
                  className="h-14 rounded-2xl border-none bg-snow px-6 text-base focus-visible:ring-1 focus-visible:ring-pebble shadow-sm"
                />
              </div>
              <Button className="h-14 bg-obsidian hover:bg-ink text-white rounded-pill px-8 text-base font-bold shadow-subtle border-none group">
                Bắt đầu ngay
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-ash font-medium text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-obsidian" />
                Không cần thẻ tín dụng
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-obsidian" />
                14 ngày dùng thử
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio / Feature Cards */}
        <section className="space-y-12">
          <div className="flex items-end justify-between">
            <h2 className="text-40 font-bold tracking-tight max-w-md leading-tight">
              Một nền tảng. <br />
              Đáp ứng <span className="text-ash font-medium">mọi nhu cầu</span> bán lẻ.
            </h2>
            <Button variant="outline" className="rounded-pill border-graphite text-graphite h-12 px-6 font-bold hover:bg-snow">
              Xem tất cả tính năng
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: POS */}
            <div className="group bg-snow rounded-3xl-3 p-8 h-[500px] flex flex-col justify-between overflow-hidden relative shadow-md">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-32 font-bold tracking-tight">POS Siêu tốc</h3>
                <p className="text-steel font-medium leading-relaxed">
                  Tối ưu cho tốc độ. Xử lý khối lượng giao dịch lớn dễ dàng. Tích hợp chế độ ngoại tuyến.
                </p>
              </div>
              <div className="bg-mist h-64 rounded-3xl translate-y-8 group-hover:translate-y-4 transition-transform p-4 flex gap-4">
                <div className="flex-1 bg-snow rounded-2xl shadow-sm border border-pebble/50 p-4 space-y-3">
                  <div className="h-2 w-20 bg-mist rounded-full" />
                  <div className="h-2 w-full bg-mist rounded-full" />
                  <div className="h-2 w-2/3 bg-mist rounded-full" />
                </div>
                <div className="w-24 bg-obsidian rounded-2xl" />
              </div>
            </div>

            {/* Feature 2: Analytics */}
            <div className="group bg-obsidian rounded-3xl-3 p-8 h-[500px] flex flex-col justify-between overflow-hidden relative text-white shadow-xl">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center border border-white/10">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-32 font-bold tracking-tight">Phân tích AI</h3>
                <p className="text-ash font-medium leading-relaxed">
                  Dự báo nhu cầu và tối ưu tồn kho với thông tin chi tiết từ học máy.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 pt-8">
                {[40, 70, 50, 90, 60, 80].map((h, i) => (
                  <div 
                    key={i} 
                    className="w-8 bg-white/20 rounded-full transition-all group-hover:bg-white/40" 
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Feature 3: CRM */}
            <div className="group bg-orchid-flash rounded-3xl-3 p-8 h-[500px] flex flex-col justify-between overflow-hidden relative text-white shadow-xl">
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-32 font-bold tracking-tight">CRM Hợp nhất</h3>
                <p className="text-white/80 font-medium leading-relaxed">
                  Trải nghiệm cá nhân hóa cho mọi khách hàng trên tất cả các chi nhánh.
                </p>
              </div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex -space-x-4 pb-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-16 h-16 rounded-full border-4 border-orchid-flash bg-snow overflow-hidden shadow-lg">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section (Dark Panel) */}
        <section className="bg-obsidian rounded-[24px] p-16 text-center space-y-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-ash text-xl font-medium uppercase tracking-[0.2em]">Chấm dứt sự trì trệ</h2>
            <p className="text-40 lg:text-56 font-bold text-white leading-tight max-w-4xl mx-auto">
              Bán lẻ cần tốc độ. <span className="text-ash font-light">Phần mềm của bạn nên</span> <span className="text-white font-black underline decoration-orchid-flash underline-offset-8">nhanh hơn</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10 pt-8">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mx-auto text-ash">01</div>
              <h4 className="text-white text-20 font-bold">Quên đi sự chậm trễ</h4>
              <p className="text-ash text-sm leading-relaxed">Không còn phải chờ đợi màn hình tải. ZPOS được xây dựng cho hiệu suất dưới 1 giây.</p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mx-auto text-ash">02</div>
              <h4 className="text-white text-20 font-bold">Xóa bỏ rào cản dữ liệu</h4>
              <p className="text-ash text-sm leading-relaxed">Tồn kho, doanh số và khách hàng được đồng bộ thời gian thực trên tất cả địa điểm.</p>
            </div>
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mx-auto text-ash">03</div>
              <h4 className="text-white text-20 font-bold">Đơn giản hóa sự phức tạp</h4>
              <p className="text-ash text-sm leading-relaxed">Đơn giản hóa vận hành với quy trình trực quan mà nhân viên của bạn sẽ yêu thích.</p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center py-12">
          <div className="space-y-2">
            <div className="text-56 font-bold tracking-tighter text-obsidian">20k+</div>
            <div className="text-steel font-medium uppercase tracking-widest text-[10px]">Cửa hàng quản lý</div>
          </div>
          <div className="space-y-2">
            <div className="text-56 font-bold tracking-tighter text-obsidian">100T+</div>
            <div className="text-steel font-medium uppercase tracking-widest text-[10px]">Khối lượng giao dịch</div>
          </div>
          <div className="space-y-2">
            <div className="text-56 font-bold tracking-tighter text-obsidian">99.9%</div>
            <div className="text-steel font-medium uppercase tracking-widest text-[10px]">Cam kết Uptime</div>
          </div>
          <div className="space-y-2">
            <div className="text-56 font-bold tracking-tighter text-obsidian">24/7</div>
            <div className="text-steel font-medium uppercase tracking-widest text-[10px]">Hỗ trợ cao cấp</div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="bg-snow rounded-3xl-3 p-16 flex flex-col items-center text-center space-y-8 shadow-md border border-pebble/50">
          <h2 className="text-56 font-bold tracking-tight text-obsidian">
            Sẵn sàng để <span className="text-ash font-light italic">đột phá</span>?
          </h2>
          <p className="text-20 text-ink max-w-xl font-medium">
            Gia nhập cùng hàng ngàn nhà bán lẻ hiện đại đã đơn giản hóa kinh doanh với ZPOS.
          </p>
          <div className="flex gap-4">
            <Button className="h-16 bg-obsidian hover:bg-ink text-white rounded-pill px-10 text-lg font-bold shadow-subtle border-none">
              Bắt đầu dùng thử miễn phí
            </Button>
            <Button variant="outline" className="h-16 border-graphite text-graphite rounded-pill px-10 text-lg font-bold hover:bg-mist">
              Liên hệ bán hàng
            </Button>
          </div>
        </section>

        <footer className="py-12 border-t border-pebble flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-obsidian rounded-lg flex items-center justify-center text-white font-black text-xs">
              Z
            </div>
            <span className="font-bold tracking-tight text-obsidian">ZPOS © 2026</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-steel">
            <Link href="#" className="hover:text-obsidian">Bảo mật</Link>
            <Link href="#" className="hover:text-obsidian">Điều khoản</Link>
            <Link href="#" className="hover:text-obsidian">An ninh</Link>
            <Link href="#" className="hover:text-obsidian">Trạng thái</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-ember/10 rounded-pill text-[10px] font-bold text-ember border border-ember/20">
              Y COMBINATOR S26
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
