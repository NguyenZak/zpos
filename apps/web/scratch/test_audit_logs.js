const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function check() {
  console.log("=== Querying audit_logs ===");
  const { data, error } = await supabase.from('audit_logs').select('*').limit(1);
  if (error) {
    console.error("Error querying audit_logs:", error);
  } else {
    console.log("Success! audit_logs exists:", data);
  }
}

check();
