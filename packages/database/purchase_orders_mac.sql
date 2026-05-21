-- 1. Thêm cột cost_price vào order_items (để chốt cứng giá vốn lúc bán hàng)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price decimal(12,2) default 0;

-- 2. Tạo bảng Purchase Orders (Đơn nhập hàng)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  branch_id uuid references branches(id) not null,
  supplier_id uuid references suppliers(id) ON DELETE SET NULL,
  staff_id uuid references profiles(id),
  code text not null,
  status text default 'draft' check (status in ('draft', 'ordered', 'receiving', 'completed', 'cancelled')),
  subtotal decimal(12,2) not null default 0,
  discount_amount decimal(12,2) not null default 0,
  shipping_fee decimal(12,2) not null default 0,
  total_amount decimal(12,2) not null default 0,
  note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Cập nhật cột nếu bảng đã tồn tại từ trước (để đảm bảo không bị thiếu cột)
DO $$
BEGIN
    BEGIN
        ALTER TABLE purchase_orders RENAME COLUMN order_number TO code;
    EXCEPTION
        WHEN undefined_column THEN -- ignore
    END;
END $$;

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_id uuid references suppliers(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal decimal(12,2) not null default 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_amount decimal(12,2) not null default 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_fee decimal(12,2) not null default 0;

-- Drop constraint cũ và thêm constraint mới
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK (status in ('draft', 'ordered', 'receiving', 'completed', 'cancelled', 'DRAFT', 'COMPLETED', 'CANCELLED'));


-- 3. Tạo bảng Purchase Order Items (Chi tiết đơn nhập hàng)
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid references purchase_orders(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  variant_id uuid references product_variants(id),
  sku text,
  quantity int not null check (quantity > 0),
  received_quantity int not null default 0,
  unit_cost decimal(12,2) not null check (unit_cost >= 0),
  total_amount decimal(12,2) not null,
  batch_number text,
  lot_number text,
  manufactured_at timestamp with time zone,
  expired_at timestamp with time zone
);

DO $$
BEGIN
    BEGIN
        ALTER TABLE purchase_order_items RENAME COLUMN import_price TO unit_cost;
    EXCEPTION WHEN undefined_column THEN END;
    BEGIN
        ALTER TABLE purchase_order_items RENAME COLUMN total_price TO total_amount;
    EXCEPTION WHEN undefined_column THEN END;
END $$;

ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity int not null default 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS batch_number text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS lot_number text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS manufactured_at timestamp with time zone;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone;
ALTER TABLE purchase_order_items ALTER COLUMN variant_id DROP NOT NULL;

-- Bật RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Policies cơ bản
DROP POLICY IF EXISTS "Members can view purchase orders" ON purchase_orders;
CREATE POLICY "Members can view purchase orders" ON purchase_orders FOR SELECT USING (exists (select 1 from organization_members where organization_id = purchase_orders.organization_id and profile_id = auth.uid()));

DROP POLICY IF EXISTS "Members can insert purchase orders" ON purchase_orders;
CREATE POLICY "Members can insert purchase orders" ON purchase_orders FOR INSERT WITH CHECK (exists (select 1 from organization_members where organization_id = purchase_orders.organization_id and profile_id = auth.uid()));

DROP POLICY IF EXISTS "Members can update purchase orders" ON purchase_orders;
CREATE POLICY "Members can update purchase orders" ON purchase_orders FOR UPDATE USING (exists (select 1 from organization_members where organization_id = purchase_orders.organization_id and profile_id = auth.uid()));

DROP POLICY IF EXISTS "Members can view purchase order items" ON purchase_order_items;
CREATE POLICY "Members can view purchase order items" ON purchase_order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can insert purchase order items" ON purchase_order_items;
CREATE POLICY "Members can insert purchase order items" ON purchase_order_items FOR INSERT WITH CHECK (true);

-- 4. Trigger 1: Chốt giá vốn (cost_price) tự động khi bán hàng (insert order_items)
CREATE OR REPLACE FUNCTION snapshot_cost_price_on_order()
RETURNS TRIGGER AS $$
DECLARE
  current_cost_price DECIMAL(12,2);
BEGIN
  -- Lấy giá vốn hiện tại của variant
  SELECT cost_price INTO current_cost_price
  FROM product_variants
  WHERE id = NEW.variant_id;
  
  -- Gán cứng vào order_item (dù sau này giá vốn thay đổi, lợi nhuận đơn này vẫn tính theo giá này)
  NEW.cost_price := COALESCE(current_cost_price, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS snapshot_cost_price ON order_items;
CREATE TRIGGER snapshot_cost_price
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_cost_price_on_order();

-- 5. Trigger 2: Tính toán MAC (Giá vốn bình quân) và cộng tồn kho khi đơn nhập hàng hoàn tất
CREATE OR REPLACE FUNCTION update_mac_on_purchase_complete()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_global_qty INT;
  current_cost_price DECIMAL(12,2);
  new_cost_price DECIMAL(12,2);
BEGIN
  -- Chỉ chạy logic khi trạng thái đơn nhập vừa được chuyển sang 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    FOR item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id
    LOOP
      IF item.variant_id IS NOT NULL THEN
        -- Cập nhật giá vốn mới nhất (Latest Cost Price)
        new_cost_price := item.unit_cost;

        UPDATE product_variants
        SET cost_price = new_cost_price
        WHERE id = item.variant_id;
        
      ELSE
        -- Dành cho sản phẩm không có biến thể
        new_cost_price := item.unit_cost;

        UPDATE products
        SET cost_price = new_cost_price
        WHERE id = item.product_id;
      END IF;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_purchase_complete ON purchase_orders;
CREATE TRIGGER on_purchase_complete
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_mac_on_purchase_complete();
