"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function Pricing() {
  const { t, language } = useLanguage();

  const plans = [
    {
      name: t("pricing.free.title"),
      desc: t("pricing.free.desc"),
      price: language === "vi" ? "Miễn phí" : "Free",
      features: language === "vi" 
        ? ["Hỗ trợ tới 3 dự án", "Hỗ trợ cộng đồng", "Phân tích cơ bản", "Bộ nhớ 1GB"]
        : ["Up to 3 projects", "Community support", "Basic analytics", "1GB storage"],
      cta: language === "vi" ? "Bắt đầu miễn phí" : "Get Started",
      highlight: false,
    },
    {
      name: t("pricing.pro.title"),
      desc: t("pricing.pro.desc"),
      price: "$29",
      period: language === "vi" ? "/tháng" : "/mo",
      features: language === "vi"
        ? [
            "Không giới hạn dự án",
            "Hỗ trợ email ưu tiên",
            "Phân tích chuyên sâu",
            "Bộ nhớ 50GB",
            "Tên miền tùy chỉnh",
            "Hợp tác nhóm tiện lợi",
          ]
        : [
            "Unlimited projects",
            "Priority email support",
            "Advanced analytics",
            "50GB storage",
            "Custom domains",
            "Team collaboration",
          ],
      cta: language === "vi" ? "Dùng thử 14 ngày" : "Start 14-day trial",
      highlight: true,
    },
    {
      name: t("pricing.ent.title"),
      desc: t("pricing.ent.desc"),
      price: language === "vi" ? "Tùy chỉnh" : "Custom",
      features: language === "vi"
        ? [
            "Bao gồm tất cả gói Pro",
            "Quản lý khách hàng riêng biệt",
            "Hợp đồng & hóa đơn tùy chọn",
            "Hệ thống SSO (SAML, Okta)",
            "Hạ tầng triển khai riêng",
            "Cam kết Uptime SLA 99.99%",
          ]
        : [
            "Everything in Pro",
            "Dedicated success manager",
            "Custom contracts & invoicing",
            "SSO (SAML, Okta)",
            "On-premise deployment",
            "99.99% Uptime SLA",
          ],
      cta: language === "vi" ? "Liên hệ bộ phận bán hàng" : "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#090114] mb-6 tracking-tight">
            {t("pricing.title")}
          </h2>
          <p className="text-lg text-[#667085]">
            {t("pricing.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-[32px] p-8 flex flex-col ${
                plan.highlight
                  ? "bg-[#090114] text-white shadow-2xl scale-105 transform -translate-y-2 border border-gray-800"
                  : "bg-white border border-gray-200"
              }`}
            >
              <h3 className={`text-xl font-semibold mb-2 ${plan.highlight ? "text-white" : "text-[#090114]"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 h-10 ${plan.highlight ? "text-gray-400" : "text-[#667085]"}`}>{plan.desc}</p>
              <div className="mb-8">
                <span
                  className={`text-5xl font-bold tracking-tight ${plan.highlight ? "text-white" : "text-[#090114]"}`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-lg font-medium ${plan.highlight ? "text-gray-400" : "text-[#667085]"}`}>
                    {plan.period}
                  </span>
                )}
              </div>

              <Link
                href="#"
                className={`w-full py-3 px-4 rounded-xl font-semibold text-center transition-all mb-8 ${
                  plan.highlight
                    ? "bg-[#0036FF] text-white hover:bg-[#002CE6] shadow-[0_4px_14px_0_rgba(0,54,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,54,255,0.23)]"
                    : "bg-gray-50 text-[#090114] hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {plan.cta}
              </Link>

              <div className="space-y-4 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check size={18} className={`mt-0.5 ${plan.highlight ? "text-blue-400" : "text-[#0036FF]"}`} />
                    <span className={`text-sm ${plan.highlight ? "text-gray-300" : "text-gray-600"}`}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
