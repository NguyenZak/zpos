import type { BlockProps } from '../schema'
import type { BlockDataSource } from '../data-source'

export async function CategoryGridBlock({
  props,
  dataSource,
}: {
  props: BlockProps<'category-grid'>
  dataSource: BlockDataSource
}) {
  const { title, categorySlugs, columns, showProductCount } = props
  const categories = await dataSource.getCategories(categorySlugs)
  if (categories.length === 0) return null

  const gridColsClass = 
    columns === 2 ? 'grid-cols-2' : 
    columns === 3 ? 'grid-cols-2 md:grid-cols-3' : 
    columns === 6 ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 
    'grid-cols-2 md:grid-cols-4';

  return (
    <section 
      className="sb-category-grid" 
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
        style={{ gap: 'var(--element-gap)' }}
      >
        {categories.map((c) => (
          <a
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="group flex flex-col"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div 
              className="relative overflow-hidden bg-gray-100" 
              style={{ 
                aspectRatio: '3 / 4', 
                borderRadius: 'var(--radius-all)' 
              }}
            >
              {c.image ? (
                <img 
                  src={c.image} 
                  alt={c.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              ) : null}
            </div>
            
            <div className="mt-4 flex flex-col items-center text-center">
              <h3 
                className="uppercase tracking-widest"
                style={{ 
                  fontSize: 'var(--text-body)', 
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--color-pitch-black)'
                }}
              >
                {c.name}
              </h3>
              {showProductCount && c.productCount !== undefined ? (
                <p 
                  className="mt-1"
                  style={{ 
                    color: 'var(--color-subtle-gray)', 
                    fontSize: 'var(--text-caption)' 
                  }}
                >
                  {c.productCount} SẢN PHẨM
                </p>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
