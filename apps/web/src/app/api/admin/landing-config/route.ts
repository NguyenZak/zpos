import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

import { requireSuperAdmin } from "@/utils/admin-auth";

const CONFIG_PATH = path.join(process.cwd(), "src/data/landing-config.json");

// Helper to get local config
function getLocalConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading local landing-config.json:", e);
  }
  return null;
}

// Helper to write local config
function writeLocalConfig(config: any) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error writing local landing-config.json:", e);
    return false;
  }
}

// GET handler: reads landing configuration from local json & syncs with Supabase organization branding
export async function GET() {
  let config = getLocalConfig();

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey!);

      const { data, error } = await supabase.from("organizations").select("branding").eq("slug", "app").maybeSingle();

      if (!error && data && data.branding && (data.branding as any).landing_page) {
        const dbConfig = (data.branding as any).landing_page;
        config = { ...config, ...dbConfig };
        writeLocalConfig(config);
      }
    } catch (e) {
      console.warn("Supabase landing-config query exception:", e);
    }
  }

  if (!config) {
    config = {
      logoText: "ZPOS Solutions",
      heroTitle: "Hệ thống Omnichannel POS Toàn Diện",
      heroSub:
        "Giải pháp quản lý bán lẻ, nhà hàng và F&B chuyên nghiệp. Tự động đồng bộ hóa kho, kết nối đa kênh & hoạt động offline-first thông minh.",
      accentColor: "#2563eb",
      primaryButtonText: "Dùng thử miễn phí",
      secondaryButtonText: "Trải nghiệm Simulator",
      showPricing: true,
      pricingPlanBasic: "350.000đ/tháng",
      pricingPlanPro: "1.250.000đ/tháng",
      supportPhone: "1900 8899",
      promoCode: "ZPOSLAUNCH",
      promoDiscount: "Giảm 10% trọn đời",
      isDarkPreview: true,
    };
  }

  return NextResponse.json({ success: true, data: config });
}

// POST handler: saves landing configuration to local json and syncs with Supabase
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const config = await request.json();

    // 1. Save to local JSON
    writeLocalConfig(config);

    // 2. Sync to Supabase in background
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey!);

        const { data: org } = await supabase.from("organizations").select("branding").eq("slug", "app").maybeSingle();

        const currentBranding = org?.branding || {};
        const updatedBranding = {
          ...currentBranding,
          landing_page: config,
        };

        await supabase.from("organizations").update({ branding: updatedBranding }).eq("slug", "app");
      } catch (dbErr) {
        console.warn("Supabase landing-config update error:", dbErr);
      }
    }

    return NextResponse.json({ success: true, data: config });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
