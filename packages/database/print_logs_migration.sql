-- Migration: Create print logs and add print permissions
-- Run this in Supabase SQL editor or via migration runner

-- Create print_logs table
CREATE TABLE IF NOT EXISTS public.print_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('temp_bill', 'kitchen_ticket', 'bar_ticket', 'final_receipt')),
    printer_id UUID, -- Optional, if printers are registered in a separate table
    printed_by UUID REFERENCES auth.users(id),
    printed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying
CREATE INDEX idx_print_logs_order_id ON public.print_logs(order_id);
CREATE INDEX idx_print_logs_organization_id ON public.print_logs(organization_id);

-- RLS policies for print_logs
ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert print_logs for their organization" ON public.print_logs
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "Users can view print_logs for their organization" ON public.print_logs
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    );

-- Add permissions to the system
INSERT INTO public.permissions (code, name, group_name, description) VALUES
    ('orders.print_temp', 'In tạm tính', 'Bán hàng', 'Cho phép in hóa đơn tạm tính'),
    ('orders.print_final', 'In hóa đơn', 'Bán hàng', 'Cho phép in hóa đơn thanh toán'),
    ('orders.print_kitchen', 'In bếp', 'Bán hàng', 'Cho phép in phiếu bếp'),
    ('orders.print_bar', 'In bar', 'Bán hàng', 'Cho phép in phiếu bar')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions to Admin and Cashier roles (assuming standard roles exist)
DO $$
DECLARE
    admin_role_id UUID;
    cashier_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE code = 'admin' LIMIT 1;
    SELECT id INTO cashier_role_id FROM public.roles WHERE code = 'cashier' LIMIT 1;

    IF admin_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_code) VALUES
            (admin_role_id, 'orders.print_temp'),
            (admin_role_id, 'orders.print_final'),
            (admin_role_id, 'orders.print_kitchen'),
            (admin_role_id, 'orders.print_bar')
        ON CONFLICT DO NOTHING;
    END IF;

    IF cashier_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_code) VALUES
            (cashier_role_id, 'orders.print_temp'),
            (cashier_role_id, 'orders.print_final'),
            (cashier_role_id, 'orders.print_kitchen'),
            (cashier_role_id, 'orders.print_bar')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
