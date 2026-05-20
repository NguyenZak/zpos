-- Add sku column to products and product_variants
-- Required because schema.sql declared `sku` but legacy databases were created without it.
-- After running, PostgREST schema cache is reloaded so the API picks the new column up immediately.

alter table products add column if not exists sku text;
alter table product_variants add column if not exists sku text;

notify pgrst, 'reload schema';
