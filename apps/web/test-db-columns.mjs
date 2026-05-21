import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('supplier_payments').select('*').limit(1);
  console.log("supplier_payments:", error ? error.message : "Exists, no error");
  
  // also check if we can select organization_id from supplier_payments
  const { data: d2, error: e2 } = await supabase.from('supplier_payments').select('organization_id').limit(1);
  console.log("supplier_payments.organization_id:", e2 ? e2.message : "Exists, no error");
}
main();
