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
  console.log("=== Organizations ===");
  const { data: orgs, error: orgsErr } = await supabase.from('organizations').select('*');
  if (orgsErr) console.error("Orgs error:", orgsErr);
  else console.log(orgs);

  console.log("\n=== Profiles ===");
  const { data: profiles, error: profsErr } = await supabase.from('profiles').select('*');
  if (profsErr) console.error("Profiles error:", profsErr);
  else console.log(profiles);

  console.log("\n=== Organization Members ===");
  const { data: members, error: membErr } = await supabase.from('organization_members').select('*');
  if (membErr) console.error("Members error:", membErr);
  else console.log(members);
}

check();
