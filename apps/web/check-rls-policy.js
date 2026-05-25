const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ohmwbxwjmiyfwzmyokef.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk",
);
async function main() {
  const { data, error } = await supabase
    .rpc("get_policies_for_table", { table_name: "product_variants" })
    .catch(() => ({}));
  console.log("Policies via RPC:", data);

  // Actually let's just query pg_policies!
  const { data: pgData } = await supabase
    .from("pg_policies")
    .select("*")
    .eq("tablename", "product_variants")
    .catch(() => ({}));
  console.log("pg_policies:", pgData);
}
main();
