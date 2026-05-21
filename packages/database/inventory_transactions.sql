-- Create inventory_transactions table to log stock changes
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'SALE', 'IMPORT', 'ADJUSTMENT', 'LOSS', 'RETURN'
    quantity INTEGER NOT NULL, -- positive for increase, negative for decrease
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_org ON public.inventory_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant ON public.inventory_transactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);

-- RLS Policies
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions in their organization"
    ON public.inventory_transactions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Users can insert transactions in their organization"
    ON public.inventory_transactions FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()
    ));
