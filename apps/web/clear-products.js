const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ohmwbxwjmiyfwzmyokef.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk",
);

async function wipeProducts() {
  console.log("Clearing related tables...");
  await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("purchase_order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("inventory_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Wiping products...");
  const { data: products, error: fetchError } = await supabase.from("products").select("id");
  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }

  if (products.length === 0) {
    console.log("No products found to delete.");
    return;
  }

  const { error: retryError } = await supabase
    .from("products")
    .delete()
    .in(
      "id",
      products.map((p) => p.id),
    );

  if (retryError) {
    console.error("Failed again:", retryError);
  } else {
    console.log("Successfully deleted all products!");
  }
}

wipeProducts();
