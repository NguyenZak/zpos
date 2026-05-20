-- ============================================================================
-- ZPOS Print Logs Migration & Fix
-- Chạy TOÀN BỘ file này trong Supabase SQL Editor
-- ============================================================================

-- 1. Tạo bảng print_logs (nếu chưa có)
CREATE TABLE IF NOT EXISTS public.print_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('temp_bill', 'kitchen_ticket', 'bar_ticket', 'final_receipt')),
    printer_id UUID,
    printed_by UUID REFERENCES auth.users(id),
    printed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Đánh index để truy vấn nhanh 
CREATE INDEX IF NOT EXISTS idx_print_logs_order_id ON public.print_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_logs_organization_id ON public.print_logs(organization_id);

-- 3. Bật RLS
ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;

-- 4. Sử dụng PL/pgSQL với EXECUTE để vượt qua bước kiểm tra cú pháp của Supabase khi bảng chưa tồn tại
DO $$ 
BEGIN
    -- Xoá policy cũ an toàn 
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert print_logs for their organization" ON public.print_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view print_logs for their organization" ON public.print_logs';
    
    -- Tạo policy mới
    EXECUTE 'CREATE POLICY "Users can insert print_logs for their organization" ON public.print_logs
        FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = print_logs.organization_id AND profile_id = auth.uid())
            OR auth.email() LIKE ''%@zpos.click'' 
            OR auth.email() LIKE ''%@zpos.vn''
        )';

    EXECUTE 'CREATE POLICY "Users can view print_logs for their organization" ON public.print_logs
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = print_logs.organization_id AND profile_id = auth.uid())
            OR auth.email() LIKE ''%@zpos.click'' 
            OR auth.email() LIKE ''%@zpos.vn''
        )';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Có lỗi khi tạo policy: %', SQLERRM;
END $$;

-- 5. Cấp quyền (Nếu thiếu)
INSERT INTO public.permissions (id, key, module, action, name, group_name, description) VALUES
    ('orders.print_temp', 'orders.print_temp', 'orders', 'print_temp', 'In tạm tính', 'Đơn hàng', 'Cho phép in hóa đơn tạm tính'),
    ('orders.print_final', 'orders.print_final', 'orders', 'print_final', 'In hóa đơn thanh toán', 'Đơn hàng', 'Cho phép in hóa đơn thanh toán'),
    ('orders.print_kitchen', 'orders.print_kitchen', 'orders', 'print_kitchen', 'In phiếu bếp', 'Đơn hàng', 'Cho phép in phiếu bếp'),
    ('orders.print_bar', 'orders.print_bar', 'orders', 'print_bar', 'In phiếu bar', 'Đơn hàng', 'Cho phép in phiếu bar')
ON CONFLICT (id) DO UPDATE SET name = excluded.name;

-- 6. Tải lại schema cache của Supabase
NOTIFY pgrst, 'reload schema';
