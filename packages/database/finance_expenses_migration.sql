-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explicitly add the description column in case the table already existed without it
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Enable RLS for expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_categories
CREATE POLICY "Users can view their organization's expense categories"
ON public.expense_categories FOR SELECT
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can insert expense categories for their organization"
ON public.expense_categories FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update their organization's expense categories"
ON public.expense_categories FOR UPDATE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can delete their organization's expense categories"
ON public.expense_categories FOR DELETE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Users can view their organization's expenses"
ON public.expenses FOR SELECT
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can insert expenses for their organization"
ON public.expenses FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update their organization's expenses"
ON public.expenses FOR UPDATE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can delete their organization's expenses"
ON public.expenses FOR DELETE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));


-- Create recurring_expenses table
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
    start_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    auto_create BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active', -- active, paused
    last_processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for recurring_expenses
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_expenses
CREATE POLICY "Users can view their organization's recurring expenses"
ON public.recurring_expenses FOR SELECT
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can insert recurring expenses for their organization"
ON public.recurring_expenses FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can update their organization's recurring expenses"
ON public.recurring_expenses FOR UPDATE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "Users can delete their organization's recurring expenses"
ON public.recurring_expenses FOR DELETE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

-- Insert some default categories
-- Note: These might need organization_id in a real multi-tenant setup, or we allow NULL for global defaults.
-- Since the getExpenseCategories query is `.or('organization_id.eq.${orgId},organization_id.is.null')`, we can insert global categories with NULL organization_id.
INSERT INTO public.expense_categories (name, description) VALUES
('Tiền điện', 'Chi phí tiền điện hàng tháng'),
('Tiền nước', 'Chi phí tiền nước hàng tháng'),
('Mặt bằng', 'Chi phí thuê mặt bằng'),
('Lương nhân viên', 'Chi trả lương nhân viên'),
('Marketing', 'Chi phí quảng cáo, tiếp thị'),
('Nhập hàng', 'Chi phí mua nguyên vật liệu, hàng hóa'),
('Khác', 'Các khoản chi phí khác')
ON CONFLICT DO NOTHING;
