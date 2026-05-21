-- packages/database/returns_migration.sql

CREATE TABLE IF NOT EXISTS public.return_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    cashier_id UUID REFERENCES public.employees(id),
    customer_id UUID REFERENCES public.customers(id),
    return_code VARCHAR(50) NOT NULL,
    total_refund_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    refund_method VARCHAR(20) NOT NULL DEFAULT 'cash', -- cash, transfer, card
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.return_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_order_id UUID NOT NULL REFERENCES public.return_orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    quantity INT NOT NULL,
    refund_price DECIMAL(15,2) NOT NULL,
    is_restocked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.return_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view return_orders in their org" ON public.return_orders;
DROP POLICY IF EXISTS "Users can insert return_orders in their org" ON public.return_orders;
DROP POLICY IF EXISTS "Users can update return_orders in their org" ON public.return_orders;

CREATE POLICY "Users can view return_orders in their org" ON public.return_orders FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "Users can insert return_orders in their org" ON public.return_orders FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));
CREATE POLICY "Users can update return_orders in their org" ON public.return_orders FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view return_order_items in their org" ON public.return_order_items;
DROP POLICY IF EXISTS "Users can insert return_order_items in their org" ON public.return_order_items;

CREATE POLICY "Users can view return_order_items in their org" ON public.return_order_items FOR SELECT USING (return_order_id IN (SELECT id FROM public.return_orders WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid())));
CREATE POLICY "Users can insert return_order_items in their org" ON public.return_order_items FOR INSERT WITH CHECK (return_order_id IN (SELECT id FROM public.return_orders WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid())));

-- Function to handle restocking inventory when a return item is marked as is_restocked = true
CREATE OR REPLACE FUNCTION public.handle_return_item_restock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_restocked = true THEN
        IF NEW.variant_id IS NOT NULL THEN
            UPDATE public.product_variants
            SET stock = stock + NEW.quantity
            WHERE id = NEW.variant_id;
        END IF;

        UPDATE public.products
        SET stock = stock + NEW.quantity
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_handle_return_item_restock ON public.return_order_items;
CREATE TRIGGER tr_handle_return_item_restock
    AFTER INSERT ON public.return_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_return_item_restock();
