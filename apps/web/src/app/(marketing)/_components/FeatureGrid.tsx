"use client";

import { motion } from "framer-motion";
import { BarChart3, Globe, Layers, Shield, Workflow, Zap } from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Dotted technical grid pattern for dark card background
const CardGridPatternDark = () => (
  <div className="absolute inset-0 -z-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none overflow-hidden rounded-[24px]">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="card-grid-dark" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#card-grid-dark)" />
    </svg>
  </div>
);

// High-end circular grid for dark-mode icons
const CircularGridIconDark = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-12 h-12 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.02] shadow-[inset_0_2px_8px_rgba(255,255,255,0.02)] group-hover:bg-[#0036FF]/10 group-hover:border-[#0093ff]/30 transition-all duration-300">
    <div className="absolute inset-0.5 rounded-full border border-white/[0.02]" />
    <div className="absolute inset-1 rounded-full border border-dashed border-white/10" />
    <div className="relative z-10 text-white/80 group-hover:text-[#0093ff] transition-colors duration-300">
      {children}
    </div>
  </div>
);

export function FeatureGrid() {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: Zap,
      title: t("grid.f1.title"),
      badge: "LATENCY < 50MS",
      description: t("grid.f1.desc"),
    },
    {
      icon: Shield,
      title: t("grid.f2.title"),
      badge: "SOC2 TYPE II",
      description: t("grid.f2.desc"),
    },
    {
      icon: Globe,
      title: t("grid.f3.title"),
      badge: "35+ EDGE POPS",
      description: t("grid.f3.desc"),
    },
    {
      icon: Workflow,
      title: t("grid.f4.title"),
      badge: "0% MANUAL CODE",
      description: t("grid.f4.desc"),
    },
    {
      icon: Layers,
      title: t("grid.f5.title"),
      badge: "100+ APIS CONNECT",
      description: t("grid.f5.desc"),
    },
    {
      icon: BarChart3,
      title: t("grid.f6.title"),
      badge: "REAL-TIME LOGS",
      description: t("grid.f6.desc"),
    },
  ];

  return (
    <section className="py-28 bg-transparent relative overflow-hidden" id="features">
      {/* Decorative top ambient grid line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6">
        {/* Tech Badge & Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0093ff] text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#0093ff] animate-pulse" />
            {t("grid.badge")}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-[1.15]"
            style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)", fontFeatureSettings: "'ss02', 'ss05', 'ss10'" }}
          >
            {language === "vi" ? (
              <>Mọi thứ bạn cần để <span className="text-[#0093ff]">bứt phá</span></>
            ) : (
              <>Everything you need to <span className="text-[#0093ff]">scale</span></>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-white/60 leading-relaxed font-light"
            style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
          >
            {t("grid.subtitle")}
          </motion.p>
        </div>

        {/* Technical Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative bg-white/5 backdrop-blur-md rounded-[24px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.15)] border border-white/10 hover:border-[#0093ff]/30 hover:shadow-[0_20px_50px_rgba(0,54,255,0.1)] transition-all duration-300 group overflow-hidden"
            >
              {/* Inner ambient card grid dots */}
              <CardGridPatternDark />

              <div className="flex items-center justify-between mb-8">
                {/* Tech icon in circular mesh */}
                <CircularGridIconDark>
                  <feature.icon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </CircularGridIconDark>

                {/* Tech Badge Tag */}
                <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-1 rounded-md bg-blue-500/10 text-[#0093ff] font-semibold border border-blue-500/20">
                  {feature.badge}
                </span>
              </div>

              <h3
                className="text-lg font-semibold text-white mb-3 tracking-tight group-hover:text-[#0093ff] transition-colors"
                style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
              >
                {feature.title}
              </h3>
              
              <p
                className="text-sm text-white/60 leading-relaxed font-light"
                style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
