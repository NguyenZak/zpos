-- ============================================================================
-- ZPOS Loyalty Seed Script
-- Chạy sau khi đã chạy loyalty_migration.sql
-- Tự động tạo loyalty program + default rules + tiers cho mọi organization
-- Safe to run multiple times (idempotent via ON CONFLICT DO NOTHING)
-- ============================================================================

-- 1. Seed default Loyalty Program cho mỗi organization
INSERT INTO loyalty_programs (organization_id, is_enabled, expiration_months, birthday_bonus_points, first_purchase_bonus_points)
SELECT
  id AS organization_id,
  true,  -- is_enabled
  12,    -- expiration_months
  50,    -- birthday_bonus_points
  20     -- first_purchase_bonus_points
FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- 2. Seed default Loyalty Rules (Tích điểm chi tiêu: 10.000đ = 1 điểm)
INSERT INTO loyalty_rules (organization_id, name, rule_type, spend_amount, points_awarded, is_active)
SELECT
  id AS organization_id,
  'Tích điểm chi tiêu' AS name,
  'earning_spend' AS rule_type,
  10000 AS spend_amount,
  1 AS points_awarded,
  true AS is_active
FROM organizations
ON CONFLICT DO NOTHING;

-- 3. Seed default Loyalty Rules (Thưởng cố định mỗi hóa đơn: +1 điểm)
INSERT INTO loyalty_rules (organization_id, name, rule_type, points_awarded, is_active)
SELECT
  id AS organization_id,
  'Thưởng hóa đơn' AS name,
  'earning_order' AS rule_type,
  0 AS points_awarded,  -- Tắt mặc định, admin bật nếu muốn
  false AS is_active
FROM organizations
ON CONFLICT DO NOTHING;

-- 4. Seed default Loyalty Rules (Đổi điểm: 100 điểm = 10.000đ)
INSERT INTO loyalty_rules (organization_id, name, rule_type, points_required, discount_amount, min_points_to_redeem, max_discount_percentage, allow_on_discounted_orders, is_active)
SELECT
  id AS organization_id,
  'Đổi điểm lấy giảm giá' AS name,
  'redemption_discount' AS rule_type,
  100 AS points_required,
  10000 AS discount_amount,
  50 AS min_points_to_redeem,
  30.00 AS max_discount_percentage,
  false AS allow_on_discounted_orders,
  true AS is_active
FROM organizations
ON CONFLICT DO NOTHING;

-- 5. Seed default Loyalty Tiers
INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Đồng (Bronze)', 0, 1.00 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Bạc (Silver)', 100, 1.20 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Vàng (Gold)', 500, 1.50 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

INSERT INTO loyalty_tiers (organization_id, name, min_points, points_multiplier)
SELECT id, 'Bạch Kim (Platinum)', 1500, 2.00 FROM organizations ON CONFLICT (organization_id, name) DO NOTHING;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

SELECT 'Loyalty seed completed successfully.' AS result;
