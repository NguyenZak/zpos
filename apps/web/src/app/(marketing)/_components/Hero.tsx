"use client";

import Link from "next/link";
import { ArrowRight, AppWindow, Shield, MousePointerClick } from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Blueprint App Store style icon with grid lines
const BlueprintIcon = () => (
  <span className="inline-flex items-center justify-center bg-gradient-to-br from-[#0093ff] to-[#0036ff] w-12 h-12 md:w-16 md:h-16 rounded-[14px] md:rounded-[18px] shadow-[0_4px_20px_rgba(0,54,255,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] relative overflow-hidden align-middle mx-1 md:mx-2 border border-white/10">
    <svg
      className="absolute inset-0 w-full h-full text-white/30"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="50" cy="50" r="35" strokeDasharray="3 3" />
      <circle cx="50" cy="50" r="20" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
      <line x1="50" y1="0" x2="50" y2="100" />
      <line x1="0" y1="50" x2="100" y2="50" />
      <line x1="15" y1="15" x2="85" y2="85" strokeDasharray="4 4" />
      <line x1="85" y1="15" x2="15" y2="85" strokeDasharray="4 4" />
    </svg>
  </span>
);

// Isometric technical wireframe core with blueprint ring
const IsometricCubeIcon = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-6 group">
    {/* Blueprint concentric outer ring */}
    <svg className="absolute w-20 h-20 text-white/10 animate-[spin_30s_linear_infinite]" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" />
    </svg>

    {/* Wireframe Rotating Cube SVG */}
    <svg
      className="w-10 h-10 text-[#0093ff] animate-[pulse_3s_ease-in-out_infinite]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#00f0ff" />
      <path d="M2 17l10 5 10-5" stroke="#0036ff" />
      <path d="M2 12l10 5 10-5" stroke="#0093ff" />
      <path d="M12 12v10" stroke="#0036ff" />
      {/* Connection nodes */}
      <circle cx="12" cy="2" r="1.5" fill="#00f0ff" />
      <circle cx="2" cy="7" r="1.5" fill="#0093ff" />
      <circle cx="22" cy="7" r="1.5" fill="#0093ff" />
      <circle cx="12" cy="12" r="1.5" fill="#00f0ff" />
      <circle cx="12" cy="22" r="1.5" fill="#0036ff" />
    </svg>
  </div>
);

// Symmetrical glowing background circuits with moving data pulses
const CircuitLinesBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
    <svg
      className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-full text-white/5 opacity-50"
      viewBox="0 0 1400 800"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {/* Central vertical track */}
      <line x1="700" y1="0" x2="700" y2="800" strokeDasharray="5 5" className="text-white/10" />

      {/* Symmetrical Left Circuits */}
      <path d="M 500 150 L 350 150 L 300 200 L 100 200" />
      <path d="M 550 300 L 400 300 L 350 350 L 150 350 L 100 400" />
      <path d="M 600 500 L 450 500 L 400 550 L 200 550" />

      {/* Symmetrical Right Circuits */}
      <path d="M 900 150 L 1050 150 L 1100 200 L 1300 200" />
      <path d="M 850 300 L 1000 300 L 1050 350 L 1250 350 L 1300 400" />
      <path d="M 800 500 L 950 500 L 1000 550 L 1200 550" />

      {/* Symmetrical Glowing Moving Data Pulses */}
      <path
        d="M 500 150 L 350 150 L 300 200 L 100 200"
        stroke="#0093ff"
        strokeWidth="2"
        strokeDasharray="8 60"
        className="animate-dash-slow opacity-80"
      />
      <path
        d="M 900 150 L 1050 150 L 1100 200 L 1300 200"
        stroke="#00f0ff"
        strokeWidth="2"
        strokeDasharray="8 60"
        className="animate-dash-slow-reverse opacity-80"
      />

      <path
        d="M 550 300 L 400 300 L 350 350 L 150 350 L 100 400"
        stroke="#0036ff"
        strokeWidth="2"
        strokeDasharray="10 80"
        className="animate-dash-fast opacity-80"
      />
      <path
        d="M 850 300 L 1000 300 L 1050 350 L 1250 350 L 1300 400"
        stroke="#0093ff"
        strokeWidth="2"
        strokeDasharray="10 80"
        className="animate-dash-slow-reverse opacity-80"
      />

      {/* Connection Joints */}
      <circle cx="300" cy="200" r="3" fill="#0093ff" className="shadow-[0_0_8px_rgba(0,147,255,0.5)]" />
      <circle cx="1100" cy="200" r="3" fill="#00f0ff" />
      <circle cx="350" cy="350" r="3" fill="#0036ff" />
      <circle cx="1050" cy="350" r="3" fill="#0093ff" />
      <circle cx="400" cy="550" r="3" fill="#00f0ff" />
      <circle cx="1000" cy="550" r="3" fill="#0036ff" />
    </svg>

    {/* Soft neon blue glows */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0036ff]/10 rounded-full blur-[120px]" />
    <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] bg-[#0093ff]/5 rounded-full blur-[80px]" />
    <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] bg-[#0036ff]/5 rounded-full blur-[80px]" />
  </div>
);

// High-end circular grid container for icons
const CircularGridIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-14 h-14 rounded-full flex items-center justify-center border border-white/10 bg-white/5 shadow-inner group">
    <div className="absolute inset-1 rounded-full border border-white/5" />
    <div className="absolute inset-2 rounded-full border border-dashed border-white/10" />
    <div className="absolute inset-0 rounded-full bg-[#0036ff]/0 group-hover:bg-[#0036ff]/15 transition-colors blur-md" />
    <div className="relative z-10 text-white/80 group-hover:text-[#0093ff] transition-colors duration-300">
      {children}
    </div>
  </div>
);

export function Hero({ dynamicConfig }: { dynamicConfig?: any }) {
  const { t } = useLanguage();

  return (
    <section
      className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden text-white flex items-center bg-transparent min-h-[90vh]"
      style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
    >
      {/* Background Symmetrical Circuits & Glows */}
      <CircuitLinesBg />

      <div className="max-w-[1200px] mx-auto px-6 w-full flex flex-col items-center">
        {/* Top Centered Isometric Icon */}
        <div className="flex justify-center">
          <IsometricCubeIcon />
        </div>

        {/* Action Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 text-[10px] font-mono tracking-wider font-semibold uppercase mb-8 shadow-[0_0_15px_rgba(0,147,255,0.05)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0093ff]" />
          </span>
          {t("hero.badge")}
        </div>

        {/* Display Title */}
        <h1
          className="text-4xl md:text-6xl lg:text-[72px] font-normal tracking-tight text-center text-white leading-[1.1] mb-6 max-w-5xl"
          style={{ fontFamily: "'Aeonik Pro', sans-serif", fontFeatureSettings: "'ss02', 'ss05', 'ss10', 'ss11'" }}
        >
          {dynamicConfig?.heroTitle ? (
            dynamicConfig.heroTitle
          ) : (
            <>
              {t("hero.title1")} <br />
              {t("hero.title2")} <BlueprintIcon />
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg text-white/60 max-w-2xl text-center mb-10 leading-relaxed font-light"
          style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
        >
          {dynamicConfig?.heroSub || t("hero.subtitle")}
        </p>

        {/* Unified CTA & Floating Technical Features */}
        <div className="w-full max-w-5xl flex flex-col items-center mt-4">
          {/* Centered CTA Buttons */}
          <div className="flex flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto">
            <Link
              href="/register"
              className="button-primary w-full sm:w-auto px-6 py-2.5 text-sm transition-all flex items-center justify-center gap-1.5 font-semibold"
              style={{
                fontFamily: "'Aeonik Pro', sans-serif",
                ...(dynamicConfig?.accentColor
                  ? { backgroundColor: dynamicConfig.accentColor, borderColor: dynamicConfig.accentColor }
                  : {}),
              }}
            >
              {dynamicConfig?.primaryButtonText || t("hero.cta.trial")} <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link
              href="/docs"
              className="button-dark w-full sm:w-auto px-6 py-2.5 text-sm transition-all flex items-center justify-center font-semibold bg-white/10 hover:bg-white/15 border border-white/5"
              style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
            >
              {dynamicConfig?.secondaryButtonText || t("hero.cta.docs")}
            </Link>
          </div>

          {/* Floating Technical Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-y-0 w-full">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center group px-6">
              <span className="text-[10px] font-mono text-white/30 mb-4 block tracking-widest">
                {t("hero.feature1.meta")}
              </span>
              <CircularGridIcon>
                <AppWindow size={20} />
              </CircularGridIcon>
              <h3
                className="text-sm font-semibold text-white mt-5 mb-1.5 flex items-center gap-1.5"
                style={{ fontFamily: "'Aeonik Pro', sans-serif", fontFeatureSettings: "'ss02', 'ss05', 'ss10'" }}
              >
                {t("hero.feature1.title")}
                <span className="text-[9px] font-mono bg-blue-500/10 text-[#0093ff] px-1 py-0.2 rounded border border-blue-500/20 font-bold uppercase scale-90">
                  CLI
                </span>
              </h3>
              <p
                className="text-xs text-white/50 leading-relaxed font-light max-w-[260px]"
                style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
              >
                {t("hero.feature1.desc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center group md:border-x border-white/10 px-6">
              <span className="text-[10px] font-mono text-white/30 mb-4 block tracking-widest">
                {t("hero.feature2.meta")}
              </span>
              <CircularGridIcon>
                <Shield size={20} />
              </CircularGridIcon>
              <h3
                className="text-sm font-semibold text-white mt-5 mb-1.5 flex items-center gap-1.5"
                style={{ fontFamily: "'Aeonik Pro', sans-serif", fontFeatureSettings: "'ss02', 'ss05', 'ss10'" }}
              >
                {t("hero.feature2.title")}
                <span className="text-[9px] font-mono bg-[#00f0ff]/10 text-[#00f0ff] px-1 py-0.2 rounded border border-[#00f0ff]/20 font-bold uppercase scale-90">
                  SOC2
                </span>
              </h3>
              <p
                className="text-xs text-white/50 leading-relaxed font-light max-w-[260px]"
                style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
              >
                {t("hero.feature2.desc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center group px-6">
              <span className="text-[10px] font-mono text-white/30 mb-4 block tracking-widest">
                {t("hero.feature3.meta")}
              </span>
              <CircularGridIcon>
                <MousePointerClick size={20} className="group-hover:scale-110 transition-transform duration-300" />
              </CircularGridIcon>
              <h3
                className="text-sm font-semibold text-white mt-5 mb-1.5 flex items-center gap-1.5"
                style={{ fontFamily: "'Aeonik Pro', sans-serif", fontFeatureSettings: "'ss02', 'ss05', 'ss10'" }}
              >
                {t("hero.feature3.title")}
                <span className="text-[9px] font-mono bg-purple-500/10 text-purple-300 px-1 py-0.2 rounded border border-purple-500/20 font-bold uppercase scale-90">
                  CDN
                </span>
              </h3>
              <p
                className="text-xs text-white/50 leading-relaxed font-light max-w-[260px]"
                style={{ fontFamily: "'Aeonik Pro', sans-serif" }}
              >
                {t("hero.feature3.desc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
