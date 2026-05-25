import type { BlockProps } from '../schema'
import type { BlockDataSource, ProductSummary } from '../data-source'

export async function ProductGridBlock({
  props,
  dataSource,
}: {
  props: BlockProps<'product-grid'>
  dataSource: BlockDataSource
}) {
  const { title, source, categorySlug, tag, productIds, limit, columns, layout } = props
  const products = await dataSource.getProducts({ source, categorySlug, tag, productIds, limit })

  if (products.length === 0) return null

  // Ensure columns is safe for grid classes
  const gridColsClass = 
    columns === 2 ? 'grid-cols-2' : 
    columns === 3 ? 'grid-cols-2 md:grid-cols-3' : 
    columns === 6 ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 
    'grid-cols-2 md:grid-cols-4';

  return (
    <section 
      className="sb-product-grid" 
      style={{ 
        padding: 'var(--section-gap) 2rem',
        backgroundColor: 'var(--color-luminous-white)'
      }}
    >
      {title ? (
        <h2 
          className="uppercase tracking-widest text-center"
          style={{ 
            fontSize: 'var(--text-body-lg)', 
            marginBottom: 'var(--section-gap)',
            color: 'var(--color-pitch-black)',
            fontWeight: 'var(--font-weight-regular)'
          }}
        >
          {title}
        </h2>
      ) : null}
      <div
        className={`grid ${gridColsClass}`}
        data-layout={layout}
        style={{
          gap: 'var(--element-gap)',
        }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <a href={`/products/${product.slug}`} className="group flex flex-col" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div 
        className="relative overflow-hidden bg-gray-100" 
        style={{ 
          aspectRatio: '3 / 4', // Fashion portrait ratio
          borderRadius: 'var(--radius-all)' 
        }}
      >
        <img 
          src={product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        {product.badge ? (
          <span
            className="uppercase tracking-wider"
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              padding: '4px 8px',
              fontSize: 'var(--text-caption)',
              background: 'var(--color-luminous-white)',
              color: 'var(--color-pitch-black)',
              border: '1px solid var(--color-pitch-black)',
              borderRadius: 'var(--radius-all)',
            }}
          >
            {product.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-1 px-1">
        <h3 
          className="uppercase truncate"
          style={{ 
            fontSize: 'var(--text-body)', 
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--color-pitch-black)'
          }}
        >
          {product.name}
        </h3>
        <div className="flex gap-3 items-baseline">
          <span 
            style={{ 
              fontWeight: 'var(--font-weight-regular)',
              fontSize: 'var(--text-body)',
              color: 'var(--color-pitch-black)'
            }}
          >
            {formatVnd(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price ? (
            <span 
              style={{ 
                color: 'var(--color-subtle-gray)', 
                textDecoration: 'line-through', 
                fontSize: 'var(--text-body-sm)' 
              }}
            >
              {formatVnd(product.comparePrice)}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  )
}

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}
