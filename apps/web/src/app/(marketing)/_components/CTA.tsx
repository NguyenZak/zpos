"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function CTA() {
  const { t } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0036FF]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0036FF] via-[#3B82F6] to-[#9333EA] opacity-80" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />

      <div className="max-w-[800px] mx-auto px-6 relative z-10 text-center text-white">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-aeonik-pro, sans-serif)" }}
        >
          {t("cta.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light"
          style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {t("cta.desc")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-white text-[#0036FF] rounded-full hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {t("cta.start")} <ArrowRight size={18} />
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-transparent text-white border border-white/30 rounded-full hover:bg-white/10 transition-all flex items-center justify-center"
          >
            {t("cta.contact")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
