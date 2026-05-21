ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id uuid references suppliers(id) ON DELETE SET NULL;
