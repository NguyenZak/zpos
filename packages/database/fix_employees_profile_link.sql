-- ZPOS Schema Fix: Link employees rows to auth profile
-- Fixes error: "Could not find the 'profile_id' column of 'employees' in the schema cache"
-- The staff provisioning API (apps/web/src/app/api/tenant/staff/route.ts) writes profile_id
-- on employees so the legacy table can be joined back to organization_members/profiles.

-- 1. Add profile_id column (nullable so legacy rows survive the migration)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Index to speed up profile <-> employee lookups
CREATE INDEX IF NOT EXISTS idx_employees_profile ON employees(profile_id);

-- 3. Force PostgREST to refresh its schema cache so the new column is visible immediately
NOTIFY pgrst, 'reload schema';
