const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ohmwbxwjmiyfwzmyokef.supabase.co';
const supabaseKey = 'sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKphone() {
  console.log("Checking organization with slug 'kphone'...");
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'kphone')
    .single();

  if (orgErr) {
    console.error("Org error:", orgErr);
  } else {
    console.log("Found organization:", org);
    
    // Find organization members
    console.log("Fetching organization members...");
    const { data: members, error: memErr } = await supabase
      .from('organization_members')
      .select('*, profiles(*)')
      .eq('organization_id', org.id);

    if (memErr) {
      console.error("Members error:", memErr);
    } else {
      console.log("Members:", JSON.stringify(members, null, 2));
    }
  }
}

checkKphone();
