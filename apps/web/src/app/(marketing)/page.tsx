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

export default function LandingPage() {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-aeonik-pro">
        <Header />
        <main className="flex-1">
          {/* Deep Blue/Space Gradient wrapper stretching down near half the page */}
          <div 
            style={{
              background: "linear-gradient(0deg, rgb(255, 255, 255), rgb(230, 244, 247) 6.29%, rgb(128, 191, 239) 15.02%, rgb(68, 164, 233) 19.39%, rgb(48, 157, 231), rgb(16, 150, 229) 21.57%, color(xyz-d65 0.241 0.261 0.773), color(xyz-d65 0.23 0.248 0.764) 22.66%, color(xyz-d65 0.21 0.222 0.745) 23.75%, color(xyz-d65 0.188 0.157 0.764) 33.2%, color(xyz-d65 0.178 0.128 0.772), rgb(16, 70, 233) 42.64%, rgb(6, 29, 182) 53.09%, rgb(7, 11, 107) 66.19%, rgb(19, 2, 58) 75.33%, rgb(15, 7, 29) 86.09%, rgb(15, 7, 29))"
            }}
          >
            <Hero />
            <LogoCloud />
            <FeatureGrid />
            <ProductDemo />
          </div>
          <FeatureDeepDive />
          <SecuritySection />
          <Pricing />
          <CTA />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
