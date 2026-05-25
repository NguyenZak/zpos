"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function Pricing({ dynamicConfig }: { dynamicConfig?: any }) {
  const { t, language } = useLanguage();

  if (dynamicConfig && !dynamicConfig.showPricing) {
    return null;
  }

  // Helper to cleanly separate price and period to avoid huge text overflow
  const parsePrice = (rawPrice: string, defaultPeriod?: string) => {
    if (!rawPrice) return { price: "", period: "" };
    // Match something like "1.250.000đ/tháng" -> "1.250.000đ" and "/tháng"
    const match = rawPrice.match(/^(.*?)\/(tháng|mo|month|year|năm)$/i);
    if (match) {
      return { price: match[1].trim(), period: `/${match[2].toLowerCase()}` };
    }
    return { price: rawPrice, period: defaultPeriod || "" };
  };

  const freePrice = parsePrice(language === "vi" ? "Miễn phí" : "Free");
  const proPrice = parsePrice(dynamicConfig?.pricingPlanBasic || "$29", language === "vi" ? "/tháng" : "/mo");
  const entPrice = parsePrice(
    dynamicConfig?.pricingPlanPro || (language === "vi" ? "Tùy chỉnh" : "Custom"),
    language === "vi" ? "/tháng" : "/mo",
  );

  const plans = [
    {
      name: t("pricing.free.title") || (language === "vi" ? "Cơ bản" : "Basic"),
      desc:
        t("pricing.free.desc") ||
        (language === "vi" ? "Hoàn hảo cho 1 cửa hàng nhỏ bắt đầu số hóa bán hàng." : "Perfect for a small store."),
      priceObj: freePrice,
      features:
        language === "vi"
          ? ["Hỗ trợ tới 3 dự án", "Hỗ trợ cộng đồng", "Phân tích cơ bản", "Bộ nhớ 1GB"]
          : ["Up to 3 projects", "Community support", "Basic analytics", "1GB storage"],
      cta: language === "vi" ? "Bắt đầu miễn phí" : "Get Started",
      highlight: false,
    },
    {
      name: t("pricing.pro.title") || (language === "vi" ? "Chuyên nghiệp" : "Professional"),
      desc:
        t("pricing.pro.desc") ||
        (language === "vi"
          ? "Dành cho các cửa hàng, nhà hàng quy mô lớn hoặc nhiều thiết bị."
          : "For larger stores and multiple devices."),
      priceObj: proPrice,
      features:
        language === "vi"
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
      badge: language === "vi" ? "Phổ biến nhất" : "Most Popular",
    },
    {
      name: t("pricing.ent.title") || (language === "vi" ? "Doanh nghiệp" : "Enterprise"),
      desc:
        t("pricing.ent.desc") ||
        (language === "vi"
          ? "Gói tùy biến hạ tầng riêng cho chuỗi bán lẻ, chuỗi nhượng."
          : "Custom infrastructure for franchises."),
      priceObj: entPrice,
      features:
        language === "vi"
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
      cta: language === "vi" ? "Liên hệ bán hàng" : "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <section className="py-24 bg-[#FAFAFA] relative overflow-hidden" id="pricing">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-[#FAFAFA] to-[#FAFAFA] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-[#090114] mb-6 tracking-tight leading-tight">
              {t("pricing.title") || "Chọn gói dịch vụ phù hợp"}
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
              {t("pricing.desc") ||
                "Bắt đầu dùng thử miễn phí và nâng cấp linh hoạt theo quy mô số lượng máy POS và chi nhánh."}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-[2rem] p-8 md:p-10 flex flex-col ${
                plan.highlight
                  ? "bg-[#090114] text-white shadow-[0_20px_40px_-15px_rgba(0,54,255,0.3)] lg:scale-105 transform z-10 border border-gray-800"
                  : "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full flex justify-center">
                  <div className="bg-gradient-to-r from-[#0036FF] to-[#00D4FF] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-2xl font-bold mb-3 ${plan.highlight ? "text-white" : "text-[#090114]"}`}>
                  {plan.name}
                </h3>
                <p
                  className={`text-sm leading-relaxed min-h-[40px] ${plan.highlight ? "text-gray-400" : "text-slate-500"}`}
                >
                  {plan.desc}
                </p>
              </div>

              <div className="mb-8 flex items-baseline flex-wrap gap-x-1 gap-y-2">
                <span
                  className={`text-[32px] sm:text-[40px] lg:text-[32px] xl:text-[40px] font-black tracking-tight leading-none ${plan.highlight ? "text-white" : "text-[#090114]"}`}
                >
                  {plan.priceObj.price}
                </span>
                {plan.priceObj.period && (
                  <span className={`text-base font-medium ${plan.highlight ? "text-gray-400" : "text-slate-500"}`}>
                    {plan.priceObj.period}
                  </span>
                )}
              </div>

              <Link
                href="#"
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-center transition-all duration-300 mb-10 ${
                  plan.highlight
                    ? "bg-[#0036FF] text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(0,54,255,0.3)] hover:shadow-[0_0_25px_rgba(0,54,255,0.5)]"
                    : "bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {plan.cta}
              </Link>

              <div className="space-y-4 flex-1">
                <p
                  className={`text-xs font-bold tracking-wider uppercase mb-6 ${plan.highlight ? "text-gray-400" : "text-slate-400"}`}
                >
                  {language === "vi" ? "Bao gồm các tính năng:" : "What's included:"}
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 shrink-0 rounded-full p-0.5 ${plan.highlight ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-[#0036FF]"}`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className={`text-sm font-medium ${plan.highlight ? "text-gray-300" : "text-slate-600"}`}>
                      {feature}
                    </span>
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
