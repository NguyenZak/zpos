const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ohmwbxwjmiyfwzmyokef.supabase.co";
const supabaseKey = "sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: vData, error: vError } = await supabase.from("colors").select("*").limit(1);

  console.log("Anon Colors NO JOIN query:", JSON.stringify(vData, null, 2));
}
main();
