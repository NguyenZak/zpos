const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ohmwbxwjmiyfwzmyokef.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk",
);

async function main() {
  const { data, error } = await supabase.from("products").select("*").limit(1);
  if (error) {
    console.error("Error fetching products:", error);
  } else {
    console.log("Product columns:", Object.keys(data[0] || {}));
  }
}
main();
