import type { BlockProps } from '../schema'

const MAX_WIDTHS: Record<NonNullable<BlockProps<'rich-text'>['maxWidth']>, string> = {
  narrow: '640px',
  medium: '768px',
  wide: '1024px',
  full: '100%',
}

export function RichTextBlock({
  props,
  sanitizedHtml,
}: {
  props: BlockProps<'rich-text'>
  /**
   * HTML đã sanitize ở layer trên (rehype-sanitize / DOMPurify).
   * Block KHÔNG tự sanitize để package giữ pure UI, không kéo dep nặng.
   * Storefront app phải sanitize trước khi truyền vào.
   */
  sanitizedHtml: string
}) {
  return (
    <section 
      className="sb-rich-text" 
      style={{ 
        padding: 'var(--section-gap) 2rem',
        backgroundColor: 'var(--color-luminous-white)',
        color: 'var(--color-pitch-black)'
      }}
    >
      <div
        className="prose prose-sm md:prose-base max-w-none"
        style={{ 
          maxWidth: MAX_WIDTHS[props.maxWidth], 
          margin: '0 auto',
          color: 'var(--color-pitch-black)'
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </section>
  )
}
