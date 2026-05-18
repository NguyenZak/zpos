-- ============================================================================
-- ZPOS Schema Fix: Add Missing Columns to orders Table
-- Fixes error: "Could not find the 'discount_amount' column of 'orders' in the schema cache"
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

-- 1. Add missing core columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount decimal(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount decimal(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES profiles(id);

-- 2. Force PostgREST (Supabase API) to reload the schema cache so it recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
