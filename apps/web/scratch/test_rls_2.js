const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ohmwbxwjmiyfwzmyokef.supabase.co';
const supabaseKey = 'sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking organizations...");
  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name, slug");

  if (orgErr) {
    console.error("Organizations error:", orgErr);
  } else {
    console.log("Organizations:", orgs);
  }

  console.log("Checking profiles for kphone@zpos.click...");
  const { data: p1, error: e1 } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", "kphone@zpos.click")
    .maybeSingle();

  console.log("p1:", p1, "error:", e1);

  // Let's try to query organization_members for a specific org
  if (orgs && orgs.length > 0) {
    const orgId = orgs[0].id;
    console.log(`Checking organization_members for org ${orgId}...`);
    const { data: mems, error: memErr } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", orgId);
    console.log("mems:", mems, "error:", memErr);
  }
}

test();
