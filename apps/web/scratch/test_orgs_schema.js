const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ohmwbxwjmiyfwzmyokef.supabase.co';
const supabaseKey = 'sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking organizations schema...");
  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("*")
    .limit(1);

  if (orgErr) {
    console.error("Organizations error:", orgErr);
  } else {
    console.log("Organizations:", orgs);
  }
}

test();
