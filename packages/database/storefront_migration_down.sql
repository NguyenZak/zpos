-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  ROLLBACK Migration Storefront Phase 1                              ║
-- ║  Chạy file này nếu muốn undo storefront_migration.sql               ║
-- ║  ⚠️ KHÔNG xóa dữ liệu products/orders gốc — chỉ xóa cột/bảng MỚI    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

BEGIN;

-- 1. Drop RPC
DROP FUNCTION IF EXISTS create_online_order(uuid, text, jsonb, jsonb);

-- 2. Drop policies
DROP POLICY IF EXISTS "anon_read_published_products" ON products;
DROP POLICY IF EXISTS "anon_read_published_categories" ON categories;
DROP POLICY IF EXISTS "anon_read_published_pages" ON storefront_pages;
DROP POLICY IF EXISTS "anon_read_active_banners" ON storefront_banners;
DROP POLICY IF EXISTS "anon_read_published_variants" ON product_variants;

-- 3. Drop view
DROP VIEW IF EXISTS storefront_public_tenants;

-- 4. Drop bảng mới
DROP TABLE IF EXISTS domain_provision_queue;
DROP TABLE IF EXISTS storefront_discounts;
DROP TABLE IF EXISTS storefront_banners;
DROP TABLE IF EXISTS storefront_pages;

-- 5. Drop cột thêm vào orders
ALTER TABLE orders
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS customer_email,
  DROP COLUMN IF EXISTS shipping_address,
  DROP COLUMN IF EXISTS online_status,
  DROP COLUMN IF EXISTS cart_token,
  DROP COLUMN IF EXISTS note;

-- 6. Drop cột products
ALTER TABLE products
  DROP COLUMN IF EXISTS is_published_online,
  DROP COLUMN IF EXISTS online_price,
  DROP COLUMN IF EXISTS online_description,
  DROP COLUMN IF EXISTS online_images,
  DROP COLUMN IF EXISTS online_slug,
  DROP COLUMN IF EXISTS seo_title,
  DROP COLUMN IF EXISTS seo_description;

-- 7. Drop cột categories
ALTER TABLE categories
  DROP COLUMN IF EXISTS is_published_online,
  DROP COLUMN IF EXISTS online_image_url,
  DROP COLUMN IF EXISTS display_order,
  DROP COLUMN IF EXISTS seo_title,
  DROP COLUMN IF EXISTS seo_description;

-- 8. Drop cột organizations
ALTER TABLE organizations
  DROP COLUMN IF EXISTS storefront_enabled,
  DROP COLUMN IF EXISTS storefront_slug,
  DROP COLUMN IF EXISTS storefront_custom_domain,
  DROP COLUMN IF EXISTS custom_domain_verified,
  DROP COLUMN IF EXISTS custom_domain_verification_token,
  DROP COLUMN IF EXISTS custom_domain_status,
  DROP COLUMN IF EXISTS storefront_settings,
  DROP COLUMN IF EXISTS default_online_branch_id;

COMMIT;
