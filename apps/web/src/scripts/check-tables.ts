import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(__dirname, "../../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""; // Wait, publishable key or service role key? Let's check service role key if available.
const supabaseRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk";

const supabase = createClient(supabaseUrl, supabaseRoleKey);

async function main() {
  const tables = [
    "colors",
    "sizes",
    "product_variants",
    "collections",
    "collection_products",
    "lookbooks",
    "lookbook_items",
    "campaigns",
    "campaign_products",
    "blog_categories",
    "blog_posts",
    "promotions",
    "promotion_products",
    "promotion_collections",
    "seo_redirects",
    "navigation_menus",
    "navigation_items",
  ];

  console.log("Checking tables on Supabase...");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`❌ Table ${table} error:`, error.message);
    } else {
      console.log(`✅ Table ${table} exists! Columns:`, Object.keys(data[0] || {}));
    }
  }
}

main();
