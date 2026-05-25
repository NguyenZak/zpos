"use client";

import { motion } from "framer-motion";
import { Activity, Lock, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Dotted technical grid pattern for dark card background
const CardGridPatternDark = () => (
  <div className="absolute inset-0 -z-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none overflow-hidden rounded-[24px]">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sec-card-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sec-card-grid)" />
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

export function SecuritySection() {
  const { t, language } = useLanguage();

  const items = [
    {
      icon: Lock,
      title: t("sec.f1.title"),
      badge: "AES-256 SECURE",
      desc: t("sec.f1.desc"),
    },
    {
      icon: Activity,
      title: t("sec.f2.title"),
      badge: "ACTIVE REDUNDANCY",
      desc: t("sec.f2.desc"),
    },
    {
      icon: Users,
      title: t("sec.f3.title"),
      badge: "FINE REGULATION",
      desc: t("sec.f3.desc"),
    },
  ];

  return (
    <section className="py-28 bg-[#05061b] text-white relative overflow-hidden" id="security">
      {/* High-tech Dotted Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.2] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1.2px, transparent 1.2px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Dynamic Ambient Blur */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[400px] w-[500px] rounded-full bg-gradient-to-tr from-[#0036FF]/10 to-[#0093ff]/5 opacity-30 blur-[120px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0093ff] text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#0093ff] animate-pulse" />
            <ShieldCheck size={12} className="text-[#0093ff]" /> {t("sec.badge")}
          </motion.div>

          <h2
            className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white leading-[1.15]"
            style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)", fontFeatureSettings: "'ss02', 'ss05', 'ss10'" }}
          >
            {language === "vi" ? (
              <>
                An toàn tuyệt đối <span className="text-[#0093ff]">mặc định</span>
              </>
            ) : (
              <>
                Secure by <span className="text-[#0093ff]">default</span>
              </>
            )}
          </h2>

          <p
            className="text-base md:text-lg text-white/60 leading-relaxed font-light"
            style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
          >
            {t("sec.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative bg-white/5 backdrop-blur-md rounded-[24px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.15)] border border-white/10 hover:border-[#0093ff]/30 hover:shadow-[0_20px_50px_rgba(0,54,255,0.1)] transition-all duration-300 group overflow-hidden"
            >
              {/* Inner dotted mesh grid */}
              <CardGridPatternDark />

              <div className="flex items-center justify-between mb-8">
                {/* Custom dark icon circular mesh container */}
                <CircularGridIconDark>
                  <item.icon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </CircularGridIconDark>

                {/* Tech tag badge */}
                <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-1 rounded-md bg-blue-500/10 text-[#0093ff] font-semibold border border-blue-500/20">
                  {item.badge}
                </span>
              </div>

              <h3
                className="text-lg font-semibold mb-3 text-white tracking-tight group-hover:text-[#0093ff] transition-colors"
                style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
              >
                {item.title}
              </h3>

              <p
                className="text-sm text-white/60 leading-relaxed font-light"
                style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
              >
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
