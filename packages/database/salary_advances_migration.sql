CREATE TABLE IF NOT EXISTS public.salary_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    advance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT DEFAULT 'cash',
    note TEXT,
    status TEXT DEFAULT 'paid',
    payroll_id UUID REFERENCES public.payroll(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_advances_select"
ON public.salary_advances FOR SELECT
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "salary_advances_insert"
ON public.salary_advances FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "salary_advances_update"
ON public.salary_advances FOR UPDATE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

CREATE POLICY "salary_advances_delete"
ON public.salary_advances FOR DELETE
USING (organization_id = (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));
