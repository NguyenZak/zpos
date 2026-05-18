-- ============================================================================
-- ZPOS Schema Fix: Add Missing Columns & Relations to employees and payroll Tables
-- Fixes error: "column employees.organization_id does not exist"
-- Fixes error: "Could not find a relationship between 'payroll' and 'employees' in the schema cache"
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

-- 1. Add missing organization_id column to the employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Add index on organization_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_employees_organization ON employees(organization_id);

-- 3. Add foreign key relation from payroll.staff_id to employees.id
-- First drop the constraint if it already exists to avoid duplication errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payroll_staff_fk' AND table_name = 'payroll'
    ) THEN
        ALTER TABLE payroll 
        ADD CONSTRAINT payroll_staff_fk 
        FOREIGN KEY (staff_id) 
        REFERENCES employees(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Force PostgREST (Supabase API) to reload the schema cache so it recognizes the new columns and relationships instantly
NOTIFY pgrst, 'reload schema';
