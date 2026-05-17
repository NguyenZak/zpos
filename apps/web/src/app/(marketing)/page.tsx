"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
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
  Plus,
  MonitorSmartphone,
  ShieldCheck,
  Cpu,
  Check,
  Code2,
  Terminal,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

const CLIENTS = [
  "BiboMart", "Juno", "KidsPlaza", "WinMart+", "An Phước", "Con Cưng", "Genshin Retail", "ViZ Solutions"
];

// ToDesktop's Exact Primary Button with intricate box-shadows and gradients
const ToDesktopButton = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0036ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_-.5px_rgba(255,255,255,0.12)_inset,0_.5px_.5px_rgba(255,255,255,0.16)_inset,0_8px_24px_-4px_rgba(255,255,255,0.16)_inset,0_8px_8px_-3px_rgba(9,1,20,0.03),0_5px_5px_-2.5px_rgba(9,1,20,0.03),0_3px_3px_-1.5px_rgba(8,1,20,0.03),0_2px_2px_-1px_rgba(8,1,20,0.03),0_1px_1px_-.5px_rgba(8,1,20,0.03),0_.5px_.5px_rgba(8,1,20,0.03)] transition-all duration-400 active:scale-[0.98] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white to-white/50 opacity-[0.12] transition-opacity duration-400 group-hover:opacity-[0.24]" />
      <span className="relative z-10 flex items-center gap-2 tracking-tight">{children}</span>
    </button>
  );
};

// ToDesktop's Exact Dark Secondary Button
const ToDesktopDarkButton = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white shadow-[0_-4px_12px_-4px_rgba(255,255,255,0.08)_inset,0_1px_3px_rgba(255,255,255,0.06)_inset,0_.5px_.5px_rgba(255,255,255,0.12)_inset,0_8px_8px_-3px_rgba(9,1,20,0.06),0_3px_3px_-1.5px_rgba(8,1,20,0.06),0_2px_2px_-1px_rgba(8,1,20,0.04)] transition-all duration-200 hover:bg-white/[0.1] active:scale-[0.98] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.16] to-white/[0.08] transition-opacity duration-200 group-hover:opacity-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/[0.16] to-white/[0.08] opacity-0 transition-opacity duration-200 group-active:opacity-100" />
      <span className="relative z-10 flex items-center gap-2 tracking-tight">{children}</span>
    </button>
  );
};

export default function LandingPage() {
  const [emailInput, setEmailInput] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast.error("Vui lòng điền thông tin email!");
      return;
    }
    toast.success(`Cảm ơn bạn! Đội ngũ ZPOS sẽ sớm liên hệ qua email ${emailInput}.`);
    setEmailInput("");
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white selection:bg-[#0036ff]/30 selection:text-white overflow-x-hidden">
      
      {/* 🧭 Header/Nav */}
      <nav className="fixed top-0 z-[3000] w-full border-b border-white/[0.08] bg-[#050505]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1128px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0036ff] text-xs font-bold text-white shadow-sm">
              Z
            </div>
            <span className="text-[16px] font-semibold tracking-tight text-white/90">ZPOS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 text-[14px] font-medium text-white/70">
            <Link href="#features" className="px-4 py-2 hover:bg-white/5 hover:text-white transition-all rounded-full">Features</Link>
            <Link href="#templates" className="px-4 py-2 hover:bg-white/5 hover:text-white transition-all rounded-full">Compare</Link>
            <Link href="#pricing" className="px-4 py-2 hover:bg-white/5 hover:text-white transition-all rounded-full">Pricing</Link>
            <Link href="#changelog" className="px-4 py-2 hover:bg-white/5 hover:text-white transition-all rounded-full">Docs</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-[14px] font-semibold text-white/70 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/login" className="text-[14px] font-semibold text-[#0036ff] bg-[#0036ff]/10 px-4 py-2 rounded-full hover:bg-[#0036ff]/20 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* 🚀 Main Content */}
      <main className="pt-32 pb-24 mx-auto max-w-[1128px] px-6 lg:px-8 relative">
        
        {/* Subtle glowing grid background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(circle at center top, black 20%, transparent 70%)' }} />

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-6 mt-16 mb-32 relative z-10">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-medium text-white/80 backdrop-blur-md shadow-sm hover:bg-white/10 transition-colors cursor-pointer mb-4">
            ZPOS Builder is now available
            <ArrowRight className="h-3.5 w-3.5 text-white/50" />
          </div>

          <h1 className="max-w-4xl text-[56px] md:text-[88px] font-bold leading-[1.0] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 pb-2">
            Release, secure, and <br className="hidden md:block"/>
            scale your <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#0036ff]">Retail App.</span>
          </h1>
          
          <p className="max-w-2xl text-[20px] md:text-[22px] font-normal text-white/60 leading-relaxed pt-2">
            Effortless deployment, robust security, offline capabilities, and seamless auto-updates for your multi-tenant point-of-sale system.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
            <ToDesktopButton className="!px-8 !py-4 !text-[15px]" onClick={() => window.location.href = '/login'}>
              Start free trial
            </ToDesktopButton>
            <ToDesktopDarkButton className="!px-8 !py-4 !text-[15px]" onClick={() => toast.info("Đang chuyển hướng đến Docs...")}>
              Read docs
            </ToDesktopDarkButton>
          </div>

          {/* Hero Interface Mockup with glowing aura */}
          <div className="w-full max-w-5xl mx-auto mt-24 relative group perspective-1000">
            {/* Glowing aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#0036ff]/20 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-[0_0_80px_rgba(0,54,255,0.1)] overflow-hidden flex flex-col transform-gpu transition-transform duration-700 hover:scale-[1.02]">
               {/* MacOS Style Header */}
               <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-gradient-to-b from-white/5 to-transparent">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                   <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                   <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                 </div>
                 <div className="mx-auto text-[12px] font-medium text-white/40 tracking-wide">ZPOS Console - Retail OS</div>
               </div>
               
               {/* Terminal-like content area mimicking ToDesktop's code showcase */}
               <div className="p-6 md:p-10 flex flex-col gap-4 font-mono text-[13px] md:text-[14px] leading-loose text-white/70 overflow-hidden relative">
                 <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
                 
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">1</span>
                   <span><span className="text-pink-400">import</span> <span className="text-white/90">&#123;</span> initRetailOS <span className="text-white/90">&#125;</span> <span className="text-pink-400">from</span> <span className="text-emerald-400">'@zpos/core'</span>;</span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">2</span>
                   <span></span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">3</span>
                   <span><span className="text-blue-400">const</span> app = <span className="text-yellow-200">initRetailOS</span>(<span className="text-white/90">&#123;</span></span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">4</span>
                   <span className="pl-4"><span className="text-sky-300">tenantId</span>: <span className="text-emerald-400">"todesktop-clone-100"</span>,</span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">5</span>
                   <span className="pl-4"><span className="text-sky-300">enableOfflineMode</span>: <span className="text-orange-300">true</span>,</span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">6</span>
                   <span className="pl-4"><span className="text-sky-300">autoSync</span>: <span className="text-white/90">&#123;</span></span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">7</span>
                   <span className="pl-8"><span className="text-sky-300">interval</span>: <span className="text-emerald-400">"realtime"</span>,</span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">8</span>
                   <span className="pl-8"><span className="text-sky-300">fallbackToLocal</span>: <span className="text-orange-300">true</span></span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">9</span>
                   <span className="pl-4"><span className="text-white/90">&#125;</span></span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">10</span>
                   <span><span className="text-white/90">&#125;</span>);</span>
                 </div>
                 <div className="flex gap-4">
                   <span className="text-[#0036ff]/60 select-none">11</span>
                   <span></span>
                 </div>
                 <div className="flex gap-4 opacity-50">
                   <span className="text-[#0036ff]/60 select-none">12</span>
                   <span><span className="text-slate-500">// App is now running at 60fps with offline support.</span></span>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Logos Marquee */}
        <section className="py-20 border-y border-white/[0.06] overflow-hidden relative z-10">
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#050505] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#050505] to-transparent z-10" />
          <p className="text-center text-[13px] font-medium text-white/40 mb-10 tracking-[0.15em] uppercase">POWERING THE WORLD'S MOST POPULAR RETAIL APPS</p>
          <div className="flex gap-16 animate-marquee whitespace-nowrap items-center w-max opacity-60">
            {[...CLIENTS, ...CLIENTS].map((client, idx) => (
              <div key={idx} className="text-xl font-bold text-white flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100">
                <Zap className="w-5 h-5" />
                {client}
              </div>
            ))}
          </div>
        </section>

        {/* The Retail Ops Stack - Exact Bento Layout */}
        <section id="features" className="py-32 space-y-16 relative z-10">
          <div className="max-w-[700px] space-y-6">
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-tight text-white leading-[1.1]">The Retail ops stack</h2>
            <p className="text-[20px] font-normal text-white/60 leading-relaxed">
              ZPOS is your end-to-end retail partner — everything you need to run stores at scale. Eliminate developer frustration by letting us handle the infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Card 1 - Span 2 */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-[24px] bg-white/[0.02] p-10 border border-white/[0.08] hover:bg-white/[0.04] transition-colors duration-500 flex flex-col justify-between min-h-[400px]">
              <div className="relative z-10 max-w-sm space-y-4">
                <div className="w-12 h-12 rounded-[12px] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Activity className="w-5 h-5 text-white/80" />
                </div>
                <h3 className="text-[24px] font-semibold text-white tracking-tight">Native Installers & Auto-updates</h3>
                <p className="text-[15px] text-white/50 leading-relaxed font-medium">
                  Ensure your app runs flawlessly on all platforms. Keep your customers' apps up-to-date and safely test new releases on a subset of users before rolling out to everyone.
                </p>
              </div>
              
              {/* Decorative graphic mimicking ToDesktop's graph */}
              <div className="absolute right-0 bottom-0 w-[50%] h-[60%] border-t border-l border-white/10 bg-gradient-to-br from-white/5 to-transparent rounded-tl-[24px] overflow-hidden flex items-end justify-end p-6 group-hover:bg-white/[0.08] transition-colors duration-500">
                <div className="w-full h-full border border-white/10 bg-[#0a0a0a] rounded-lg shadow-2xl flex flex-col justify-between p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-[#27c93f] animate-pulse"></div>
                      <span className="text-[10px] text-white/40 font-mono">v2.1.0 update active</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-12 items-end">
                    {[40, 70, 45, 90, 65, 80, 50, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#0036ff]/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="group relative overflow-hidden rounded-[24px] bg-white/[0.02] p-10 border border-white/[0.08] hover:bg-white/[0.04] transition-colors duration-500 min-h-[400px]">
              <div className="w-12 h-12 rounded-[12px] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="text-[24px] font-semibold text-white tracking-tight mb-4">Code Signing</h3>
              <p className="text-[15px] text-white/50 leading-relaxed font-medium">
                Our guided process makes purchasing and using certificates a breeze. Our secure hardware storage gives you peace of mind.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="group relative overflow-hidden rounded-[24px] bg-white/[0.02] p-10 border border-white/[0.08] hover:bg-white/[0.04] transition-colors duration-500 min-h-[400px]">
              <div className="w-12 h-12 rounded-[12px] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Cpu className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="text-[24px] font-semibold text-white tracking-tight mb-4">Performance Analytics</h3>
              <p className="text-[15px] text-white/50 leading-relaxed font-medium">
                Measure launch time, memory, and CPU usage. Compare across versions and other industry-standard apps.
              </p>
            </div>

            {/* Bento Card 4 - Span 2 */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0036ff]/20 to-transparent p-10 border border-[#0036ff]/30 hover:border-[#0036ff]/50 transition-colors duration-500 flex flex-col justify-center min-h-[400px]">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0036ff]/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-md space-y-6">
                <div className="w-12 h-12 rounded-[12px] bg-[#0036ff] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[32px] font-semibold text-white tracking-tight leading-[1.1]">Streamline your Infrastructure</h3>
                <p className="text-[16px] text-white/70 leading-relaxed font-medium">
                  ToDesktop automates your app development, deployment, and updates. You write the application. We do the infrastructure.
                </p>
                <div className="pt-2">
                  <ToDesktopButton className="!py-3 !px-6" onClick={() => window.location.href = '/login'}>Start free trial</ToDesktopButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section / Want something simpler? */}
        <section className="py-32 text-center max-w-2xl mx-auto space-y-8 border-t border-white/[0.06] relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[14px] font-medium text-white/70 shadow-sm backdrop-blur-md">
            Want something simpler?
          </div>
          <h2 className="text-[48px] md:text-[64px] font-bold tracking-tight text-white leading-[1.0] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 pb-2">
            ZPOS Builder
          </h2>
          <p className="text-[20px] font-normal text-white/50 leading-relaxed">
            Our visual UI will take your existing web app and turn it into a cross-platform desktop app in just a few minutes. No setup required.
          </p>
          <div className="flex justify-center pt-6">
            <ToDesktopDarkButton className="!px-8 !py-4" onClick={() => window.location.href = '/login'}>
              More information <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
            </ToDesktopDarkButton>
          </div>
        </section>

      </main>

      {/* 🏁 Footer */}
      <footer className="border-t border-white/[0.06] bg-[#050505] pb-20 pt-24 relative z-10">
        <div className="mx-auto max-w-[1128px] px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0036ff] text-[12px] font-bold text-white shadow-sm">
                Z
              </div>
              <span className="text-[16px] font-semibold tracking-tight text-white/90">ZPOS</span>
            </div>
            <p className="text-[14px] font-normal text-white/40 max-w-xs leading-relaxed">
              © 2026 ZPOS, Inc.<br/>
              A Y Combinator company.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="flex h-2 w-2 rounded-full bg-[#27c93f] animate-pulse shadow-[0_0_8px_rgba(39,201,63,0.6)]"></span>
              <span className="text-[13px] font-medium text-white/60">All systems operational</span>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[14px] font-semibold text-white/90">Products</h4>
            <div className="flex flex-col gap-4 text-[14px] font-medium text-white/50">
              <Link href="#" className="hover:text-white transition-colors">ToDesktop for Electron</Link>
              <Link href="#" className="hover:text-white transition-colors">ToDesktop Builder</Link>
              <Link href="#" className="hover:text-white transition-colors">Compare Products</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[14px] font-semibold text-white/90">Docs & Resources</h4>
            <div className="flex flex-col gap-4 text-[14px] font-medium text-white/50">
              <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="#" className="hover:text-white transition-colors">Changelog</Link>
              <Link href="#" className="hover:text-white transition-colors">Blog</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[14px] font-semibold text-white/90">Company</h4>
            <div className="flex flex-col gap-4 text-[14px] font-medium text-white/50">
              <Link href="#" className="hover:text-white transition-colors">Contact Sales</Link>
              <Link href="#" className="hover:text-white transition-colors">Twitter (𝕏)</Link>
              <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
            </div>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
