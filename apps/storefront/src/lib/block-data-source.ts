import type { BlockDataSource, ProductSummary, CategorySummary } from '@zpos/storefront-blocks';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseDataSource(tenantId: string): BlockDataSource {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  return {
    async getProducts(query: {
      source: 'category' | 'tag' | 'manual' | 'best-seller' | 'new-arrival';
      categorySlug?: string;
      tag?: string;
      productIds?: string[];
      limit: number;
    }): Promise<ProductSummary[]> {
      const { source, categorySlug, tag, productIds, limit } = query;
      
      const isCategoryFilter = source === 'category' && categorySlug;
      let selectFields = 'id, name, online_price, online_images, online_slug, category_id';
      if (isCategoryFilter) {
        selectFields += ', categories(id, name)';
      }

      let q = supabase
        .from('products')
        .select(selectFields)
        .eq('organization_id', tenantId)
        .eq('is_published_online', true)
        .eq('is_active', true);

      if (isCategoryFilter && categorySlug) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categorySlug);
        if (isUuid) {
          q = q.eq('category_id', categorySlug);
        } else {
          q = q.eq('categories.name', categorySlug);
        }
      } else if (source === 'manual' && productIds && productIds.length > 0) {
        q = q.in('id', productIds);
      }

      q = q.limit(limit || 8);

      const { data, error } = await q;
      if (error) {
        console.error("Error fetching products:", error.message, error.details, error.hint);
        return [];
      }

      return (data || []).map((p: any) => ({
        id: p.id,
        slug: p.online_slug || p.id,
        name: p.name,
        price: p.online_price || 0,
        image: p.online_images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
      }));
    },
    
    async getCategories(slugs: string[]): Promise<CategorySummary[]> {
      let q = supabase
        .from('categories')
        .select('id, name, online_image_url')
        .eq('organization_id', tenantId)
        .eq('is_published_online', true);
        
      if (slugs && slugs.length > 0) {
        const uuids = slugs.filter(s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
        const names = slugs.filter(s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
        
        if (uuids.length > 0 && names.length > 0) {
          q = q.or(`id.in.(${uuids.join(',')}),name.in.(${names.map(n => `"${n}"`).join(',')})`);
        } else if (uuids.length > 0) {
          q = q.in('id', uuids);
        } else if (names.length > 0) {
          q = q.in('name', names);
        }
      }
      
      q = q.order('display_order', { ascending: true });

      const { data, error } = await q;
      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      return (data || []).map((c: any) => ({
        slug: c.id,
        name: c.name,
        image: c.online_image_url || undefined,
      }));
    }
  };
}
