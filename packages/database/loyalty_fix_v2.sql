-- ============================================================================
-- ZPOS Loyalty Fix V2 — Root Cause: Trigger + RLS blocking point persistence
-- Chạy file này trong Supabase SQL Editor để fix triệt để hệ thống tích điểm
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- ============================================================
-- PHẦN 1: FIX TRIGGER FUNCTION — SECURITY DEFINER
-- Vấn đề gốc: Trigger `update_customer_loyalty_balance()` chạy với quyền
-- của user gọi INSERT (cashier). Nhưng RLS trên bảng
-- `customer_loyalty_balances` và `customers` chặn trigger write → 
-- toàn bộ INSERT vào loyalty_transactions bị rollback → 
-- code JS fallback sang localStorage → điểm KHÔNG lưu vào DB.
--
-- Fix: SECURITY DEFINER để trigger chạy với quyền owner (bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION update_customer_loyalty_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_current_points integer;
  v_lifetime_points integer;
  v_new_tier_id uuid;
BEGIN
  -- 1. Ensure the balance row exists
  INSERT INTO customer_loyalty_balances (organization_id, customer_id, current_points, lifetime_points, updated_at)
  VALUES (NEW.organization_id, NEW.customer_id, 0, 0, now())
  ON CONFLICT (customer_id) DO NOTHING;

  -- 2. Recalculate sums from transaction history for safety and accuracy
  SELECT COALESCE(SUM(points), 0)
    INTO v_current_points
    FROM loyalty_transactions
   WHERE customer_id = NEW.customer_id;

  SELECT COALESCE(SUM(points), 0)
    INTO v_lifetime_points
    FROM loyalty_transactions
   WHERE customer_id = NEW.customer_id
     AND points > 0; -- Only positive additions count towards tier qualification

  -- 3. Determine the customer's new tier based on lifetime points
  SELECT id
    INTO v_new_tier_id
    FROM loyalty_tiers
   WHERE organization_id = NEW.organization_id
     AND min_points <= v_lifetime_points
   ORDER BY min_points DESC
   LIMIT 1;

  -- 4. Update the aggregate balance
  UPDATE customer_loyalty_balances
     SET current_points  = v_current_points,
         lifetime_points = v_lifetime_points,
         tier_id         = v_new_tier_id,
         updated_at      = now()
   WHERE customer_id = NEW.customer_id;

  -- 5. Sync points back to legacy customers.loyalty_points column
  UPDATE customers
     SET loyalty_points = v_current_points
   WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS trg_loyalty_transaction_inserted ON loyalty_transactions;
CREATE TRIGGER trg_loyalty_transaction_inserted
  AFTER INSERT ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION update_customer_loyalty_balance();

-- ============================================================
-- PHẦN 2: FIX RLS POLICIES — thêm WITH CHECK cho INSERT
-- PostgreSQL: FOR ALL USING(...) tự dùng USING làm WITH CHECK,
-- nhưng explicit hơn để đảm bảo tương thích mọi phiên bản PG.
-- ============================================================

-- loyalty_transactions: Cashier cần INSERT khi checkout
DROP POLICY IF EXISTS "loyalty_transactions_modify" ON loyalty_transactions;
CREATE POLICY "loyalty_transactions_modify" ON loyalty_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_transactions.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_transactions.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- customer_loyalty_balances: trigger ghi trực tiếp (giờ SECURITY DEFINER nên bypass RLS)
-- Nhưng vẫn cần cho app-level reads
DROP POLICY IF EXISTS "customer_loyalty_balances_modify" ON customer_loyalty_balances;
CREATE POLICY "customer_loyalty_balances_modify" ON customer_loyalty_balances FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = customer_loyalty_balances.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = customer_loyalty_balances.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- loyalty_redemptions: Cashier cần INSERT khi đổi điểm
DROP POLICY IF EXISTS "loyalty_redemptions_modify" ON loyalty_redemptions;
CREATE POLICY "loyalty_redemptions_modify" ON loyalty_redemptions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_redemptions.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_redemptions.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- loyalty_programs: Cho phép auto-seed chương trình mặc định
DROP POLICY IF EXISTS "loyalty_programs_modify" ON loyalty_programs;
CREATE POLICY "loyalty_programs_modify" ON loyalty_programs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_programs.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_programs.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- loyalty_rules
DROP POLICY IF EXISTS "loyalty_rules_modify" ON loyalty_rules;
CREATE POLICY "loyalty_rules_modify" ON loyalty_rules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_rules.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_rules.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- loyalty_tiers
DROP POLICY IF EXISTS "loyalty_tiers_modify" ON loyalty_tiers;
CREATE POLICY "loyalty_tiers_modify" ON loyalty_tiers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_tiers.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_tiers.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- loyalty_campaigns
DROP POLICY IF EXISTS "loyalty_campaigns_modify" ON loyalty_campaigns;
CREATE POLICY "loyalty_campaigns_modify" ON loyalty_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_campaigns.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = loyalty_campaigns.organization_id AND profile_id = auth.uid())
    OR auth.email() LIKE '%@zpos.click' OR auth.email() LIKE '%@zpos.vn'
  );

-- ============================================================
-- PHẦN 3: ĐẢM BẢO CỘT loyalty_points TỒN TẠI TRÊN customers
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points int DEFAULT 0;

-- ============================================================
-- PHẦN 4: SEED CHƯƠNG TRÌNH MẶC ĐỊNH (nếu chưa có)
-- ============================================================

-- Seed Loyalty Program (1 program per organization)
INSERT INTO loyalty_programs (organization_id, is_enabled, expiration_months, birthday_bonus_points, first_purchase_bonus_points)
SELECT id AS organization_id, true, 12, 50, 20
FROM organizations
ON CONFLICT (organization_id) DO UPDATE SET is_enabled = true;

-- Seed Rule: Tích điểm theo chi tiêu (10.000đ = 1 điểm)
INSERT INTO loyalty_rules (organization_id, name, rule_type, spend_amount, points_awarded, is_active)
SELECT id, 'Tích điểm chi tiêu', 'earning_spend', 10000, 1, true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_rules lr WHERE lr.organization_id = organizations.id AND lr.rule_type = 'earning_spend'
);

-- Seed Rule: Đổi điểm (100 điểm = 10.000đ, tối thiểu 50 điểm)
INSERT INTO loyalty_rules (organization_id, name, rule_type, points_required, discount_amount, min_points_to_redeem, max_discount_percentage, allow_on_discounted_orders, is_active)
SELECT id, 'Đổi điểm lấy giảm giá', 'redemption_discount', 100, 10000, 50, 30.00, false, true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_rules lr WHERE lr.organization_id = organizations.id AND lr.rule_type = 'redemption_discount'
);

-- Seed Tiers
INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Đồng (Bronze)', 0, 1.00 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Bạc (Silver)', 100, 1.20 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Vàng (Gold)', 500, 1.50 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Bạch Kim (Platinum)', 1500, 2.00 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

-- ============================================================
-- PHẦN 5: FORCE SCHEMA RELOAD + VERIFY
-- ============================================================
NOTIFY pgrst, 'reload schema';

SELECT 
  'Loyalty Fix V2 Complete!' AS status,
  (SELECT count(*) FROM loyalty_programs WHERE is_enabled = true) AS enabled_programs,
  (SELECT count(*) FROM loyalty_rules WHERE is_active = true) AS active_rules,
  (SELECT count(*) FROM loyalty_tiers) AS tiers_count,
  (SELECT prosecdef FROM pg_proc WHERE proname = 'update_customer_loyalty_balance') AS trigger_is_security_definer;
