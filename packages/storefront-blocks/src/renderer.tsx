import { Fragment } from 'react'
import { parseBlocks, type Block } from './schema'
import { blockRegistry } from './registry'
import type { BlockDataSource } from './data-source'

export interface BlockRendererProps {
  /** Raw JSON từ DB. Sẽ được parse + validate. */
  blocks: unknown
  /** Data source cho block cần fetch (product-grid, category-grid). */
  dataSource: BlockDataSource
  /** Map block type → sanitized HTML cho rich-text. Storefront app sanitize trước, pass vào. */
  sanitizedHtmlByIndex?: Record<number, string>
  /** Feature flags từ `organizations.storefront_features`. Block được phép skip nếu flag tắt. */
  features?: Record<string, boolean>
  /** Hook log lỗi schema. Mặc định console.warn. */
  onSchemaError?: (errors: ReturnType<typeof parseBlocks>['errors']) => void
}

export async function BlockRenderer({
  blocks,
  dataSource,
  sanitizedHtmlByIndex = {},
  onSchemaError,
}: BlockRendererProps) {
  const { valid, errors } = parseBlocks(blocks)
  if (errors.length > 0) {
    if (onSchemaError) onSchemaError(errors)
    else console.warn('[storefront-blocks] invalid blocks:', errors)
  }

  return (
    <>
      {valid.map((block, index) => (
        <Fragment key={index}>{renderBlock(block, index, dataSource, sanitizedHtmlByIndex)}</Fragment>
      ))}
    </>
  )
}

function renderBlock(
  block: Block,
  index: number,
  dataSource: BlockDataSource,
  sanitizedHtmlByIndex: Record<number, string>
) {
  const Component = blockRegistry[block.type] as any;
  if (!Component) return null;

  switch (block.type) {
    case 'hero':
      return <Component props={block.props} />
    case 'product-grid':
      return <Component props={block.props} dataSource={dataSource} />
    case 'category-grid':
      return <Component props={block.props} dataSource={dataSource} />
    case 'banner-split':
      return <Component props={block.props} />
    case 'rich-text':
      return <Component props={block.props} sanitizedHtml={sanitizedHtmlByIndex[index] ?? ''} />
    case 'footer':
      return <Component props={block.props} />
    default:
      return null;
  }
}
