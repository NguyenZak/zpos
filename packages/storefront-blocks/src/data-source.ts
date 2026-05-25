/**
 * Block đọc data (product, category) qua interface này.
 * Implementation thật sống ở `apps/storefront` (gọi Supabase).
 * Tách interface để package này KHÔNG phụ thuộc Supabase → reuse được ở Storybook/test.
 */

export interface ProductSummary {
  id: string
  slug: string
  name: string
  price: number
  comparePrice?: number
  image: string
  badge?: 'new' | 'sale' | 'best-seller'
}

export interface CategorySummary {
  slug: string
  name: string
  image?: string
  productCount?: number
}

export interface BlockDataSource {
  getProducts(query: {
    source: 'category' | 'tag' | 'manual' | 'best-seller' | 'new-arrival'
    categorySlug?: string
    tag?: string
    productIds?: string[]
    limit: number
  }): Promise<ProductSummary[]>

  getCategories(slugs: string[]): Promise<CategorySummary[]>
}
