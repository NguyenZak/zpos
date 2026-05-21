import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(`${supabaseUrl}/rest/v1/` + '?apikey=' + supabaseKey)
  .then(res => res.json())
  .then(data => {
    const table = data.definitions.supplier_payments;
    console.log(table);
  })
  .catch(console.error);
