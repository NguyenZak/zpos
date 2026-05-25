# Block JSON examples

3 trang chủ của 3 shop khác nhau — cùng 1 codebase render khác nhau.
Đây là dữ liệu thật sẽ lưu trong `storefront_pages.blocks jsonb`.

| Shop          | Theme        | File                       | Block dùng                                                                |
| ------------- | ------------ | -------------------------- | ------------------------------------------------------------------------- |
| Bibomart      | `minimal`    | [bibomart-home.json](./bibomart-home.json)       | hero, category-grid, product-grid, banner-split, footer                   |
| FashionX      | `fashion`    | [fashionx-home.json](./fashionx-home.json)       | hero (video), banner-split, product-grid (masonry), rich-text, footer     |
| Phở Kim Oanh  | `restaurant` | [phokimoanh-home.json](./phokimoanh-home.json)   | hero, rich-text, category-grid (menu), product-grid (signature), footer   |

## Cách dùng trong `apps/storefront`

```tsx
// app/[...slug]/page.tsx
import { BlockRenderer } from '@zpos/storefront-blocks'
import { createSupabaseDataSource } from '@/lib/block-data-source'

export default async function Page({ params }) {
  const tenant = await resolveTenant()
  const page = await loadPage(tenant.id, params.slug ?? 'home')
  const dataSource = createSupabaseDataSource(tenant.id)

  return (
    <BlockRenderer
      blocks={page.blocks}
      dataSource={dataSource}
      features={tenant.storefront_features}
    />
  )
}
```
