-- ============================================================================
-- ZPOS Sales Commission Rules Migration
-- Defines rules for automatic bonuses based on sales revenue.
-- ============================================================================

CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_revenue numeric(14,2) DEFAULT 0,
  commission_percentage numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_org ON commission_rules(organization_id);

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commission_rules_select" ON commission_rules;
CREATE POLICY "commission_rules_select" ON commission_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members
    WHERE organization_id = commission_rules.organization_id AND profile_id = auth.uid())
);

DROP POLICY IF EXISTS "commission_rules_modify" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_insert" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_update" ON commission_rules;
DROP POLICY IF EXISTS "commission_rules_delete" ON commission_rules;

CREATE POLICY "commission_rules_insert" ON commission_rules FOR INSERT
WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())
);

CREATE POLICY "commission_rules_update" ON commission_rules FOR UPDATE
USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())
);

CREATE POLICY "commission_rules_delete" ON commission_rules FOR DELETE
USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE profile_id = auth.uid())
);

NOTIFY pgrst, 'reload schema';
