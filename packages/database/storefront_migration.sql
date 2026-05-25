-- ============================================================================
-- ZPOS STOREFRONT MIGRATION (Phase 1 — MVP)
-- ============================================================================
-- An toàn để chạy trên Supabase production hiện tại:
-- - CHỈ THÊM cột mới (có DEFAULT) → row cũ tự động fill, KHÔNG cần update
-- - CHỈ THÊM bảng mới → KHÔNG đụng bảng cũ
-- - Tất cả storefront_enabled mặc định = false → POS hiện tại KHÔNG ảnh hưởng
-- - RLS policy thêm mới, KHÔNG sửa policy cũ
--
-- Chạy thử trên Supabase SQL Editor:
--   1. Backup trước (bằng GitHub Actions hoặc Dashboard → Backup)
--   2. Paste toàn bộ file → Run
--   3. Verify không có error
--   4. Test app POS hiện tại vẫn chạy bình thường
--
-- Rollback nếu cần (xem cuối file)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ORGANIZATIONS — thêm cột storefront
-- ============================================================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS storefront_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS storefront_slug text,
  ADD COLUMN IF NOT EXISTS storefront_custom_domain text,
  ADD COLUMN IF NOT EXISTS custom_domain_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token text,
  ADD COLUMN IF NOT EXISTS custom_domain_status text DEFAULT 'inactive'
    CHECK (custom_domain_status IN ('inactive','pending_verification','pending_vercel_add','active','failed')),
  ADD COLUMN IF NOT EXISTS storefront_settings jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS default_online_branch_id uuid REFERENCES branches(id);

DO $$ BEGIN
  ALTER TABLE organizations ADD CONSTRAINT organizations_storefront_slug_key UNIQUE (storefront_slug);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE organizations ADD CONSTRAINT organizations_storefront_custom_domain_key UNIQUE (storefront_custom_domain);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- Auto-fill storefront_slug = slug cho tenant cũ
UPDATE organizations SET storefront_slug = slug WHERE storefront_slug IS NULL;

-- ============================================================================
-- 2. PRODUCTS — thêm cột online
-- ============================================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_published_online boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_price decimal(12,2),
  ADD COLUMN IF NOT EXISTS online_description text,
  ADD COLUMN IF NOT EXISTS online_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS online_slug text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS size_guide text,
  ADD COLUMN IF NOT EXISTS is_new_arrival boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_published_online
  ON products (organization_id, is_published_online)
  WHERE is_published_online = true;

CREATE INDEX IF NOT EXISTS idx_products_online_slug
  ON products (organization_id, online_slug)
  WHERE online_slug IS NOT NULL;

-- ============================================================================
-- 3. CATEGORIES — thêm cột online
-- ============================================================================
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_published_online boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_image_url text,
  ADD COLUMN IF NOT EXISTS display_order int DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_published_online
  ON categories (organization_id, is_published_online)
  WHERE is_published_online = true;

-- ============================================================================
-- 4. ORDERS — thêm cột source + online fields
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'pos'
    CHECK (source IN ('pos','online')),
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS online_status text
    CHECK (online_status IN ('pending','confirmed','packed','shipped','delivered','cancelled')),
  ADD COLUMN IF NOT EXISTS cart_token text,
  ADD COLUMN IF NOT EXISTS customer_note text;

CREATE INDEX IF NOT EXISTS idx_orders_source_created
  ON orders (organization_id, source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_online_status
  ON orders (organization_id, online_status)
  WHERE source = 'online';

-- ============================================================================
-- 5. STOREFRONT_PAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS storefront_pages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT false,
  seo_title text,
  seo_description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_storefront_pages_published
  ON storefront_pages (organization_id, is_published)
  WHERE is_published = true;

-- ============================================================================
-- 6. STOREFRONT_BANNERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS storefront_banners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text,
  image_url text NOT NULL,
  link_url text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storefront_banners_active
  ON storefront_banners (organization_id, is_active, display_order)
  WHERE is_active = true;

-- ============================================================================
-- 7. CUSTOM_DOMAIN_PROVISION_QUEUE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_domain_provision_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','vercel_added','active','failed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  handled_at timestamptz,
  handled_by uuid REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_domain_queue_status
  ON custom_domain_provision_queue (status, created_at);

-- ============================================================================
-- 8. RPC: create_online_order — atomic order placement
-- ============================================================================
CREATE OR REPLACE FUNCTION create_online_order(
  p_org_id uuid,
  p_cart_token text,
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text DEFAULT 'cod'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_customer_id uuid;
  v_item jsonb;
  v_variant_id uuid;
  v_qty int;
  v_unit_price decimal(12,2);
  v_total decimal(12,2) := 0;
  v_available int;
BEGIN
  SELECT default_online_branch_id INTO v_branch_id
  FROM organizations WHERE id = p_org_id;

  IF v_branch_id IS NULL THEN
    SELECT id INTO v_branch_id FROM branches
    WHERE organization_id = p_org_id AND is_main_branch = true LIMIT 1;
  END IF;

  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'No branch configured for online orders';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    v_unit_price := (v_item->>'unit_price')::decimal;

    SELECT quantity INTO v_available
    FROM inventory
    WHERE branch_id = v_branch_id AND variant_id = v_variant_id
    FOR UPDATE;

    IF v_available IS NULL OR v_available < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id
        USING ERRCODE = 'P0001';
    END IF;

    v_total := v_total + (v_qty * v_unit_price);
  END LOOP;

  INSERT INTO customers (organization_id, name, phone, email, address)
  VALUES (p_org_id, p_customer->>'name', p_customer->>'phone',
          p_customer->>'email', p_customer->>'address')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer_id;

  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id FROM customers
    WHERE organization_id = p_org_id AND phone = p_customer->>'phone' LIMIT 1;
  END IF;

  v_order_number := 'WEB-' || to_char(now(), 'YYMMDD') || '-' ||
    lpad((floor(random() * 100000))::text, 5, '0');

  INSERT INTO orders (
    organization_id, branch_id, customer_id, order_number,
    source, online_status, payment_method,
    customer_email, shipping_address, customer_note,
    cart_token, total_amount, status
  ) VALUES (
    p_org_id, v_branch_id, v_customer_id, v_order_number,
    'online', 'pending', p_payment_method,
    p_customer->>'email',
    jsonb_build_object('name', p_customer->>'name',
                       'phone', p_customer->>'phone',
                       'address', p_customer->>'address'),
    p_customer->>'note',
    p_cart_token, v_total, 'pending'
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    v_unit_price := (v_item->>'unit_price')::decimal;

    INSERT INTO order_items (order_id, variant_id, quantity, unit_price, subtotal)
    VALUES (v_order_id, v_variant_id, v_qty, v_unit_price, v_qty * v_unit_price);

    UPDATE inventory
    SET quantity = quantity - v_qty, updated_at = now()
    WHERE branch_id = v_branch_id AND variant_id = v_variant_id;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_online_order TO anon, authenticated;

-- ============================================================================
-- 9. RLS POLICIES — public read cho storefront
-- ============================================================================
DROP POLICY IF EXISTS "storefront_public_read_products" ON products;
CREATE POLICY "storefront_public_read_products" ON products
  FOR SELECT TO anon
  USING (is_published_online = true);

DROP POLICY IF EXISTS "storefront_public_read_categories" ON categories;
CREATE POLICY "storefront_public_read_categories" ON categories
  FOR SELECT TO anon
  USING (is_published_online = true);

ALTER TABLE storefront_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "storefront_public_read_pages" ON storefront_pages;
CREATE POLICY "storefront_public_read_pages" ON storefront_pages
  FOR SELECT TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "storefront_tenant_manage_pages" ON storefront_pages;
CREATE POLICY "storefront_tenant_manage_pages" ON storefront_pages
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()
  ));

ALTER TABLE storefront_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "storefront_public_read_banners" ON storefront_banners;
CREATE POLICY "storefront_public_read_banners" ON storefront_banners
  FOR SELECT TO anon
  USING (is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now()));

DROP POLICY IF EXISTS "storefront_tenant_manage_banners" ON storefront_banners;
CREATE POLICY "storefront_tenant_manage_banners" ON storefront_banners
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()
  ));

DROP POLICY IF EXISTS "storefront_public_read_org_info" ON organizations;
CREATE POLICY "storefront_public_read_org_info" ON organizations
  FOR SELECT TO anon
  USING (storefront_enabled = true);

ALTER TABLE custom_domain_provision_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. TRIGGERS: revalidate_storefront_cache
-- ============================================================================
CREATE OR REPLACE FUNCTION revalidate_storefront_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
  v_webhook_url text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
  ELSE
    v_org_id := NEW.organization_id;
  END IF;

  -- Bỏ qua nếu webhook url chưa có trong app settings
  v_webhook_url := current_setting('app.settings.storefront_webhook_url', true);
  
  IF v_webhook_url IS NOT NULL THEN
    -- Gọi pg_net, phớt lờ lỗi nếu không bật pg_net
    BEGIN
      PERFORM net.http_post(
        url := v_webhook_url || '?tenant=' || v_org_id || '&tags=products,categories,storefront',
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore
    END;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_revalidate_products ON products;
CREATE TRIGGER trg_revalidate_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION revalidate_storefront_cache();

DROP TRIGGER IF EXISTS trg_revalidate_categories ON categories;
CREATE TRIGGER trg_revalidate_categories
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION revalidate_storefront_cache();

DROP TRIGGER IF EXISTS trg_revalidate_pages ON storefront_pages;
CREATE TRIGGER trg_revalidate_pages
  AFTER INSERT OR UPDATE OR DELETE ON storefront_pages
  FOR EACH ROW EXECUTE FUNCTION revalidate_storefront_cache();

COMMIT;
-- ============================================================================
-- VERIFY (chạy sau migration)
-- ============================================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name='organizations' AND column_name LIKE 'storefront%';
-- SELECT count(*) FROM organizations WHERE storefront_slug IS NULL;  -- phải = 0

-- ============================================================================
-- ROLLBACK (nếu cần)
-- ============================================================================
-- DROP FUNCTION IF EXISTS create_online_order;
-- DROP TABLE IF EXISTS custom_domain_provision_queue;
-- DROP TABLE IF EXISTS storefront_banners;
-- DROP TABLE IF EXISTS storefront_pages;
-- ALTER TABLE orders DROP COLUMN IF EXISTS source, DROP COLUMN IF EXISTS customer_email,
--   DROP COLUMN IF EXISTS shipping_address, DROP COLUMN IF EXISTS online_status,
--   DROP COLUMN IF EXISTS cart_token, DROP COLUMN IF EXISTS customer_note;
-- ALTER TABLE products DROP COLUMN IF EXISTS is_published_online, ...;
-- ALTER TABLE categories DROP COLUMN IF EXISTS is_published_online, ...;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS storefront_enabled, ...;
