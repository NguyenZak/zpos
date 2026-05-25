import { z } from 'zod'

/**
 * Schema cho từng block — dùng để:
 * 1. Validate JSON từ DB trước khi render (an toàn, không crash storefront)
 * 2. Sinh form trong page builder admin (props nào, type gì)
 * 3. Bảo vệ migration: đổi schema → biết shop nào cần migrate
 */

export const heroSchema = z.object({
  type: z.literal('hero'),
  props: z.object({
    headline: z.string().max(120),
    subheadline: z.string().max(240).optional(),
    image: z.string().url().optional(),
    video: z.string().url().optional(),
    cta: z
      .object({
        label: z.string().max(40),
        href: z.string(),
      })
      .optional(),
    align: z.enum(['left', 'center', 'right']).default('center'),
  }),
})

export const productGridSchema = z.object({
  type: z.literal('product-grid'),
  props: z.object({
    title: z.string().max(80).optional(),
    source: z.enum(['category', 'tag', 'manual', 'best-seller', 'new-arrival']),
    categorySlug: z.string().optional(),
    tag: z.string().optional(),
    productIds: z.array(z.string().uuid()).optional(),
    limit: z.number().int().min(1).max(48).default(8),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)]).default(4),
    layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
  }),
})

export const categoryGridSchema = z.object({
  type: z.literal('category-grid'),
  props: z.object({
    title: z.string().max(80).optional(),
    categorySlugs: z.array(z.string()).min(1).max(12),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)]).default(4),
    showProductCount: z.boolean().default(false),
  }),
})

export const bannerSplitSchema = z.object({
  type: z.literal('banner-split'),
  props: z.object({
    left: z.object({
      image: z.string().url(),
      headline: z.string().max(80),
      href: z.string(),
    }),
    right: z.object({
      image: z.string().url(),
      headline: z.string().max(80),
      href: z.string(),
    }),
  }),
})

export const richTextSchema = z.object({
  type: z.literal('rich-text'),
  props: z.object({
    html: z.string().max(20_000),
    maxWidth: z.enum(['narrow', 'medium', 'wide', 'full']).default('medium'),
  }),
})

export const footerSchema = z.object({
  type: z.literal('footer'),
  props: z.object({
    about: z.string().max(500).optional(),
    columns: z
      .array(
        z.object({
          title: z.string().max(40),
          links: z.array(
            z.object({
              label: z.string().max(60),
              href: z.string(),
            })
          ),
        })
      )
      .max(6)
      .default([]),
    social: z
      .array(
        z.object({
          platform: z.enum(['facebook', 'instagram', 'tiktok', 'youtube', 'zalo']),
          href: z.string(),
        })
      )
      .default([]),
    copyright: z.string().max(120).optional(),
  }),
})

/** Discriminated union — biết block.type là gì sẽ infer được props */
export const blockSchema = z.discriminatedUnion('type', [
  heroSchema,
  productGridSchema,
  categoryGridSchema,
  bannerSplitSchema,
  richTextSchema,
  footerSchema,
])

export const pageBlocksSchema = z.array(blockSchema).max(40)

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
export type BlockProps<T extends BlockType> = Extract<Block, { type: T }>['props']

/**
 * Parse JSON từ DB. Block lỗi schema bị skip (không crash trang).
 * Trả về cả `valid` (render) và `errors` (log/báo admin).
 */
export function parseBlocks(raw: unknown): {
  valid: Block[]
  errors: Array<{ index: number; error: z.ZodError }>
} {
  if (!Array.isArray(raw)) return { valid: [], errors: [] }
  const valid: Block[] = []
  const errors: Array<{ index: number; error: z.ZodError }> = []
  raw.forEach((item, index) => {
    const result = blockSchema.safeParse(item)
    if (result.success) valid.push(result.data)
    else errors.push({ index, error: result.error })
  })
  return { valid, errors }
}
