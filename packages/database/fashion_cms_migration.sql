-- ============================================================================
-- ZPOS FASHION CMS MIGRATION (Phase 1 & Phase 2)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. COLORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS colors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  hex_code text NOT NULL,
  slug text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, name),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 2. SIZES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sizes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, name),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 3. MODIFY PRODUCT VARIANTS
-- ============================================================================
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS color_id uuid REFERENCES colors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS size_id uuid REFERENCES sizes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sale_price decimal(12,2),
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out'));

-- ============================================================================
-- 4. COLLECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  banner_image text,
  mobile_banner_image text,
  seo_title text,
  seo_description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden', 'archived')),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 5. COLLECTION PRODUCTS LINK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  UNIQUE (collection_id, product_id)
);

-- ============================================================================
-- 6. LOOKBOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lookbooks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  cover_image text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  seo_title text,
  seo_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 7. LOOKBOOK ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lookbook_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lookbook_id uuid NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text,
  description text,
  linked_product_ids jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0
);

-- ============================================================================
-- 8. CAMPAIGNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  banner_image text,
  landing_page_content jsonb DEFAULT '{}'::jsonb,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 9. CAMPAIGN PRODUCTS LINK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  UNIQUE (campaign_id, product_id)
);

-- ============================================================================
-- 10. BLOG CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 11. BLOG POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text NOT NULL,
  thumbnail text,
  tags text[] DEFAULT '{}'::text[],
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  published_at timestamp with time zone,
  seo_title text,
  seo_description text,
  og_image text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- ============================================================================
-- 12. PROMOTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value decimal(12,2) NOT NULL DEFAULT 0,
  min_order_value decimal(12,2) DEFAULT 0,
  max_discount_value decimal(12,2) DEFAULT 0,
  usage_limit integer DEFAULT 0,
  used_count integer DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, code)
);

-- ============================================================================
-- 13. PROMOTION PRODUCTS LINK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS promotion_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (promotion_id, product_id)
);

-- ============================================================================
-- 14. PROMOTION COLLECTIONS LINK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS promotion_collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  UNIQUE (promotion_id, collection_id)
);

-- ============================================================================
-- 15. SEO REDIRECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_redirects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_path text NOT NULL,
  target_path text NOT NULL,
  status_code integer DEFAULT 301 CHECK (status_code IN (301, 302)),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, source_path)
);

-- ============================================================================
-- 16. NAVIGATION MENUS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS navigation_menus (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (organization_id, location)
);

-- ============================================================================
-- 17. NAVIGATION ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id uuid NOT NULL REFERENCES navigation_menus(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES navigation_items(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('home', 'collection', 'category', 'lookbook', 'blog', 'page', 'custom_url')),
  link_target text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 18. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 19. PUBLIC READ POLICIES (for Storefront website)
-- ============================================================================
CREATE POLICY "colors_public_read" ON colors FOR SELECT TO anon USING (true);
CREATE POLICY "sizes_public_read" ON sizes FOR SELECT TO anon USING (true);
CREATE POLICY "collections_public_read" ON collections FOR SELECT TO anon USING (status = 'published' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "collection_products_public_read" ON collection_products FOR SELECT TO anon USING (true);
CREATE POLICY "lookbooks_public_read" ON lookbooks FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "lookbook_items_public_read" ON lookbook_items FOR SELECT TO anon USING (true);
CREATE POLICY "campaigns_public_read" ON campaigns FOR SELECT TO anon USING (status = 'active' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "campaign_products_public_read" ON campaign_products FOR SELECT TO anon USING (true);
CREATE POLICY "blog_categories_public_read" ON blog_categories FOR SELECT TO anon USING (true);
CREATE POLICY "blog_posts_public_read" ON blog_posts FOR SELECT TO anon USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));
CREATE POLICY "promotions_public_read" ON promotions FOR SELECT TO anon USING (status = 'active' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "promotion_products_public_read" ON promotion_products FOR SELECT TO anon USING (true);
CREATE POLICY "promotion_collections_public_read" ON promotion_collections FOR SELECT TO anon USING (true);
CREATE POLICY "navigation_menus_public_read" ON navigation_menus FOR SELECT TO anon USING (true);
CREATE POLICY "navigation_items_public_read" ON navigation_items FOR SELECT TO anon USING (true);

-- ============================================================================
-- 20. TENANT MANAGEMENT POLICIES (for CMS Admin Panel)
-- ============================================================================
CREATE POLICY "colors_tenant_all" ON colors FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "sizes_tenant_all" ON sizes FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "collections_tenant_all" ON collections FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "collection_products_tenant_all" ON collection_products FOR ALL TO authenticated USING (collection_id IN (SELECT id FROM collections WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));
CREATE POLICY "lookbooks_tenant_all" ON lookbooks FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "lookbook_items_tenant_all" ON lookbook_items FOR ALL TO authenticated USING (lookbook_id IN (SELECT id FROM lookbooks WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));
CREATE POLICY "campaigns_tenant_all" ON campaigns FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "campaign_products_tenant_all" ON campaign_products FOR ALL TO authenticated USING (campaign_id IN (SELECT id FROM campaigns WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));
CREATE POLICY "blog_categories_tenant_all" ON blog_categories FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "blog_posts_tenant_all" ON blog_posts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "promotions_tenant_all" ON promotions FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "promotion_products_tenant_all" ON promotion_products FOR ALL TO authenticated USING (promotion_id IN (SELECT id FROM promotions WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));
CREATE POLICY "promotion_collections_tenant_all" ON promotion_collections FOR ALL TO authenticated USING (promotion_id IN (SELECT id FROM promotions WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));
CREATE POLICY "seo_redirects_tenant_all" ON seo_redirects FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "navigation_menus_tenant_all" ON navigation_menus FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "navigation_items_tenant_all" ON navigation_items FOR ALL TO authenticated USING (menu_id IN (SELECT id FROM navigation_menus WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())));

COMMIT;
