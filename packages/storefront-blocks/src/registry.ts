import type { BlockType } from './schema'
import { HeroBlock } from './blocks/hero'
import { ProductGridBlock } from './blocks/product-grid'
import { CategoryGridBlock } from './blocks/category-grid'
import { BannerSplitBlock } from './blocks/banner-split'
import { RichTextBlock } from './blocks/rich-text'
import { FooterBlock } from './blocks/footer'

/**
 * Đăng ký tất cả block. Thêm block mới = thêm 1 entry ở đây.
 * Component nhận `{ props, dataSource?, sanitizedHtml? }` tùy block.
 */
export const blockRegistry = {
  'hero': HeroBlock,
  'product-grid': ProductGridBlock,
  'category-grid': CategoryGridBlock,
  'banner-split': BannerSplitBlock,
  'rich-text': RichTextBlock,
  'footer': FooterBlock,
} as const satisfies Record<BlockType, unknown>

export type BlockRegistry = typeof blockRegistry
