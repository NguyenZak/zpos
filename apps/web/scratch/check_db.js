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
  const { data: products } = await supabase.from('products').select('*').limit(2);
  console.log("Products:", products);
  
  if (products && products.length > 0) {
    const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', products[0].id);
    console.log("Variants for first product:", variants);
  }
}

check();
