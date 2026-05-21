-- ============================================================================
-- ZPOS Supplier Debt Management Migration
-- Quản lý công nợ Nhà cung cấp: Nhập hàng ghi nợ, phiếu chi trả nợ NCC
-- Safe to run multiple times.
-- ============================================================================

-- 1. Cập nhật bảng suppliers: Thêm cột theo dõi tổng nợ
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS total_debt numeric(14,2) default 0;

-- 2. Cập nhật bảng purchase_orders: Thêm các cột thanh toán
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS paid_amount numeric(14,2) default 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS debt_amount numeric(14,2) default 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS due_date date;

-- Sửa constraint payment_status nếu đã có, hoặc tạo mới nếu chưa có
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'purchase_orders_payment_status_check' AND table_name = 'purchase_orders'
  ) THEN
    ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_payment_status_check;
  END IF;
  
  -- Nếu bảng chưa có cột payment_status thì thêm vào
  BEGIN
    ALTER TABLE purchase_orders ADD COLUMN payment_status text default 'unpaid';
  EXCEPTION WHEN duplicate_column THEN END;
  
  ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_payment_status_check
    CHECK (payment_status in ('unpaid', 'partial', 'paid'));
END $$;

CREATE INDEX IF NOT EXISTS idx_po_payment_status ON purchase_orders(payment_status) WHERE payment_status IN ('unpaid', 'partial');
CREATE INDEX IF NOT EXISTS idx_po_due_date ON purchase_orders(due_date) WHERE due_date IS NOT NULL;


-- 3. Tạo bảng supplier_payments (Phiếu chi trả nợ)
DROP TABLE IF EXISTS supplier_payments CASCADE;
CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  supplier_id uuid references suppliers(id) on delete cascade not null,
  payment_no text,
  amount numeric(14,2) not null,
  method text default 'cash' check (method in ('cash', 'transfer', 'card', 'other')),
  reference text,
  payment_date date default current_date,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  notes text,
  status text default 'completed' check (status in ('pending', 'completed', 'cancelled')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_org ON supplier_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date desc);

-- 4. Tạo bảng supplier_payment_allocations (Phân bổ phiếu chi vào các PO)
CREATE TABLE IF NOT EXISTS supplier_payment_allocations (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references supplier_payments(id) on delete cascade not null,
  purchase_order_id uuid references purchase_orders(id) on delete cascade not null,
  amount numeric(14,2) not null,
  created_at timestamp with time zone default now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_alloc_payment ON supplier_payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_supplier_alloc_po ON supplier_payment_allocations(purchase_order_id);


-- Bật RLS
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

-- Policies cho supplier_payments
DROP POLICY IF EXISTS "supplier_payments_all" ON supplier_payments;
CREATE POLICY "supplier_payments_all" ON supplier_payments FOR ALL USING (
  exists (select 1 from organization_members
    where organization_id = supplier_payments.organization_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'staff'))
);

-- Policies cho allocations
DROP POLICY IF EXISTS "supplier_alloc_all" ON supplier_payment_allocations;
CREATE POLICY "supplier_alloc_all" ON supplier_payment_allocations FOR ALL USING (
  exists (
    select 1 from supplier_payments p
    join organization_members om on om.organization_id = p.organization_id
    where p.id = supplier_payment_allocations.payment_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin', 'manager', 'staff')
  )
);

-- 5. RPC: record_supplier_payment — atomic: insert payment + allocations + update balance
CREATE OR REPLACE FUNCTION record_supplier_payment(
  p_supplier_id uuid,
  p_amount numeric,
  p_method text,
  p_allocations jsonb,
  p_payment_no text default null,
  p_reference text default null,
  p_notes text default null,
  p_bank_account_id uuid default null
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_supplier record;
  v_payment_id uuid;
  v_alloc jsonb;
  v_remaining numeric := p_amount;
  v_po_id uuid;
  v_alloc_amount numeric;
BEGIN
  -- Lấy thông tin supplier
  SELECT * INTO v_supplier FROM suppliers WHERE id = p_supplier_id;
  IF v_supplier.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'supplier_not_found');
  END IF;
  
  v_org_id := v_supplier.organization_id;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  -- 1. Tạo phiếu chi
  INSERT INTO supplier_payments(
    organization_id, supplier_id, payment_no, amount, method,
    reference, notes, bank_account_id, created_by
  ) VALUES (
    v_org_id, p_supplier_id,
    coalesce(p_payment_no, 'PC-' || to_char(now(), 'YYMMDD-HH24MISS')),
    p_amount, coalesce(p_method, 'cash'), p_reference, p_notes,
    p_bank_account_id, auth.uid()
  ) RETURNING id INTO v_payment_id;

  -- 2. Phân bổ tiền chi tiết nếu có truyền vào (Explicit Allocation)
  IF p_allocations IS NOT NULL AND jsonb_array_length(p_allocations) > 0 THEN
    FOR v_alloc IN SELECT value FROM jsonb_array_elements(p_allocations) LOOP
      v_po_id := (v_alloc->>'purchase_order_id')::uuid;
      v_alloc_amount := least((v_alloc->>'amount')::numeric, v_remaining);
      IF v_alloc_amount <= 0 THEN CONTINUE; END IF;
      
      INSERT INTO supplier_payment_allocations(payment_id, purchase_order_id, amount)
      VALUES (v_payment_id, v_po_id, v_alloc_amount);
      
      UPDATE purchase_orders
         SET payment_status = case
               when debt_amount - v_alloc_amount <= 0 then 'paid'
               else 'partial'
             end,
             debt_amount = greatest(debt_amount - v_alloc_amount, 0),
             paid_amount = paid_amount + v_alloc_amount
       WHERE id = v_po_id;
       
      v_remaining := v_remaining - v_alloc_amount;
    END LOOP;
  END IF;

  -- 3. Phân bổ phần tiền còn dư cho các hoá đơn nợ cũ nhất (FIFO)
  IF v_remaining > 0 THEN
    FOR v_po_id, v_alloc_amount IN
      SELECT id, debt_amount FROM purchase_orders
       WHERE supplier_id = p_supplier_id
         AND payment_status IN ('unpaid', 'partial')
         AND debt_amount > 0
       ORDER BY coalesce(due_date, created_at::date) ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_alloc_amount := least(v_alloc_amount, v_remaining);
      
      INSERT INTO supplier_payment_allocations(payment_id, purchase_order_id, amount)
      VALUES (v_payment_id, v_po_id, v_alloc_amount);
      
      UPDATE purchase_orders
         SET payment_status = case
               when debt_amount - v_alloc_amount <= 0 then 'paid'
               else 'partial'
             end,
             debt_amount = greatest(debt_amount - v_alloc_amount, 0),
             paid_amount = paid_amount + v_alloc_amount
       WHERE id = v_po_id;
       
      v_remaining := v_remaining - v_alloc_amount;
    END LOOP;
  END IF;

  -- 4. Trừ tổng nợ của Supplier (trừ đi p_amount)
  UPDATE suppliers
     SET total_debt = greatest(coalesce(total_debt, 0) - p_amount, 0)
   WHERE id = p_supplier_id;

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id
  );
END $$;

GRANT EXECUTE ON FUNCTION record_supplier_payment(uuid, numeric, text, jsonb, text, text, text, uuid) TO authenticated;


-- 6. Trigger tự động ghi nhận Nợ khi tạo PO
-- Khi PO được tạo ra, nếu tổng tiền (total_amount) > đã trả (paid_amount), ghi nhận là nợ.
-- Đồng thời cập nhật vào suppliers.total_debt.
CREATE OR REPLACE FUNCTION update_supplier_debt_on_po()
RETURNS TRIGGER AS $$
DECLARE
  v_debt numeric;
BEGIN
  -- Chỉ xét khi có thay đổi tổng tiền hoặc số tiền đã trả
  -- Hoặc khi vừa insert PO mới
  IF TG_OP = 'INSERT' THEN
    IF NEW.total_amount > coalesce(NEW.paid_amount, 0) THEN
      NEW.debt_amount := NEW.total_amount - coalesce(NEW.paid_amount, 0);
      NEW.payment_status := case when coalesce(NEW.paid_amount, 0) > 0 then 'partial' else 'unpaid' end;
      
      -- Tăng nợ tổng
      UPDATE suppliers SET total_debt = coalesce(total_debt, 0) + NEW.debt_amount WHERE id = NEW.supplier_id;
    ELSE
      NEW.debt_amount := 0;
      NEW.payment_status := 'paid';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Nếu total_amount hoặc paid_amount bị đổi (ví dụ có chiết khấu sửa sau)
    IF (NEW.total_amount != OLD.total_amount) OR (coalesce(NEW.paid_amount, 0) != coalesce(OLD.paid_amount, 0)) THEN
      NEW.debt_amount := greatest(NEW.total_amount - coalesce(NEW.paid_amount, 0), 0);
      NEW.payment_status := case 
                              when NEW.debt_amount = 0 then 'paid'
                              when coalesce(NEW.paid_amount, 0) > 0 then 'partial'
                              else 'unpaid' 
                            end;
                            
      -- Cập nhật tổng nợ (cộng nợ mới, trừ nợ cũ)
      UPDATE suppliers SET total_debt = greatest(coalesce(total_debt, 0) + NEW.debt_amount - OLD.debt_amount, 0) WHERE id = NEW.supplier_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS po_debt_trigger ON purchase_orders;
CREATE TRIGGER po_debt_trigger
  BEFORE INSERT OR UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_debt_on_po();
