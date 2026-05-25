const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ohmwbxwjmiyfwzmyokef.supabase.co";
const supabaseKey = "sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from("products").select("*, categories(id, name)").limit(1);

  console.log("Anon Products query:", { data, error });

  const { data: vData, error: vError } = await supabase
    .from("product_variants")
    .select("*, colors(id, name), sizes(id, name)")
    .limit(1);

  console.log("Anon Variants query:", { data: vData, error: vError });
}
main();
