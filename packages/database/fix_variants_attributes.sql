-- Đảm bảo tất cả các cột của bảng product_variants đều tồn tại
ALTER TABLE product_variants 
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS barcode_type text,
  ADD COLUMN IF NOT EXISTS price decimal(12,2) default 0,
  ADD COLUMN IF NOT EXISTS cost_price decimal(12,2) default 0,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS attributes jsonb default '{}'::jsonb;

-- Làm mới bộ nhớ đệm (schema cache) của Supabase
NOTIFY pgrst, 'reload schema';
