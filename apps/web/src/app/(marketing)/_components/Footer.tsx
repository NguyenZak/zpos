"use client";

import Link from "next/link";
import { Cloud } from "lucide-react";
import { useLanguage } from "./LanguageContext";

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export function Footer() {
  const { t, language } = useLanguage();

  const footerLinks = [
    {
      title: t("footer.product"),
      links: [
        { name: language === "vi" ? "Tính năng" : "Features", href: "#" },
        { name: language === "vi" ? "Tích hợp" : "Integrations", href: "#" },
        { name: language === "vi" ? "Bảng giá" : "Pricing", href: "#" },
        { name: language === "vi" ? "Nhật ký" : "Changelog", href: "#" },
        { name: language === "vi" ? "Tài liệu" : "Docs", href: "#" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { name: language === "vi" ? "Về chúng tôi" : "About Us", href: "#" },
        { name: language === "vi" ? "Tuyển dụng" : "Careers", href: "#" },
        { name: language === "vi" ? "Blog" : "Blog", href: "#" },
        { name: language === "vi" ? "Liên hệ" : "Contact", href: "#" },
        { name: language === "vi" ? "Đối tác" : "Partners", href: "#" },
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        { name: language === "vi" ? "Cộng đồng" : "Community", href: "#" },
        { name: language === "vi" ? "Trợ giúp" : "Help Center", href: "#" },
        { name: language === "vi" ? "Trạng thái" : "Status", href: "#" },
        { name: language === "vi" ? "Tài liệu API" : "API Reference", href: "#" },
        { name: language === "vi" ? "Mã nguồn mở" : "Open Source", href: "#" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { name: language === "vi" ? "Chính sách bảo mật" : "Privacy Policy", href: "#" },
        { name: language === "vi" ? "Điều khoản dịch vụ" : "Terms of Service", href: "#" },
        { name: language === "vi" ? "Chính sách Cookie" : "Cookie Policy", href: "#" },
        { name: language === "vi" ? "Bảo mật" : "Security", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 rounded-lg bg-[#0036FF] flex items-center justify-center text-white">
                <Cloud size={18} strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-lg text-[#090114]">ZPOS</span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed font-light">
              {t("footer.desc")}
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <Link href="#" className="hover:text-[#0036FF] transition-colors">
                <TwitterIcon />
              </Link>
              <Link href="#" className="hover:text-[#0036FF] transition-colors">
                <GithubIcon />
              </Link>
              <Link href="#" className="hover:text-[#0036FF] transition-colors">
                <LinkedinIcon />
              </Link>
            </div>
          </div>

          {footerLinks.map((section, idx) => (
            <div key={idx} className="col-span-1">
              <h4 className="font-semibold text-[#090114] mb-4 text-sm tracking-wide">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-[#0036FF] transition-colors font-light">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-light">© {new Date().getFullYear()} ZPOS, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-gray-500 font-medium font-mono">{language === "vi" ? "Tất cả hệ thống hoạt động ổn định" : "All systems operational"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
