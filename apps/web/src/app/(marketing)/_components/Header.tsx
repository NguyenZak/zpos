"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Cloud, Globe, Menu, X } from "lucide-react";

import { useLanguage } from "./LanguageContext";

export function Header({ initialLogoText }: { initialLogoText?: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [logoText, setLogoText] = useState(initialLogoText || "ZPOS");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);

    async function loadLogoText() {
      try {
        const res = await fetch("/api/admin/landing-config");
        const json = await res.json();
        if (json.success && json.data && json.data.logoText) {
          setLogoText(json.data.logoText);
        }
      } catch (err) {
        console.error("Failed to load header logoText:", err);
      }
    }
    loadLogoText();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ease-in-out ${
        isScrolled
          ? "top-4 left-1/2 -translate-x-1/2 w-[92%] sm:w-[90%] max-w-[850px] bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.02)] rounded-full h-14 px-3"
          : "top-0 left-0 right-0 w-full bg-transparent h-20 px-6 pt-2"
      }`}
    >
      <div
        className={`mx-auto h-full flex items-center justify-between transition-all duration-500 ${
          isScrolled ? "max-w-full px-2" : "max-w-[1200px]"
        }`}
      >
        {/* Left section: Logo + Nav */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0093ff] to-[#0036ff] flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
              <Cloud size={18} strokeWidth={2.5} />
            </div>
            {!isScrolled && <span className="font-semibold text-lg text-white tracking-tight ml-2.5">{logoText}</span>}
          </Link>

          {isScrolled && <div className="w-px h-5 bg-gray-200/80 mx-4" />}

          {/* Navigation Links */}
          <nav className={`hidden md:flex items-center ${isScrolled ? "gap-6" : "gap-8 ml-16"}`}>
            <Link
              href="/products"
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                isScrolled ? "text-gray-800 hover:text-black" : "text-white/80 hover:text-white"
              }`}
            >
              {t("nav.products")} <ChevronDown size={14} className="opacity-70 mt-0.5" />
            </Link>
            <Link
              href="#docs"
              className={`text-sm font-semibold transition-colors ${
                isScrolled ? "text-gray-800 hover:text-black" : "text-white/80 hover:text-white"
              }`}
            >
              {t("nav.docs")}
            </Link>
            <Link
              href="#changelog"
              className={`text-sm font-semibold transition-colors ${
                isScrolled ? "text-gray-800 hover:text-black" : "text-white/80 hover:text-white"
              }`}
            >
              {t("nav.changelog")}
            </Link>
            <Link
              href="#blog"
              className={`text-sm font-semibold transition-colors ${
                isScrolled ? "text-gray-800 hover:text-black" : "text-white/80 hover:text-white"
              }`}
            >
              {t("nav.blog")}
            </Link>
          </nav>
        </div>

        {/* Right buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* High-tech Language Switcher */}
          <button
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
            className={`text-[10px] font-mono font-bold uppercase transition-all rounded-full flex items-center justify-center gap-1.5 px-3 py-1.5 border ${
              isScrolled
                ? "bg-black/5 hover:bg-black/10 border-black/5 text-gray-700 hover:border-black/20"
                : "bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 text-white/90 hover:border-white/40"
            }`}
          >
            <Globe size={12} className={isScrolled ? "text-gray-500" : "text-white/60"} />
            {language === "vi" ? "VI" : "EN"}
          </button>

          <Link
            href="/register"
            className={`text-sm font-semibold rounded-full transition-all flex items-center justify-center ${
              isScrolled
                ? "bg-[#0036FF] text-white px-5 py-1.5 hover:bg-[#002CE6] shadow-[0_4px_14px_rgba(0,54,255,0.25)]"
                : "bg-white text-gray-900 px-5 py-1.5 hover:bg-white/90 shadow-[0_4px_14px_rgba(255,255,255,0.15)]"
            }`}
          >
            {t("nav.signup")}
          </Link>
        </div>

        {/* Mobile menu triggers */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Language Switcher */}
          <button
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
            className={`text-[9px] font-mono font-bold uppercase transition-all rounded-full flex items-center justify-center gap-1 px-2.5 py-1 border ${
              isScrolled ? "bg-black/5 border-black/5 text-gray-700" : "bg-white/5 border-white/20 text-white/90"
            }`}
          >
            <Globe size={10} />
            {language === "vi" ? "VI" : "EN"}
          </button>

          <button
            className={`transition-colors ${isScrolled ? "text-gray-600 mr-1" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute left-0 right-0 shadow-lg py-4 px-6 md:hidden flex flex-col gap-4 border transition-all duration-300 ${
              isScrolled
                ? "top-16 bg-white border-gray-200/80 rounded-lg w-full"
                : "top-20 bg-[#05061b] border-white/10 rounded-lg w-full"
            }`}
          >
            <Link
              href="/products"
              className={`text-base font-semibold ${isScrolled ? "text-gray-800" : "text-white"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.products")}
            </Link>
            <Link
              href="#docs"
              className={`text-base font-semibold ${isScrolled ? "text-gray-800" : "text-white"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.docs")}
            </Link>
            <Link
              href="#changelog"
              className={`text-base font-semibold ${isScrolled ? "text-gray-800" : "text-white"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.changelog")}
            </Link>
            <Link
              href="#blog"
              className={`text-base font-semibold ${isScrolled ? "text-gray-800" : "text-white"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.blog")}
            </Link>
            <div className={`h-px ${isScrolled ? "bg-gray-100" : "bg-white/10"} my-1`} />
            <Link
              href="/register"
              className="w-full text-center py-2 text-base font-semibold bg-[#0036FF] text-white rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.signup")}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
