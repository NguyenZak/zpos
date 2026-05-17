"use client";

import { motion } from "framer-motion";
import { 
  Terminal, 
  GitBranch, 
  Activity, 
  Globe, 
  Cpu, 
  Server
} from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function ProductDemo() {
  const { t, language } = useLanguage();

  const features = [
    {
      title: t("demo.f1.title"),
      tag: "POS TERMINAL",
      desc: t("demo.f1.desc"),
      icon: Terminal
    },
    {
      title: t("demo.f2.title"),
      tag: "MULTI-TAB",
      desc: t("demo.f2.desc"),
      icon: GitBranch
    },
    {
      title: t("demo.f3.title"),
      tag: "SYNC SPEED < 50ms",
      desc: t("demo.f3.desc"),
      icon: Activity
    },
    {
      title: t("demo.f4.title"),
      tag: "AES-256 SECURE",
      desc: t("demo.f4.desc"),
      icon: Globe
    }
  ];

  return (
    <section className="py-24 bg-transparent overflow-hidden relative" id="products">
      {/* High-tech Dotted Grid Mesh Background */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 54, 255, 0.07) 1.2px, transparent 1.2px)`,
          backgroundSize: "24px 24px"
        }}
      />
      
      {/* Decorative Radial Light Glares */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#0036ff]/5 to-[#0093ff]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Tech Content & Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* DevOps Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 text-[#0036ff] text-xs font-mono tracking-wider mb-6">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#0036ff] animate-pulse" />
              {t("demo.badge")}
            </div>

            <h2 
              className="text-3xl md:text-5xl font-bold text-[#090114] mb-6 tracking-tight leading-[1.15]"
              style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)", fontFeatureSettings: "'ss02', 'ss05', 'ss10'" }}
            >
              {language === "vi" ? (
                <>Công cụ mạnh mẽ cho <br /><span className="text-[#0036ff]">chuyên gia</span></>
              ) : (
                <>Powerful tools for <br /><span className="text-[#0036ff]">power users</span></>
              )}
            </h2>
            
            <p className="text-base text-gray-500 mb-8 max-w-lg leading-relaxed">
              {t("demo.desc")}
            </p>

            {/* Re-designed Technical Features List */}
            <div className="space-y-4">
              {features.map((item, i) => (
                <div 
                  key={i} 
                  className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100/80 transition-all duration-300 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 border border-blue-100/40 flex items-center justify-center text-[#0036ff] group-hover:bg-[#0036ff] group-hover:text-white transition-colors duration-300 shadow-[0_2px_8px_rgba(0,54,255,0.05)]">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#090114] text-sm md:text-base">{item.title}</span>
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">{item.tag}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: High-tech Terminal & Floating Status cards */}
          <div className="relative h-[520px] flex items-center justify-center">
            
            {/* Glowing Aura Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,54,255,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Terminal Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="absolute top-8 left-0 right-10 z-20 rounded-2xl bg-[#05061b] shadow-[0_25px_60px_rgba(5,6,27,0.25)] border border-white/10 overflow-hidden w-[90%]"
            >
              {/* Header Bar */}
              <div className="h-11 bg-[#090b24] border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="text-2xs text-white/30 font-mono tracking-wider uppercase">bash — zpos-sync-daemon v2.4</span>
                <div className="w-8" /> {/* Spacer to center title */}
              </div>
              
              {/* Terminal Code Content */}
              <div className="p-6 font-mono text-xs leading-6 text-white/80">
                <p className="text-white/40 mb-2 flex items-center gap-2">
                  <span className="text-[#0093ff] font-bold">~</span> $ zpos sync --status
                </p>
                <p className="text-[#0093ff] mb-1">▸ Checking active POS terminal connections...</p>
                <p className="text-white/60 mb-1">▸ Compiling transactions database schemas...</p>
                <p className="text-white/60 mb-1">▸ Syncing multi-tenant restaurant orders...</p>
                <p className="text-white/40 mb-2">▸ Sync status: [================] 100%</p>
                <p className="text-emerald-400 font-semibold flex items-center gap-2 mt-3">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ✓ POS Terminals synchronized (0.8s)
                </p>
                <p className="text-white/60 mt-1 flex items-center gap-1.5">
                  URL: <a href="https://demo.zpos.vn" className="text-[#0093ff] hover:underline" target="_blank" rel="noreferrer">https://demo.zpos.vn</a>
                </p>
              </div>
            </motion.div>

            {/* Status Card 1: Server Operational with mini-sparkline */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute bottom-6 right-0 z-30 w-[260px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-inner">
                    <Server size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">POS Status</p>
                    <p className="text-xs font-bold text-gray-900 leading-tight">Terminals Online</p>
                  </div>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>

              {/* Sparkline & Latency */}
              <div className="flex items-end justify-between mt-4 gap-4">
                <div className="w-24 h-6">
                  <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0 25 L10 20 L20 28 L30 15 L40 18 L50 8 L60 14 L70 5 L80 12 L90 7 L100 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-gray-400 block uppercase">Uptime</span>
                  <span className="text-xs font-mono font-bold text-gray-900">99.998%</span>
                </div>
              </div>
            </motion.div>

            {/* Status Card 2: Compute Autoscaling with load ring */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute top-4 right-0 z-10 w-[220px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50 shadow-inner">
                  <Cpu size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Local SQLite Sync</p>
                  <p className="text-xs font-bold text-gray-900 leading-tight">Sync Active</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-600 animate-ping" />
                </div>
                <span className="text-[10px] font-mono text-gray-500 font-medium">Auto-routing active</span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
