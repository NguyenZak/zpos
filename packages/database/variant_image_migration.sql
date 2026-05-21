-- Add image_url column to product_variants so each SKU (e.g. a specific color)
-- can carry its own product image. Falls back to products.image_url at the UI
-- layer when a variant has no image of its own.

alter table product_variants add column if not exists image_url text;

notify pgrst, 'reload schema';
