const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ohmwbxwjmiyfwzmyokef.supabase.co";
const supabaseKey = "sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: vData, error: vError } = await supabase
    .from("product_variants")
    .select("*, colors(id, name), sizes(id, name)")
    .eq("product_id", "c29c0e32-8e2a-4696-bab4-f4368c411221");

  console.log("Anon Variants query:", JSON.stringify(vData, null, 2));
}
main();
