# @zpos/storefront-blocks

Thư viện block tái sử dụng cho ZPOS Storefront. **1 codebase render N shop khác nhau qua JSON config trong DB.**

## Triết lý

- **Code = chung**. Data = riêng từng tenant.
- Mỗi page = mảng block JSON (lưu `storefront_pages.blocks`).
- Renderer đọc JSON → map sang component → output HTML.
- Thêm block mới = thêm 1 file vào `src/blocks/` + 1 schema + 1 entry registry. **Tất cả shop ngay lập tức có thể dùng.**

## Cấu trúc

```
src/
├── schema.ts            ← Zod schema cho từng block (validate JSON, sinh form admin)
├── data-source.ts       ← Interface lấy product/category (impl thật ở apps/storefront)
├── registry.ts          ← Map block.type → component
├── renderer.tsx         ← Server Component, parse JSON + dispatch
├── blocks/
│   ├── hero.tsx
│   ├── product-grid.tsx
│   ├── category-grid.tsx
│   ├── banner-split.tsx
│   ├── rich-text.tsx
│   └── footer.tsx
└── index.ts
examples/
├── bibomart-home.json      ← Shop mẹ & bé
├── fashionx-home.json      ← Shop thời trang (video hero, masonry grid)
└── phokimoanh-home.json    ← Shop F&B
```

## Block hiện có (Phase 1 MVP)

| Block            | Mô tả                                                              | Cần data source |
| ---------------- | ------------------------------------------------------------------ | --------------- |
| `hero`           | Banner đầu trang (image/video + headline + CTA)                    | Không           |
| `product-grid`   | Lưới sản phẩm (theo category / tag / manual / best-seller)         | ✅              |
| `category-grid`  | Lưới danh mục                                                      | ✅              |
| `banner-split`   | 2 banner cạnh nhau                                                 | Không           |
| `rich-text`      | HTML tự do (đã sanitize từ layer trên)                             | Không           |
| `footer`         | Footer site                                                        | Không           |

## Quick start

```tsx
import { BlockRenderer, type BlockDataSource } from '@zpos/storefront-blocks'

const dataSource: BlockDataSource = {
  async getProducts(query) { /* gọi Supabase */ return [] },
  async getCategories(slugs) { /* gọi Supabase */ return [] },
}

<BlockRenderer blocks={pageBlocksFromDB} dataSource={dataSource} />
```

## Thêm block mới

1. Thêm Zod schema vào `src/schema.ts`, đẩy vào `discriminatedUnion`.
2. Tạo `src/blocks/{name}.tsx` nhận `{ props: BlockProps<'name'> }`.
3. Đăng ký trong `src/registry.ts`.
4. Thêm case trong `renderBlock()` của `src/renderer.tsx`.
5. Cập nhật form builder ở `apps/web/src/app/app/storefront/pages/`.

## Custom block per-tenant (nâng cao)

Khi 1 shop lớn cần block độc nhất → tạo `src/blocks/custom/{tenant-slug}/{block-name}.tsx`, thêm flag whitelist trong DB (`organizations.storefront_block_whitelist jsonb`). Renderer skip block không có quyền.
