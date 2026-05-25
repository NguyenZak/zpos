import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/storefront-blocks/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sb: {
          ctaBg: "var(--sb-cta-bg)",
          ctaFg: "var(--sb-cta-fg)",
          heroBg: "var(--sb-hero-bg)",
          heroFg: "var(--sb-hero-fg)",
          footerBg: "var(--sb-footer-bg)",
          footerFg: "var(--sb-footer-fg)",
          badgeBg: "var(--sb-badge-bg)",
          badgeFg: "var(--sb-badge-fg)",
        }
      },
      borderRadius: {
        DEFAULT: "var(--sb-radius)",
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
