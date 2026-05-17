const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: orgs } = await supabase.from('organizations').select('*');
  console.log('Organizations:', orgs);

  if (orgs && orgs.length > 0) {
    const orgId = orgs[0].id;
    const { data: members, error } = await supabase.from('organization_members').select('*');
    console.log('Members error:', error);
    console.log('Members:', members);
  }
}
check();
