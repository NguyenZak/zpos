const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://ohmwbxwjmiyfwzmyokef.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*, colors(id, name), sizes(id, name)")
    .limit(1);

  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS");
  }
}
main();
