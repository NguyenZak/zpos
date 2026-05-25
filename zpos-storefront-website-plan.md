# 🛒 ZPOS Storefront — Build Spec (AI-agent ready)

> **Định dạng**: tài liệu này được viết để AI coding agent (Antigravity, Cursor, Claude Code…) đọc và code thẳng. Mỗi task có **file path cụ thể**, **type contract**, **acceptance criteria**. Không có narrative thừa.
>
> **Mục tiêu sản phẩm**: Mỗi tenant ZPOS có 1 website bán hàng public riêng. **1 codebase render N shop khác nhau qua DATA** (block JSON + theme + feature flags trong DB), không fork code per-shop.
>
> **Scale north star**: Phase 1 chịu ~50k concurrent/tenant, ~200k toàn hệ thống. Phase 2 ~500k. Phase 3 triệu.
>
> **Khởi tạo**: 2026-05-22 · **Rewrite cho agent**: 2026-05-23 · **Trạng thái**: 🟡 Phase 1 in progress (DB + tenant resolver + route group cũ xong, đang chuyển sang `apps/storefront` riêng)

---

## 0. Quy tắc dành cho AI agent

1. **Đọc Section 1 (ADR) trước khi code bất kỳ task nào** — vi phạm ADR phải dừng, ghi proposal vào Section 12, hỏi user.
2. **Mỗi task xong**: đổi `[ ]` → `[x] (commit-hash, YYYY-MM-DD)`. KHÔNG xóa task. Bỏ task thì strikethrough `~~item~~` + lý do.
3. **Không tự ý thêm dependency mới** ngoài danh sách Section 3.1 — nếu thật cần, ghi Section 12.
4. **Mọi mutation DB phải có migration file** trong `packages/database/*.sql`, tên `YYYYMMDD_<slug>.sql`.
5. **Mọi block mới** phải có: Zod schema + component + entry trong registry + render case. Xem [packages/storefront-blocks/README.md](packages/storefront-blocks/README.md).
6. **Type contract** ở mỗi task là source of truth. Nếu signature thực tế khác, sửa task trước rồi mới code.
7. **Test sau khi build**: mỗi server action / RPC phải có ít nhất 1 happy-path test + 1 RLS leak test (anon không đọc được tenant khác).

---

## 1. Architecture Decision Records (ADR)

| #   | Quyết định                                                                                                              | Lý do                                                                                                            | Status     |
| :-- | :---------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :--------- |
| AD1 | Subdomain default `{tenant}.zshop.click`                                                                                | Tách cookie với `*.zpos.click`, SEO cleaner                                                                      | ✅ chốt    |
| AD2 | Reuse `orders` + cột `source text` (`pos`/`online`)                                                                     | Báo cáo doanh thu thống nhất                                                                                     | ✅ chốt    |
| AD3 | Tenant resolver dùng **Upstash Redis** edge-replicated + fallback Postgres                                              | Loại DB lookup trong middleware                                                                                  | ✅ chốt    |
| AD4 | Inventory reservation **Redis atomic DECR + Lua**, Postgres là ledger                                                   | Tránh `FOR UPDATE`, chịu flash sale                                                                              | ✅ chốt    |
| AD5 | Order placement = server action + RPC, queue async ở Phase 2                                                            | Phase 1 đủ nhanh                                                                                                 | ✅ chốt    |
| AD6 | SP/category/home: **SSG + on-demand `revalidateTag`**                                                                   | 90% traffic không chạm DB                                                                                        | ✅ chốt    |
| AD7 | Cart anonymous: cookie token + Redis (TTL 7d), KHÔNG bảng Postgres                                                      | Read/write < 5ms                                                                                                 | ✅ chốt    |
| AD8 | Đa branch: `organizations.default_online_branch_id`                                                                     | Đơn giản                                                                                                         | ✅ chốt    |
| AD9 | ~~Theme cứng "minimal"~~ → **block engine** (xem AD15)                                                                  | Mỗi shop nhu cầu khác — không scale theo theme cứng                                                              | ⚠️ replaced by AD15 |
| AD10 | Image: Cloudinary + Cloudflare proxy `cdn.{domain}` TTL 1 năm                                                          | Giảm 95% bandwidth                                                                                               | ✅ chốt    |
| AD11 | Custom domain Phase 1: manual add Vercel; auto-provision Phase 2 khi nâng Vercel Pro                                    | Khách yêu cầu ngay                                                                                               | ✅ chốt    |
| AD12 | Verify domain qua **TXT record** `zpos-verify=<token>`                                                                  | Chống hijack                                                                                                     | ✅ chốt    |
| AD13 | Pricing: 150k/tháng + 50k custom domain                                                                                 | Premium                                                                                                          | ✅ chốt    |
| **AD14** | **Tách `apps/storefront` ra app riêng** trong monorepo                                                              | POS = product chung, Storefront = config/UI riêng từng shop → 2 mô hình khác. Share data qua `packages/*` + RLS. | ✅ chốt 2026-05-23 |
| **AD15** | **Block-based page builder** (JSON blocks trong DB) thay vì theme cứng                                              | 1 codebase render N shop qua data. Shop owner kéo-thả không cần dev.                                             | ✅ chốt 2026-05-23 |
| **AD16** | **Feature flags per tenant** (`organizations.storefront_features jsonb`)                                            | Module bật/tắt theo shop (blog, reviews, booking…)                                                               | ✅ chốt 2026-05-23 |
| **AD17** | **Schema-first block validation** — Zod ở [packages/storefront-blocks/src/schema.ts](packages/storefront-blocks/src/schema.ts) là source of truth | Sinh form admin từ schema, validate JSON DB, block lỗi bị skip không crash trang | ✅ chốt 2026-05-23 |
| **AD18** | **BlockDataSource interface** (DI) — block không import Supabase                                                    | Package `storefront-blocks` pure, test/Storybook được, không kéo dep nặng                                        | ✅ chốt 2026-05-23 |

---

## 2. Snapshot kiến trúc (final state)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Khách hàng: bibomart.zshop.click / fashionx.com (custom domain)     │
└───────────────────────────────┬──────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Vercel Edge / CDN                                                    │
│  • SSG HTML cache (home, product, category, page) — hit rate > 90%   │
│  • Image optimization (Cloudinary origin + Cloudflare proxy)         │
└───────────┬──────────────────────────────────────┬───────────────────┘
            │ MISS                                 │ dynamic (cart/checkout)
            ▼                                      ▼
┌─────────────────────────┐              ┌─────────────────────────┐
│ Middleware (Edge)       │              │ Server Action (Node)    │
│ Resolve tenant from KV  │              │ placeOrder/cartAdd      │
│ NO DB QUERY             │              │ Calls RPC               │
└──────────┬──────────────┘              └────────┬────────────────┘
           ▼                                      │
┌──────────────────────────────────────────────────┴───────────────────┐
│ Upstash Redis                                                        │
│  tenant:slug → id (TTL 1h) │ cart:{token} (TTL 7d) │ inv:reserve:{}  │
│  domain:{host} → tenant_id │ rate-limit:{ip}        │ atomic counter  │
└──────────────────────────────────────────────────┬───────────────────┘
                                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Supabase Postgres                                                    │
│  Primary (writes): orders, order_items, inventory ledger, customers  │
│  Replica (reads): products, categories, storefront_pages             │
│  RPC create_online_order (SECURITY DEFINER, validates Redis reserv.) │
│  Trigger → webhook /api/internal/revalidate → revalidateTag          │
└──────────────────────────────────────────────────┬───────────────────┘
                                                   ▼
                                         Realtime fanout → POS admin
```

**Monorepo (final):**

```
apps/
  web/                                 # POS admin (Next.js)
    src/app/app/storefront/            # Page builder UI + settings
  storefront/                          # Public website (Next.js, AD14)
    src/
      app/
        [[...slug]]/page.tsx           # Render từ JSON blocks
        cart/page.tsx
        checkout/page.tsx
        account/orders/page.tsx
      lib/
        tenant.ts                      # Resolve subdomain → tenant
        block-data-source.ts           # Implements BlockDataSource (Supabase)
        sanitize.ts                    # rehype-sanitize cho rich-text
packages/
  database/                            # SQL migrations + types.ts
  storefront-blocks/                   # ✅ scaffolded (6 block + registry + renderer)
  commerce-core/                       # Cart, checkout, reservation logic (TODO)
  storefront-themes/                   # CSS preset theo theme (TODO)
  ui/                                  # Shadcn primitives (đã có)
```

---

## 3. Phase 1 — MVP (mục tiêu: 1 tenant chạy end-to-end)

### 3.1. Hạ tầng & dependencies cần có

| Item | Detail | Status |
| :--- | :--- | :--- |
| **I1** | Upstash Redis Global account, env `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | [ ] |
| **I2** | Domain `zshop.click` + wildcard SSL trên Vercel | [ ] |
| **I3** | Supabase Read Replica (Singapore) + env `SUPABASE_READ_REPLICA_URL` | [ ] |
| **I4** | Sentry project + DSN env | [ ] |
| **I5** | Env: `NEXT_PUBLIC_STOREFRONT_DOMAIN=zshop.click`, `STOREFRONT_REVALIDATE_TOKEN=<random>` | [ ] |
| **I6** | Dependencies: `@upstash/redis@^1.34`, `@upstash/ratelimit@^2.0`, `rehype-sanitize@^6`, `unified@^11` ở `apps/storefront/package.json` | [ ] |

### 3.2. Database migrations

**File**: [packages/database/storefront_migration.sql](packages/database/storefront_migration.sql)

- [x] **D1.** Bảng + cột storefront (tenant flags, product publish, orders.source, storefront_pages, banners, discounts)
- [x] **D2.** RPC `create_online_order(p_tenant_id, p_cart_token, p_customer, p_items, p_reservation_ids)` → `{order_id, order_number}`
- [x] **D3.** RLS: anon SELECT khi `is_published_online=true`; mutation chỉ qua RPC SECURITY DEFINER
- [x] **D4.** Trigger `revalidate_storefront_cache()` → webhook `/api/internal/revalidate?tenant=…&tags=…`
- [x] **D5.** Regenerate [packages/database/types.ts](packages/database/types.ts)

**Migration mới cho block engine (AD14-16, AD18):**

- [x] **D6.** File `packages/database/20260523_block_engine.sql`. Spec:
  ```sql
  alter table organizations
    add column if not exists storefront_theme text not null default 'minimal',
    add column if not exists storefront_features jsonb not null default '{}'::jsonb,
    add column if not exists storefront_custom_css text,
    add column if not exists storefront_custom_head text,
    add column if not exists storefront_block_whitelist jsonb not null default '[]'::jsonb;

  create table if not exists storefront_block_overrides (
    tenant_id uuid not null references organizations(id) on delete cascade,
    block_type text not null,
    props jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (tenant_id, block_type)
  );
  alter table storefront_block_overrides enable row level security;
  create policy "tenant_member_read" on storefront_block_overrides
    for select using (tenant_id = (select organization_id from profiles where id = auth.uid()));
  create policy "tenant_member_write" on storefront_block_overrides
    for all using (tenant_id = (select organization_id from profiles where id = auth.uid()));

  -- Validate features keys (whitelist enum)
  alter table organizations add constraint storefront_features_keys check (
    storefront_features ?| array['blog','reviews','multi_currency','loyalty_points','booking','table_reservation','lookbook']
    or storefront_features = '{}'::jsonb
  );
  ```
  Phải có file down: `20260523_block_engine_down.sql`.
  **Acceptance**: `pnpm --filter @zpos/database typegen` sinh lại `types.ts` không lỗi.

### 3.3. Tenant resolver (no DB in middleware)

- [x] **T1.** [apps/web/src/lib/tenant-cache.ts](apps/web/src/lib/tenant-cache.ts)
- [x] **T2.** [apps/web/src/proxy-handler.ts](apps/web/src/proxy-handler.ts) — resolve storefront host qua KV
- [x] **T3.** Hook invalidate KV khi admin update tenant

**Port sang `apps/storefront` (AD14):**

- [x] **T4.** [apps/storefront/src/lib/tenant.ts](apps/storefront/src/lib/tenant.ts) — re-export logic từ `tenant-cache.ts` qua shared package hoặc copy + giữ test parity.
  - Type contract:
    ```ts
    export type StorefrontTenant = {
      id: string
      slug: string
      name: string
      theme: string
      features: Record<string, boolean>
      customCss: string | null
      customHead: string | null
      defaultBranchId: string | null
    }
    export function resolveTenantFromHost(host: string): Promise<StorefrontTenant | null>
    ```
  - **Acceptance**: middleware không gọi Postgres (verify bằng Supabase logs); cache hit > 95% sau warm.

### 3.4. ✅ Scaffolded: `packages/storefront-blocks`

**File**: [packages/storefront-blocks/](packages/storefront-blocks/) (đã build 2026-05-23)

- [x] **B1.** `package.json` + `tsconfig.json`
- [x] **B2.** [src/schema.ts](packages/storefront-blocks/src/schema.ts) — Zod discriminated union cho 6 block
- [x] **B3.** [src/data-source.ts](packages/storefront-blocks/src/data-source.ts) — `BlockDataSource` interface (DI)
- [x] **B4.** 6 block: `hero`, `product-grid`, `category-grid`, `banner-split`, `rich-text`, `footer`
- [x] **B5.** [src/registry.ts](packages/storefront-blocks/src/registry.ts) + [src/renderer.tsx](packages/storefront-blocks/src/renderer.tsx)
- [x] **B6.** [examples/](packages/storefront-blocks/examples/) — 3 JSON sample (Bibomart, FashionX, Phở Kim Oanh)

**Còn lại:**

- [ ] **B7.** Thêm block cho Phase 1 launch (chốt ở Q7 — xem Section 12):
  - [ ] `featured-collection` (1 SP lớn + 3 SP nhỏ)
  - [ ] `testimonial` (slider review khách)
  - [ ] `image-gallery` (lookbook style)
  - [ ] `newsletter-signup` (capture email, lưu `customers` với tag `newsletter`)
  - [ ] `text-image-split` (2 cột: text + image)
  - [ ] `faq` (accordion Q&A)
- [ ] **B8.** Storybook config `packages/storefront-blocks/.storybook/` — preview block với mock dataSource.
- [ ] **B9.** Vitest: unit test `parseBlocks` (valid/invalid/partial), snapshot test mỗi block.

### 3.5. `apps/storefront` Next.js app (AD14)

- [x] **A1.** Scaffold `apps/storefront/`:
  ```
  apps/storefront/
    package.json                       # name: @zpos/storefront, deps: next@^16, react@^19, @zpos/storefront-blocks, @zpos/database, @upstash/redis, rehype-sanitize
    next.config.ts                     # images.domains: [cloudinary, cloudflare-cdn], experimental.staleTimes, runtime: 'edge' cho middleware
    tsconfig.json                      # extends base, paths "@/*": ["./src/*"]
    tailwind.config.ts                 # theme tokens riêng (KHÔNG share apps/web)
    middleware.ts                      # Resolve host → tenant → rewrite, KV-only
    src/
      app/
        layout.tsx                     # Inject theme CSS vars + custom_head + sanitized CSS
        [[...slug]]/page.tsx           # Catch-all, render từ storefront_pages
        products/[slug]/page.tsx       # Product detail (SSG + ISR via revalidateTag)
        categories/[slug]/page.tsx
        cart/page.tsx                  # Client component đọc Redis qua server action
        checkout/page.tsx
        checkout/success/[orderId]/page.tsx
        account/orders/page.tsx
        api/revalidate/route.ts        # Webhook receiver (verify STOREFRONT_REVALIDATE_TOKEN)
        sitemap.ts
        robots.ts
      lib/
        tenant.ts                      # T4
        redis.ts                       # Upstash client singleton
        block-data-source.ts           # Implements BlockDataSource (Supabase)
        sanitize.ts                    # rehype-sanitize wrapper cho rich-text
        rate-limit.ts                  # Upstash Ratelimit instances
      actions/
        cart.ts                        # cartAdd, cartRemove, cartUpdateQty
        reserve.ts                     # reserveStock (Lua atomic)
        order.ts                       # placeOrder
        lookup.ts                      # lookupOrder by phone+code
  ```
  **Acceptance**: `pnpm --filter @zpos/storefront dev` chạy port 3001, truy cập `localhost:3001` với header `x-forwarded-host: bibomart.zshop.click` ra trang Bibomart từ JSON sample.

- [x] **A2.** Implement [apps/storefront/src/lib/block-data-source.ts](apps/storefront/src/lib/block-data-source.ts):
  ```ts
  import type { BlockDataSource, ProductSummary, CategorySummary } from '@zpos/storefront-blocks'
  import { createReadClient } from '@zpos/database/read-client'

  export function createSupabaseDataSource(tenantId: string): BlockDataSource {
    const db = createReadClient()
    return {
      async getProducts(q) { /* SELECT từ products + variants, filter is_published_online */ },
      async getCategories(slugs) { /* SELECT categories với productCount aggregate */ },
    }
  }
  ```
  **Acceptance**: query về dưới 80ms p95 trên replica.

- [x] **A3.** [apps/storefront/src/app/[[...slug]]/page.tsx](apps/storefront/src/app/[[...slug]]/page.tsx):
  ```tsx
  export const revalidate = false
  export async function generateMetadata({ params }) { /* SEO từ storefront_pages.seo */ }
  export default async function Page({ params }) {
    const tenant = await getTenantFromHeaders()
    const slug = (params.slug?.join('/')) || 'home'
    const page = await loadPage(tenant.id, slug)            // tagged: tenant:{id}:page:{slug}
    if (!page) notFound()
    const dataSource = createSupabaseDataSource(tenant.id)
    const sanitizedHtmlByIndex = await sanitizeRichTextBlocks(page.blocks)
    return <BlockRenderer blocks={page.blocks} dataSource={dataSource} sanitizedHtmlByIndex={sanitizedHtmlByIndex} features={tenant.features} />
  }
  ```
  **Acceptance**: render 3 JSON sample ra HTML đúng; Lighthouse mobile > 90; LCP < 2s.

- [x] **A4.** [apps/storefront/src/app/api/revalidate/route.ts](apps/storefront/src/app/api/revalidate/route.ts) — verify token, gọi `revalidateTag(tag)` per tag trong query.

### 3.6. Cart & Order flow

- [x] **C1.** Server action `cartAdd(token, item)` — Redis `cart:{token}` TTL 7d
- [x] **C2.** `reserveStock(cart_token)` — Lua atomic, trả reservation_ids TTL 15p
- [x] **C3.** `placeOrder(...)` — gọi RPC, xóa Redis, trigger revalidate
- [x] **C4.** Cron dọn reservation expired (hourly)
- [x] **C5.** Fallback `FOR UPDATE` khi Redis down

**Port sang `apps/storefront`:**

- [x] **C6.** Move `apps/web/src/actions/cart.ts` → `apps/storefront/src/actions/cart.ts`. Acceptance: behaviorally identical, add Vitest cho `reserveStock` race (10 concurrent → đúng số reserved).

### 3.7. UI public storefront (theo block engine)

- [x] **U1.** Layout cũ (header/footer) — sẽ thay bằng theme + footer block
- [x] **U2.** Home (cũ, sẽ replace bởi `[[...slug]]/page.tsx`)
- [x] **U3.** Product list/detail (giữ — đã polish)
- [x] **U4.** Cart + Checkout page (skeleton xong)
- [x] **U5.** Cart: qty update, xóa, applyDiscount slot.
  - File: [apps/storefront/src/app/cart/page.tsx](apps/storefront/src/app/cart/page.tsx)
  - Acceptance: thay đổi qty optimistic, server action confirm < 100ms.
- [x] **U6.** Checkout: Zod form (họ tên, SĐT VN regex `/^(0|\+84)[3-9]\d{8}$/`, địa chỉ, ghi chú), payment COD.
  - File: [apps/storefront/src/app/checkout/page.tsx](apps/storefront/src/app/checkout/page.tsx)
  - Schema export: `CheckoutFormSchema` từ `commerce-core`.
- [x] **U7.** Success page: mã đơn + link tra cứu + JSON-LD `Order`.
- [x] **U8.** Tra cứu đơn `/account/orders` bằng SĐT + mã, rate-limit 20/IP/h.
- [ ] **U9.** Perf budget: LCP < 2s, CLS < 0.05, INP < 200ms, JS bundle < 150KB gzip. CI gate qua `next build` analyzer.

### 3.8. Admin: page builder + cấu hình (trong `apps/web`)

- [x] **AD1.** Menu `/app/storefront` (hiện khi `storefront_enabled=true`).
- [x] **AD2.** Tab Tổng quan (visits, orders, conversion, top SP).
- [x] **AD3.** Tab Giao diện:
  - Chọn theme từ list `packages/storefront-themes` (Phase 1: chỉ `minimal`).
  - Color tokens (CSS vars override): `--sb-cta-bg`, `--sb-radius`, `--sb-hero-fg`, `--sb-footer-bg`, `--sb-footer-fg`, `--sb-badge-bg`.
  - Logo upload (Cloudinary).
- [x] **AD4.** Tab Sản phẩm: bulk publish/unpublish, sửa `online_price`, ảnh, slug, SEO. Reuse [apps/web/src/app/app/products/](apps/web/src/app/app/products/).
- [ ] **AD5.** Tab Danh mục: thứ tự, ảnh, publish.
- [x] **AD6.** Tab **Trang nội dung (block builder)** — TRỌNG TÂM:
  - Route `/app/storefront/pages/[slug]`.
  - UI: list block ở cột trái (drag-reorder), form props ở cột phải (auto-sinh từ Zod schema), preview iframe `apps/storefront` cột giữa.
  - Library "Thêm block" dropdown từ `blockRegistry` keys.
  - Save → POST server action → ghi `storefront_pages.blocks` + invalidate KV + `revalidateTag('tenant:{id}:page:{slug}')`.
  - File chính: `apps/web/src/app/app/storefront/pages/[slug]/page-builder.tsx`.
  - **Acceptance**: tạo trang home cho tenant test, kéo 5 block, save, preview hiện đúng. Block lỗi schema bị highlight đỏ, không save được.
- [ ] **AD7.** Tab Cấu hình: hotline, social, footer mặc định, payment methods, feature flags (checkbox map `storefront_features`).
- [ ] **AD8.** Tab Domain (custom domain, xem AD11-12):
  - Hiện default URL + section addon 50k/tháng.
  - Verify flow: TXT record → Cloudflare DNS-over-HTTPS resolve → set `custom_domain_verified=true` → telegram alert admin manual add Vercel.
  - States: `inactive | pending_verification | pending_vercel_add | active | failed`.
- [ ] **AD9.** Background cron hourly: re-check TXT/CNAME, downgrade về subdomain nếu fail.

### 3.9. Đồng bộ ngược POS

- [ ] **S1.** `/app/orders` filter `source` (POS/Online/All). Badge "Online" + workflow (`pending → confirmed → packed → shipped → delivered`).
- [ ] **S2.** Cancel order → RPC `cancel_online_order` hoàn `inventory` + xóa reservation.
- [ ] **S3.** Supabase Realtime channel `tenant:{id}:orders` → toast + sound trong app POS.
- [ ] **S4.** Notification config: Zalo OA / email / browser push.

### 3.10. SEO & Performance

- [ ] **SEO1.** Sitemap per-tenant: [apps/storefront/src/app/sitemap.ts](apps/storefront/src/app/sitemap.ts), đọc từ replica.
- [ ] **SEO2.** `robots.ts` allow `/`, disallow `/cart`, `/checkout`, `/account`.
- [ ] **SEO3.** Metadata + JSON-LD: `Product`, `Organization`, `BreadcrumbList` (helper trong `commerce-core/seo.ts`).
- [ ] **SEO4.** OG image generator `/api/og?tenant=…&product=…` (Vercel OG).
- [ ] **SEO5.** Cache headers: `s-maxage=86400, stale-while-revalidate=604800` cho HTML public.
- [ ] **SEO6.** CI gate Lighthouse + bundle-size (perf budget Section 3.7 U9).

### 3.11. Bảo mật

- [ ] **SEC1.** Rate limit: `placeOrder ≤ 5/IP/h`, `lookupOrder ≤ 20/IP/h`, `cartAdd ≤ 200/IP/h`. Implementation `apps/storefront/src/lib/rate-limit.ts`.
- [ ] **SEC2.** Cloudflare Turnstile ở checkout + lookup. Env: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- [ ] **SEC3.** Zod validate mọi input server action.
- [ ] **SEC4.** Sanitize HTML rich-text qua `rehype-sanitize` (apps/storefront/src/lib/sanitize.ts).
- [ ] **SEC5.** CSP per-tenant (whitelist Google Fonts, Cloudinary, custom_head domains).
- [ ] **SEC6.** Cookie tách `.zshop.click` only.
- [ ] **SEC7.** Audit log mọi save `storefront_pages` / `storefront_settings` (reuse `audit_logs`).
- [ ] **SEC8.** SQL test cases: anon **KHÔNG** đọc được `is_published_online=false` products của tenant khác. File `packages/database/__tests__/storefront-rls.test.sql`.

### 3.12. Observability

- [ ] **O1.** Structured logging (tenant_id, action, latency, status) — wrapper `apps/storefront/src/lib/logger.ts`.
- [ ] **O2.** Metrics dashboard Grafana: cache hit rate, p50/p95/p99, error rate, Redis ops/s, DB connections.
- [ ] **O3.** Alert Sentry: cache hit rate < 80%, p95 > 500ms, error rate > 1%, DB CPU > 70%.
- [ ] **O4.** Load test trước launch: `tools/loadtest/storefront.k6.js` — 50k VU browse + 500 RPS checkout, p95 < 500ms.

---

## 4. Phase 2 — Scale + tính năng nâng cao

### 4.1. Thanh toán & vận chuyển
- [ ] **P1.** VietQR (reuse [apps/web/src/app/api/payments/](apps/web/src/app/api/payments/))
- [ ] **P2.** MoMo / ZaloPay / VNPAY
- [ ] **P3.** Webhook xác nhận → update `payment_status` + revalidate
- [ ] **SH1.** GHN/GHTK/Viettel Post — tính phí ship tại checkout (cache theo zone)
- [ ] **SH2.** Auto tạo vận đơn khi `packed`

### 4.2. Scale write path
- [ ] **SC1.** Order queue (BullMQ trên Upstash hoặc Inngest)
- [ ] **SC2.** Inventory ledger append-only + snapshot
- [ ] **SC3.** `db.read(...)` / `db.write(...)` helper trong `packages/database`
- [ ] **SC4.** Supavisor transaction pooler
- [ ] **SC5.** Vercel Edge Config cho tenant list

### 4.3. Marketing & conversion
- [ ] **M1.** Mã giảm giá (percent / fixed / first-order / category-scoped)
- [ ] **M2.** Flash sale (countdown + limit qty/user)
- [ ] **M3.** GA4 / Pixel per tenant (config admin → inject `storefront_custom_head`)
- [ ] **M4.** Email transactional (Resend) — order confirm, shipping update
- [ ] **M5.** Zalo OA template message
- [ ] **M6.** Abandoned cart recovery (Redis TTL → trigger email)

### 4.4. Auto-provision custom domain
- [ ] **CD1.** Vercel Domains API integration (yêu cầu Pro $20/mo)
- [ ] **CD2.** Auto re-issue SSL monitoring
- [ ] **CD3.** Migrate domain đã add tay sang API

### 4.5. Tài khoản khách hàng
- [ ] **AC1.** SĐT + OTP (Twilio/Vonage/Zalo OTP)
- [ ] **AC2.** Order history, saved addresses
- [ ] **AC3.** Loyalty points integration

### 4.6. Theme thứ 2 + custom block
- [ ] **TH1.** `packages/storefront-themes/fashion` (mega menu, full-bleed hero, masonry default)
- [ ] **TH2.** `packages/storefront-themes/restaurant` (menu-centric, reservation prominent)
- [ ] **CB1.** Custom block per-tenant: thư mục `packages/storefront-blocks/src/custom/{tenant-slug}/`, whitelist `organizations.storefront_block_whitelist`.

---

## 5. Phase 3 — Triệu concurrent (chỉ làm khi data trigger)

- [ ] **X1.** Multi-region active-active (Vercel + Supabase multi-region)
- [ ] **X2.** Inventory microservice (Go/Rust + Redis Cluster) — tách khỏi Postgres
- [ ] **X3.** Event-driven: Kafka/Redpanda cho order events
- [ ] **X4.** Database sharding theo tenant (Citus hoặc app-level)
- [ ] **X5.** CDN tier 2: Cloudflare Argo / Fastly
- [ ] **X6.** Đa ngôn ngữ + đa tiền tệ
- [ ] **X7.** Multi-channel sync (Shopee / TikTok Shop / Lazada)

---

## 6. Capacity & cost targets

| Layer | Phase 1 | Phase 2 | Trigger upgrade |
| :--- | :--- | :--- | :--- |
| Edge cache hit rate | > 90% | > 95% | < 85% |
| p95 public latency | < 200ms | < 100ms | > 300ms |
| p95 checkout latency | < 500ms | < 300ms | > 1s |
| Concurrent toàn hệ thống | 200k | 500k | DB CPU > 70% |
| Postgres connections | < 200 | < 800 | > 80% pool |
| Redis ops/s | < 50k | < 200k | > 70% quota |
| Orders/s peak | 500 | 5,000 | RPC latency > 1s |
| **Cost/tháng (USD)** | **~$110** | **~$1,000** | — |

---

## 7. Data flow (canonical)

### 7.1. Visitor browse (90% traffic)
```
Browser → CDN HIT → HTML (5–20ms) ✅ DONE
        ↓ MISS (10%)
   Middleware → Redis tenant cache (1ms)
        ↓
   Server Component → Supabase replica (50ms) → BlockRenderer → HTML
        ↓
   Cache-Control 24h → CDN store
```

### 7.2. Đặt hàng (1% traffic)
```
POST /actions/reserve
  → Redis Lua atomic DECR → reservation_ids (5ms)

POST /actions/place
  → RPC create_online_order (Postgres primary, ~100ms)
       ├─ Validate reservations
       ├─ INSERT orders + items
       ├─ UPDATE inventory ledger
       └─ NOTIFY → realtime fanout POS
  → Clear Redis cart + reservations
  → revalidateTag('tenant:{id}:products') (async)
  → Return { order_id, order_number }
```

### 7.3. Admin realtime
```
Postgres NOTIFY → Supabase Realtime → WS → /app/orders
  → Toast + sound + badge update
```

---

## 8. Bottleneck đã loại bỏ

| Bottleneck | Vấn đề | Fix |
| :--- | :--- | :--- |
| DB query trong middleware | DB load mỗi page view | AD3: Redis tenant cache |
| `supabase.auth.getUser()` route public | 1 RPC/request | T2: bỏ auth check route public |
| `SELECT FOR UPDATE` inventory | Serialize writes | AD4: Redis atomic reservation |
| ISR pull 60s | Cache miss spike | AD6: SSG + `revalidateTag` |
| `storefront_carts` Postgres | INSERT mỗi add-to-cart | AD7: Redis cart |
| RLS overhead public | +20-50ms/request | Cache HTML edge (RLS chỉ 10% traffic) |
| Single Postgres reads | CPU saturate | I3: read replicas |
| Theme cứng | Mỗi shop khác phải fork | AD15: block engine |
| Mỗi shop 1 codebase | Không scale | AD15+16: 1 engine + data + flags |

---

## 9. Risk register

| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| Oversell flash sale | 🔴 | Redis atomic + Lua + ledger reconciliation |
| Cache stampede revalidate | 🟡 | `revalidateTag` + `unstable_cache` per-key, TTL jitter |
| Redis down | 🟡 | Fallback Postgres mode (chậm hơn nhưng còn chạy) |
| RLS leak SP private | 🔴 | SEC8: SQL test cases CI |
| Custom domain SSL fail | 🟡 | Vercel managed + AD9 monitor |
| Cookie cross-domain | 🔴 | Tách hoàn toàn `.zshop.click` ≠ `.zpos.click` |
| Tenant abuse spam orders | 🟡 | SEC1 rate limit + Turnstile |
| Cold start tenant | 🟡 | Edge Config + SSG warm-up cron |
| **Block schema breaking change** | 🟡 | AD17: Zod parse fail-safe; migration script chuyển old → new shape |
| **Custom block bloat repo** | 🟡 | Policy: chỉ tạo khi generic block + override không đủ; review trước merge |

---

## 10. Definition of Done — Phase 1

- [ ] Tenant bật storefront từ admin → URL `{slug}.zshop.click` chạy ngay
- [ ] Khách public xem SP, thêm giỏ, đặt đơn COD thành công
- [ ] Đơn hiện realtime trong `/app/orders` với badge Online
- [ ] Block builder admin: tạo home với ≥ 5 block, save, preview đúng
- [ ] Load test k6: 50k VU browse + 500 RPS checkout giữ p95 < 500ms
- [ ] Cache hit rate > 90%
- [ ] Lighthouse mobile > 90, LCP < 2s, JS bundle < 150KB gzip
- [ ] Sentry zero P0/P1 trong 7 ngày
- [ ] RLS test PASS (anon không đọc được SP/đơn tenant khác)
- [ ] Block schema test PASS (invalid block bị skip, không crash trang)
- [ ] Documentation: [ROUTING.md](ROUTING.md) + [packages/storefront-blocks/README.md](packages/storefront-blocks/README.md) update lần cuối

---

## 11. Build order đề xuất cho AI agent

> Thứ tự dependency-aware. Mỗi bước có thể giao 1 PR. Đánh `[x]` khi merge.

1. [ ] **D6** migration block engine + types regenerate
2. [ ] **I1, I2, I5, I6** infra setup (env, domain, deps)
3. [ ] **A1** scaffold `apps/storefront` Next.js bare
4. [ ] **T4** port tenant resolver sang `apps/storefront`
5. [ ] **A2** implement `BlockDataSource` Supabase
6. [ ] **A3** wire `BlockRenderer` vào `[[...slug]]/page.tsx` + sanitize
7. [ ] **A4** revalidate webhook endpoint
8. [ ] **B7** thêm 6 block còn lại (`featured-collection`, `testimonial`, `image-gallery`, `newsletter-signup`, `text-image-split`, `faq`)
9. [ ] **B8, B9** Storybook + Vitest
10. [ ] **C6** port cart/order actions
11. [ ] **U5–U9** UI cart/checkout/lookup
12. [ ] **AD1–AD9** admin page builder + cấu hình
13. [ ] **S1–S4** đồng bộ POS
14. [ ] **SEO1–6** SEO + perf
15. [ ] **SEC1–8** bảo mật
16. [ ] **O1–O4** observability
17. [ ] **DoD** acceptance test toàn bộ

---

## 12. Open questions (cần user chốt)

- [ ] **Q1.** Domain `zshop.click` — đăng ký tài khoản nào, hay đổi tên?
- [ ] **Q2.** Budget Phase 1 ~$110/tháng OK chưa?
- [ ] **Q3.** Theme presets đầu tiên (Phase 2 TH1/TH2): "fashion" hay "restaurant" trước?
- [ ] **Q4.** Storefront bán add-on hay free cho mọi tenant?
- [ ] **Q5.** Rate limit khác biệt tenant nhỏ vs lớn — chiến lược tiering?
- [ ] **Q6.** Migration `apps/web/src/app/(storefront)/` → `apps/storefront/`: làm song song hay sau khi MVP UI hoàn tất?
- [ ] **Q7.** Block MVP launch (Section 3.4 B7): list `featured-collection`, `testimonial`, `image-gallery`, `newsletter-signup`, `text-image-split`, `faq` — đủ chưa, hay cần thêm gì?

---

## 13. Quy ước cập nhật

1. Hoàn thành item → `[x] (commit-hash, YYYY-MM-DD)` (KHÔNG xóa).
2. Bỏ item → strikethrough `~~item~~` + lý do.
3. Quyết định kiến trúc mới → ghi Section 1 (ADR) với status `chốt YYYY-MM-DD`.
4. Đổi schema DB → migration file `packages/database/YYYYMMDD_<slug>.sql` + down file + regenerate `types.ts`.
5. Commit message tag `storefront: …`.
6. Trạng thái đầu file: 🟡 Planning → 🔵 In progress → 🟢 Done → 🟣 Phase 2.

---

*Single source of truth cho ZPOS Storefront. AI agent ưu tiên đọc Section 0, 1, 11.*
*Lần rewrite: 2026-05-23 (cho block engine + apps/storefront separation).*
