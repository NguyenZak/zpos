-- ============================================================
-- FIX: orders_order_number_key constraint
-- 
-- Vấn đề: Constraint hiện tại là UNIQUE GLOBAL trên order_number
-- => 2 tenant khác nhau không thể có cùng mã đơn (ví dụ ORD-001)
-- => Sau ~16 phút, timestamp 6 số sẽ bị lặp lại
--
-- Giải pháp: Đổi thành UNIQUE (organization_id, order_number)
-- => Mỗi tổ chức có không gian số đơn riêng, không conflict với nhau
-- ============================================================

-- Step 1: Xoá constraint cũ (global unique)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_number_key;

-- Step 2: Thêm constraint mới (unique theo từng organization)
ALTER TABLE public.orders
  ADD CONSTRAINT orders_org_order_number_unique
  UNIQUE (organization_id, order_number);

-- Step 3: Tạo index để tối ưu query lookup theo order_number
CREATE INDEX IF NOT EXISTS idx_orders_org_order_number
  ON public.orders (organization_id, order_number);

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'orders' 
    AND constraint_name = 'orders_org_order_number_unique'
  ) THEN
    RAISE NOTICE 'SUCCESS: Constraint orders_org_order_number_unique đã được tạo thành công!';
  ELSE
    RAISE EXCEPTION 'FAILED: Constraint không được tạo.';
  END IF;
END $$;
