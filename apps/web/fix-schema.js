const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ohmwbxwjmiyfwzmyokef.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk",
);
async function main() {
  const { error } = await supabase.rpc("execute_sql", {
    sql: `
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_new_arrival boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false;
    `,
  });
  console.log("Result:", error || "Success");
}
main();
