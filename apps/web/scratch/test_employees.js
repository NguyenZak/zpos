const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ohmwbxwjmiyfwzmyokef.supabase.co';
const supabaseKey = 'sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking employees table...");
  const { data: emps, error: empErr } = await supabase
    .from("employees")
    .select("*")
    .limit(5);

  if (empErr) {
    console.error("Employees error:", empErr);
  } else {
    console.log("Employees:", emps);
  }
}

test();
