const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ohmwbxwjmiyfwzmyokef.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: vData, error: vError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", "c29c0e32-8e2a-4696-bab4-f4368c411221");

  console.log("Service variants query for c29...:", JSON.stringify(vData, null, 2));

  // Check the original product's variants
  const { data: vData2 } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", "3d517616-f027-4512-ade8-8b2dd2efef28"); // The original product id
  console.log("Service variants query for original:", JSON.stringify(vData2, null, 2));
}
main();
