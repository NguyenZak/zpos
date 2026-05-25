const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ohmwbxwjmiyfwzmyokef.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk0ODkxMCwiZXhwIjoyMDk0NTI0OTEwfQ.mVcXYfELuRkKaNUXC7Fow9RR2kl_8iFocp0MFlnUROk",
);
async function main() {
  const { data, error } = await supabase.from("products").select("*").limit(1);
  console.log("Service key access:", data ? data.length : error);

  const anonSupabase = createClient(
    "https://ohmwbxwjmiyfwzmyokef.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDg5MTAsImV4cCI6MjA5NDUyNDkxMH0.Wk0O9F99839-a9cRMBVqW-_qXv1QpX-01r_42_5_X1Y", // Made up or I need the real anon key
  );

  // Wait, I can't use anon key easily without knowing it. Let's just fetch policies using postgres via rpc or something, or I can just check the user's schema.sql
}
main();
