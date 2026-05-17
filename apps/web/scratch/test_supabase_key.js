const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ohmwbxwjmiyfwzmyokef.supabase.co';
const supabaseKey = 'sb_publishable_80NxMg5KgsU6Old8Wwafyw_ieKxaRCp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase Connection...");
  try {
    const { data, error } = await supabase.from('organizations').select('id').limit(1);
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Supabase Success! Data:", data);
    }
  } catch (err) {
    console.error("Unexpected Exception:", err);
  }
}

test();
