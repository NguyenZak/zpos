const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ohmwbxwjmiyfwzmyokef.supabase.co';
const supabaseKey = 'sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking profiles table...");
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email")
    .limit(5);

  if (profileErr) {
    console.error("Profiles error:", profileErr);
  } else {
    console.log("Profiles count:", profiles.length, profiles);
  }

  console.log("Checking organization_members table...");
  const { data: members, error: memberErr } = await supabase
    .from("organization_members")
    .select("*")
    .limit(5);

  if (memberErr) {
    console.error("Members error:", memberErr);
  } else {
    console.log("Members count:", members.length, members);
  }
}

test();
