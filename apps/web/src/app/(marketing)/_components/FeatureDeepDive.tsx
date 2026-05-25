"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, Database, LineChart, AppWindow } from "lucide-react";

// Mockup 1: Real-time sync across all devices
const RealTimeSyncVisual = () => {
  return (
    <div className="relative w-full h-full bg-[#05061b] rounded-lg overflow-hidden flex flex-col justify-between p-6 border border-white/10 shadow-[0_20px_50px_rgba(5,6,27,0.3)] group select-none">
      {/* Background Dotted Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#0036ff 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Visual Title Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 z-10">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Global Edge Database Sync</span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0093ff] animate-ping" />
          <span className="text-[10px] font-mono text-[#0093ff] uppercase font-bold">Live Catalogs</span>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="relative flex-1 flex items-center justify-center py-6 min-h-[180px]">
        {/* Animated Connecting Vector Lines */}
        <svg className="absolute inset-0 w-full h-full" fill="none">
          {/* Left device to Center */}
          <path d="M 60 90 C 110 90, 110 90, 150 90" stroke="rgba(0, 147, 255, 0.15)" strokeWidth="2" />
          <path
            d="M 60 90 C 110 90, 110 90, 150 90"
            stroke="#0093ff"
            strokeWidth="2"
            strokeDasharray="8 40"
            className="animate-dash-slow"
          />

          {/* Right device to Center */}
          <path d="M 260 90 C 210 90, 210 90, 170 90" stroke="rgba(0, 147, 255, 0.15)" strokeWidth="2" />
          <path
            d="M 260 90 C 210 90, 210 90, 170 90"
            stroke="#00f0ff"
            strokeWidth="2"
            strokeDasharray="8 40"
            className="animate-dash-slow-reverse"
          />

          {/* Bottom device to Center */}
          <path d="M 160 145 C 160 130, 160 120, 160 100" stroke="rgba(0, 147, 255, 0.15)" strokeWidth="2" />
          <path
            d="M 160 145 C 160 130, 160 120, 160 100"
            stroke="#0036ff"
            strokeWidth="2"
            strokeDasharray="8 30"
            className="animate-dash-fast"
          />
        </svg>

        {/* Central Sync Core */}
        <div className="relative z-10 w-14 h-14 rounded-full bg-blue-950/80 border border-[#0036ff]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,54,255,0.2)]">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#0093ff]/40 animate-[spin_10s_linear_infinite]" />
          <Database size={20} className="text-[#0093ff] animate-pulse" />
        </div>

        {/* Device 1 (Left): POS Terminal */}
        <div className="absolute left-2 top-[20%] w-[90px] bg-white/5 backdrop-blur-md border border-white/5 rounded-lg p-2 text-center shadow-lg">
          <span className="text-[8px] font-mono text-white/40 block">STATION_01</span>
          <span className="text-[10px] font-bold text-white/80 mt-0.5 block leading-tight">ZPOS Terminal</span>
          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded mt-1.5 inline-block">
            Online
          </span>
        </div>

        {/* Device 2 (Right): Mobile App */}
        <div className="absolute right-2 top-[20%] w-[90px] bg-white/5 backdrop-blur-md border border-white/5 rounded-lg p-2 text-center shadow-lg">
          <span className="text-[8px] font-mono text-white/40 block">MANAGER_APP</span>
          <span className="text-[10px] font-bold text-white/80 mt-0.5 block leading-tight">Mobile POS</span>
          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded mt-1.5 inline-block">
            Synced
          </span>
        </div>

        {/* Device 3 (Bottom): Customer Screen */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] bg-white/5 backdrop-blur-md border border-white/5 rounded-lg p-1.5 text-center shadow-lg">
          <span className="text-[8px] font-mono text-white/40 block">DISPLAY_NODE</span>
          <span className="text-[10px] font-bold text-white/80 mt-0.5 block leading-tight">Customer Screen</span>
          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded mt-1 inline-block">
            Connected
          </span>
        </div>
      </div>

      {/* Sync Status Logs Footer */}
      <div className="border-t border-white/5 pt-2.5 flex items-center justify-between text-[9px] font-mono text-white/30 z-10">
        <span>secure-wss://zpos.net/gateway</span>
        <span className="text-[#0093ff] font-bold">Latency: 12ms</span>
      </div>
    </div>
  );
};

// Mockup 2: Insights that drive growth
const InsightsAnalyticsVisual = () => {
  return (
    <div className="relative w-full h-full bg-[#05061b] rounded-lg overflow-hidden flex flex-col justify-between p-6 border border-white/10 shadow-[0_20px_50px_rgba(5,6,27,0.3)] group select-none">
      {/* Background Dotted Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#a855f7 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 z-10">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          Real-time Analytics Stream
        </span>
        <span className="text-[10px] font-mono text-purple-400 uppercase font-bold bg-purple-950/30 px-2 py-0.5 rounded border border-purple-800/30">
          Active Feed
        </span>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 flex flex-col justify-center py-4 z-10">
        {/* Metric row */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-white tracking-tight">$14,248.80</span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">+18.4% today</span>
        </div>

        {/* Large SVG Area Chart */}
        <div className="relative w-full h-24">
          <svg
            className="w-full h-full text-purple-500 overflow-visible"
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area path */}
            <path d="M0 90 Q30 70 60 85 T120 40 T180 60 T240 20 T300 10 L300 100 L0 100 Z" fill="url(#area-grad)" />
            {/* Stroke path */}
            <path
              d="M0 90 Q30 70 60 85 T120 40 T180 60 T240 20 T300 10"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Pulsing peak point */}
            <circle cx="240" cy="20" r="4" fill="#a855f7" />
            <circle cx="240" cy="20" r="8" fill="none" stroke="#a855f7" strokeWidth="1.5" className="animate-ping" />
          </svg>
        </div>
      </div>

      {/* Live Streams Footer */}
      <div className="border-t border-white/5 pt-2.5 flex items-center justify-between text-[9px] font-mono text-white/30 z-10">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> POS_NODE_4: completed order #1240
        </span>
        <span className="text-purple-400 font-bold">FPS: 60</span>
      </div>
    </div>
  );
};

// Mockup 3: Extensible by design
const ExtensibleCodeVisual = () => {
  return (
    <div className="relative w-full h-full bg-[#05061b] rounded-lg overflow-hidden flex flex-col justify-between p-6 border border-white/10 shadow-[0_20px_50px_rgba(5,6,27,0.3)] group select-none">
      {/* VSCode-style Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] font-mono text-white/50 ml-1">zpos.integrations.ts</span>
        </div>
        <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">SDK V2</span>
      </div>

      {/* Code Area */}
      <div className="flex-1 font-mono text-[10px] text-white/70 py-4 leading-5 overflow-x-auto select-none">
        <p className="text-white/30 font-light mb-1">// Register trigger custom integration</p>
        <p>
          <span className="text-purple-400">import</span> &#123; <span className="text-blue-300">ZposSDK</span> &#125;{" "}
          <span className="text-purple-400">from</span> <span className="text-emerald-400">"@zpos/core"</span>;
        </p>
        <p className="mt-0.5">
          <span className="text-purple-400">const</span> <span className="text-amber-300">sdk</span> ={" "}
          <span className="text-purple-400">new</span> <span className="text-blue-300">ZposSDK</span>(&#123;{" "}
          <span className="text-blue-300">tenant</span>: <span className="text-emerald-400">"hq"</span> &#125;);
        </p>
        <p className="mt-1">
          <span className="text-amber-300">sdk</span>.<span className="text-blue-300">on</span>(
          <span className="text-emerald-400">"order.complete"</span>, <span className="text-purple-400">async</span> (
          <span className="text-amber-300">order</span>) <span className="text-purple-400">=&gt;</span> &#123;
        </p>
        <p className="pl-4">
          <span className="text-purple-400">await</span> <span className="text-blue-300">sendToZaloSupport</span>(&#123;
        </p>
        <p className="pl-8">
          <span className="text-blue-300">phone</span>: <span className="text-amber-300">order</span>.
          <span className="text-blue-300">customer</span>.<span className="text-blue-300">phone</span>,
        </p>
        <p className="pl-8">
          <span className="text-blue-300">message</span>:{" "}
          <span className="text-emerald-400">{"`Order #${order.id} complete!`"}</span>
        </p>
        <p className="pl-4">&#125;);</p>
        <p>&#125;);</p>
      </div>

      {/* Footer Metrics */}
      <div className="border-t border-white/5 pt-2.5 flex items-center justify-between text-[9px] font-mono text-white/30 z-10">
        <span>Trigger: zpos-core-hook v1.5</span>
        <span className="text-emerald-400 font-bold">✓ Compiled successfully</span>
      </div>
    </div>
  );
};

import { useLanguage } from "./LanguageContext";

export function FeatureDeepDive() {
  const { t } = useLanguage();

  const sections = [
    {
      title: t("dive.f1.title"),
      description: t("dive.f1.desc"),
      icon: Database,
      cta: t("dive.f1.cta"),
      color: "blue",
      align: "left" as const,
      visual: RealTimeSyncVisual,
    },
    {
      title: t("dive.f2.title"),
      description: t("dive.f2.desc"),
      icon: LineChart,
      cta: t("dive.f2.cta"),
      color: "purple",
      align: "right" as const,
      visual: InsightsAnalyticsVisual,
    },
    {
      title: t("dive.f3.title"),
      description: t("dive.f3.desc"),
      icon: Code2,
      cta: t("dive.f3.cta"),
      color: "amber",
      align: "left" as const,
      visual: ExtensibleCodeVisual,
    },
  ];

  return (
    <section className="py-24 bg-[#F8FAFC] relative overflow-hidden">
      {/* High-tech Dotted Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(0, 54, 255, 0.05) 1.2px, transparent 1.2px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-6 space-y-32 relative z-10">
        {sections.map((section, i) => (
          <div
            key={i}
            className={`flex flex-col gap-12 lg:gap-24 items-center ${section.align === "right" ? "lg:flex-row-reverse" : "lg:flex-row"}`}
          >
            {/* Text description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-1 space-y-6"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] border
                ${section.color === "blue" ? "bg-blue-50 border-blue-100 text-blue-600" : ""}
                ${section.color === "purple" ? "bg-purple-50 border-purple-100 text-purple-600" : ""}
                ${section.color === "amber" ? "bg-amber-50 border-amber-100 text-amber-600" : ""}
              `}
              >
                <section.icon size={20} />
              </div>

              <h3
                className="text-3xl md:text-4xl font-bold text-[#090114] tracking-tight leading-[1.18]"
                style={{
                  fontFamily: "var(--font-aeonik-pro, sans-serif)",
                  fontFeatureSettings: "'ss02', 'ss05', 'ss10'",
                }}
              >
                {section.title}
              </h3>

              <p className="text-base text-gray-500 leading-relaxed max-w-lg">{section.description}</p>

              <Link
                href="#"
                className="inline-flex items-center text-sm font-semibold text-[#0036FF] hover:text-[#002CE6] transition-colors"
              >
                {section.cta} <span className="ml-1">→</span>
              </Link>
            </motion.div>

            {/* High-tech Interactive Visual Rendering */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 w-full max-w-[500px]"
            >
              <div className="aspect-[4/3] rounded-lg bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden flex items-center justify-center p-4">
                <section.visual />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
