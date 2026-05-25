const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ohmwbxwjmiyfwzmyokef.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obXdieHdqbWl5Znd6bXlva2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDg5MTAsImV4cCI6MjA5NDUyNDkxMH0.Wk0O9F99839-a9cRMBVqW-_qXv1QpX-01r_42_5_X1Y", // Wait, I need the actual anon key. I can read it from .env
);
