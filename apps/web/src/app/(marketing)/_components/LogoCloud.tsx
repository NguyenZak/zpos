"use client";

import { motion } from "framer-motion";
import { Box, Command, Eclipse, Hexagon, Sparkles, Triangle } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function LogoCloud() {
  const { language } = useLanguage();

  const logos = [
    { icon: Eclipse, name: "Acme Corp" },
    { icon: Hexagon, name: "Nexus" },
    { icon: Triangle, name: "Vortex" },
    { icon: Sparkles, name: "Starlight" },
    { icon: Command, name: "Command" },
    { icon: Box, name: "Block" },
  ];

  return (
    <section className="py-20 bg-transparent" id="customers">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-center text-sm font-semibold text-white/50 mb-8 uppercase tracking-widest">
          {language === "vi"
            ? "Được tin dùng bởi các đội ngũ hiện đại trên khắp thế giới"
            : "Trusted by modern teams worldwide"}
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
          {logos.map((logo, i) => (
            <motion.div
              key={i}
              whileHover={{ opacity: 1, scale: 1.05 }}
              className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer text-white"
            >
              <logo.icon size={24} />
              <span className="font-semibold text-lg">{logo.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
