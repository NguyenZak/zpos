import { CTA } from "./_components/CTA";
import { FeatureDeepDive } from "./_components/FeatureDeepDive";
import { FeatureGrid } from "./_components/FeatureGrid";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { Hero } from "./_components/Hero";
import { LogoCloud } from "./_components/LogoCloud";
import { Pricing } from "./_components/Pricing";
import { ProductDemo } from "./_components/ProductDemo";
import { SecuritySection } from "./_components/SecuritySection";
import { LanguageProvider } from "./_components/LanguageContext";
import { ArrowRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export default async function LandingPage() {
  // 1. Fetch Landing Page Config from local cache or Supabase Organization branding
  let dynamicConfig = {
    logoText: "ZPOS",
    heroTitle: "",
    heroSub: "",
    primaryButtonText: "",
    secondaryButtonText: "",
    accentColor: "#0036FF",
    pricingPlanBasic: "350,000đ",
    pricingPlanPro: "1,250,000đ",
    showPricing: true,
    showBlog: true,
  };

  try {
    const configPath = path.join(process.cwd(), "src/data/landing-config.json");
    if (fs.existsSync(configPath)) {
      const fileData = fs.readFileSync(configPath, "utf-8");
      dynamicConfig = { ...dynamicConfig, ...JSON.parse(fileData) };
    }
  } catch (e) {
    console.error("Error loading server landing config:", e);
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
      const { data, error } = await supabase
        .from("organizations")
        .select("branding")
        .eq("slug", "app")
        .single();
        
      if (!error && data && data.branding && (data.branding as any).landing_page) {
        dynamicConfig = { ...dynamicConfig, ...(data.branding as any).landing_page };
      }
    } catch (e) {
      console.warn("Supabase fetch exception in marketing layout:", e);
    }
  }

  // 2. Fetch published blogs from CMS
  let blogs: any[] = [];
  try {
    const blogsPath = path.join(process.cwd(), "src/data/blogs.json");
    if (fs.existsSync(blogsPath)) {
      const fileData = fs.readFileSync(blogsPath, "utf-8");
      const allBlogs = JSON.parse(fileData);
      blogs = allBlogs.filter((b: any) => b.status === "published");
    }
  } catch (e) {
    console.error("Error loading server blogs:", e);
  }

  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-aeonik-pro">
        <Header initialLogoText={dynamicConfig.logoText} />
        <main className="flex-1">
          {/* Deep Blue/Space Gradient wrapper stretching down near half the page */}
          <div 
            style={{
              background: "linear-gradient(0deg, rgb(255, 255, 255), rgb(230, 244, 247) 6.29%, rgb(128, 191, 239) 15.02%, rgb(68, 164, 233) 19.39%, rgb(48, 157, 231), rgb(16, 150, 229) 21.57%, color(xyz-d65 0.241 0.261 0.773), color(xyz-d65 0.23 0.248 0.764) 22.66%, color(xyz-d65 0.21 0.222 0.745) 23.75%, color(xyz-d65 0.188 0.157 0.764) 33.2%, color(xyz-d65 0.178 0.128 0.772), rgb(16, 70, 233) 42.64%, rgb(6, 29, 182) 53.09%, rgb(7, 11, 107) 66.19%, rgb(19, 2, 58) 75.33%, rgb(15, 7, 29) 86.09%, rgb(15, 7, 29))"
            }}
          >
            <Hero dynamicConfig={dynamicConfig} />
            <LogoCloud />
            <FeatureGrid />
            <ProductDemo />
          </div>
          <FeatureDeepDive />
          <SecuritySection />
          <Pricing dynamicConfig={dynamicConfig} />
          
          {/* Dynamic Blog Section */}
          {dynamicConfig.showBlog && blogs.length > 0 && (
            <section id="blog" className="py-24 bg-slate-950 text-white relative border-t border-slate-900">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="max-w-[1240px] mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-mono font-bold tracking-widest uppercase">
                      Cổng thông tin & Công nghệ
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
                      Kiến Thức Vận Hành & <br />
                      Xu Hướng Chuyển Đổi Số
                    </h2>
                  </div>
                  <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                    Cập nhật các bài phân tích chuyên sâu về quản trị kinh doanh, tối ưu chuỗi cung ứng và công nghệ AI bán hàng.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {blogs.slice(0, 3).map((post) => (
                    <article 
                      key={post.id} 
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/35 transition-all group flex flex-col h-full cursor-pointer"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-blue-600/90 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full text-white" style={{ backgroundColor: dynamicConfig.accentColor }}>
                          {post.category}
                        </span>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                            <span>{post.publishedAt}</span>
                            <span>•</span>
                            <span>{post.readTime} đọc</span>
                          </div>
                          <h3 className="text-sm font-bold leading-snug group-hover:text-blue-300 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                            {post.summary}
                          </p>
                        </div>

                        <div className="border-t border-white/10 pt-4 flex items-center justify-between text-[11px] font-bold text-blue-400 group-hover:text-blue-300" style={{ color: dynamicConfig.accentColor }}>
                          <span>Đọc toàn bộ bài viết</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          <CTA />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
