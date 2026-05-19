-- ============================================================================
-- ZPOS Database Healing: Fix Customers Schema and Add Missing RLS Policies
-- Resolves customer query 400 Bad Request & foreign key violations on orders
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

-- 1. Make sure the customers table exists at all (legacy installs may not have it)
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 1a. Add organization_id column (root cause of error 42703 was: this column missing)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 1b. Backfill from legacy "tenant_id" column if a prior schema used that name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tenant_id'
  ) THEN
    UPDATE customers
       SET organization_id = tenant_id
     WHERE organization_id IS NULL AND tenant_id IS NOT NULL;
  END IF;
END $$;

-- 1c. Backfill remaining NULL rows to the first organization, so the rows
--     remain visible to that tenant instead of becoming orphaned.
DO $$
DECLARE
  v_fallback uuid;
  v_remaining int;
BEGIN
  SELECT id INTO v_fallback FROM organizations ORDER BY created_at LIMIT 1;
  IF v_fallback IS NOT NULL THEN
    UPDATE customers SET organization_id = v_fallback WHERE organization_id IS NULL;
  END IF;
  SELECT count(*) INTO v_remaining FROM customers WHERE organization_id IS NULL;
  IF v_remaining = 0 THEN
    BEGIN
      ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not set NOT NULL on organization_id: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'customers: % rows still have NULL organization_id', v_remaining;
  END IF;
END $$;

-- 1d. Foreign key (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'customers' AND constraint_name = 'customers_organization_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE customers
        ADD CONSTRAINT customers_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add FK customers_organization_id_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- 1e. Make sure other expected columns exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points int DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zalo_user_id text;

-- 1f. Migrate legacy `points` column → `loyalty_points`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'points'
  ) THEN
    UPDATE customers SET loyalty_points = COALESCE(points, 0) WHERE loyalty_points = 0;
  END IF;
END $$;

-- 2. Scoped unique constraints and performance indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);

-- 2a. Safety: make sure other base tables also have organization_id.
-- If a legacy DB used `tenant_id`, copy it over so policies/queries still work.
DO $$
DECLARE
  v_table text;
  v_fallback uuid;
BEGIN
  SELECT id INTO v_fallback FROM organizations ORDER BY created_at LIMIT 1;
  FOREACH v_table IN ARRAY ARRAY['orders', 'branches', 'categories', 'products', 'inventory']
  LOOP
    -- Skip if the table doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = v_table AND table_schema = 'public'
    ) THEN
      CONTINUE;
    END IF;

    -- Add organization_id if it's missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = v_table AND column_name = 'organization_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN organization_id uuid', v_table);

      -- Backfill from tenant_id if available
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = v_table AND column_name = 'tenant_id'
      ) THEN
        EXECUTE format(
          'UPDATE %I SET organization_id = tenant_id WHERE organization_id IS NULL',
          v_table
        );
      END IF;

      -- Backfill remaining NULL → first organization
      IF v_fallback IS NOT NULL THEN
        EXECUTE format(
          'UPDATE %I SET organization_id = %L WHERE organization_id IS NULL',
          v_table, v_fallback
        );
      END IF;

      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%I_organization ON %I(organization_id)',
        v_table, v_table
      );
      RAISE NOTICE 'Added organization_id to %', v_table;
    END IF;
  END LOOP;
END $$;

-- 3. Enable RLS + canonical policies for every base table that EXISTS.
--    Wrapped in DO blocks so a missing table is just skipped (not fatal).

DO $$
DECLARE
  v_table text;
  v_tables_org text[] := ARRAY['customers', 'orders', 'branches', 'categories', 'products', 'inventory'];
  v_old_policies text[] := ARRAY[
    'Customers select policy', 'Customers insert policy', 'Customers update policy', 'Customers delete policy',
    'Orders select policy', 'Orders insert policy', 'Orders update policy', 'Orders delete policy',
    'Order items select policy',
    'Members can view customers', 'Members can manage customers',
    'Members can view orders', 'Members can manage orders',
    'Members can view branches', 'Members can manage branches',
    'Members can view categories', 'Members can manage categories',
    'Members can view products', 'Members can manage products',
    'Members can view inventory', 'Members can manage inventory'
  ];
  v_policy text;
BEGIN
  FOREACH v_table IN ARRAY v_tables_org LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      RAISE NOTICE 'Skipping % — table does not exist', v_table;
      CONTINUE;
    END IF;

    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_table);

    -- Drop legacy/duplicate policies (best-effort).
    -- Use %I for the policy name — identifiers with spaces need double quotes,
    -- not single quotes (which is what %L would produce).
    FOREACH v_policy IN ARRAY v_old_policies LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', v_policy, v_table);
    END LOOP;

    -- Create canonical SELECT + ALL policies
    EXECUTE format($f$
      CREATE POLICY "Members can view %1$s" ON %1$I FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = %1$I.organization_id
            AND organization_members.profile_id = auth.uid()
        )
        OR auth.email() LIKE %2$L
        OR auth.email() LIKE %3$L
      )
    $f$, v_table, '%@zpos.click', '%@zpos.vn');

    EXECUTE format($f$
      CREATE POLICY "Members can manage %1$s" ON %1$I FOR ALL USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = %1$I.organization_id
            AND organization_members.profile_id = auth.uid()
        )
        OR auth.email() LIKE %2$L
        OR auth.email() LIKE %3$L
      )
    $f$, v_table, '%@zpos.click', '%@zpos.vn');

    RAISE NOTICE 'RLS enabled + policies created for %', v_table;
  END LOOP;
END $$;

-- 3a. order_items joins to orders to derive the tenant — handle separately.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order_items'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    EXECUTE 'ALTER TABLE order_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Members can view order items" ON order_items';
    EXECUTE 'DROP POLICY IF EXISTS "Members can manage order items" ON order_items';
    EXECUTE 'DROP POLICY IF EXISTS "Order items select policy" ON order_items';

    EXECUTE $f$
      CREATE POLICY "Members can view order items" ON order_items FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM orders
          JOIN organization_members ON orders.organization_id = organization_members.organization_id
          WHERE orders.id = order_items.order_id
            AND organization_members.profile_id = auth.uid()
        )
        OR auth.email() LIKE '%@zpos.click'
        OR auth.email() LIKE '%@zpos.vn'
      )
    $f$;

    EXECUTE $f$
      CREATE POLICY "Members can manage order items" ON order_items FOR ALL USING (
        EXISTS (
          SELECT 1 FROM orders
          JOIN organization_members ON orders.organization_id = organization_members.organization_id
          WHERE orders.id = order_items.order_id
            AND organization_members.profile_id = auth.uid()
        )
        OR auth.email() LIKE '%@zpos.click'
        OR auth.email() LIKE '%@zpos.vn'
      )
    $f$;
    RAISE NOTICE 'RLS + policies set on order_items';
  ELSE
    RAISE NOTICE 'Skipping order_items — table missing';
  END IF;
END $$;

-- 3b. product_variants derives the tenant via its parent product.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_variants'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    EXECUTE 'ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Members can view product variants" ON product_variants';
    EXECUTE 'DROP POLICY IF EXISTS "Members can manage product variants" ON product_variants';

    EXECUTE $f$
      CREATE POLICY "Members can view product variants" ON product_variants FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM products
          JOIN organization_members ON products.organization_id = organization_members.organization_id
          WHERE products.id = product_variants.product_id
            AND organization_members.profile_id = auth.uid()
        )
        OR auth.email() LIKE '%@zpos.click'
        OR auth.email() LIKE '%@zpos.vn'
      )
    $f$;

    EXECUTE $f$
      CREATE POLICY "Members can manage product variants" ON product_variants FOR ALL USING (
        EXISTS (
          SELECT 1 FROM products
          JOIN organization_members ON products.organization_id = organization_members.organization_id
          WHERE products.id = product_variants.product_id
            AND organization_members.profile_id = auth.uid()
        )
        OR auth.email() LIKE '%@zpos.click'
        OR auth.email() LIKE '%@zpos.vn'
      )
    $f$;
    RAISE NOTICE 'RLS + policies set on product_variants';
  ELSE
    RAISE NOTICE 'Skipping product_variants — table missing';
  END IF;
END $$;

-- 4. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
