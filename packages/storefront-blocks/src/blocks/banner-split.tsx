import React from 'react'
import type { BlockProps } from '../schema'

export function BannerSplitBlock({ props }: { props: BlockProps<'banner-split'> }) {
  const { left, right } = props
  return (
    <section
      className="sb-banner-split w-full flex flex-col md:flex-row"
    >
      {[left, right].map((side, i) => (
        <a
          key={i}
          href={side.href}
          className="group w-full md:w-1/2 relative overflow-hidden flex flex-col"
          style={{ 
            textDecoration: 'none', 
            minHeight: '60vh' 
          }}
        >
          <img 
            src={side.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop"} 
            alt={side.headline} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          {/* Subtle dark overlay just in case text needs contrast, but keep it minimal */}
          <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/20" />
          
          <div
            className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex justify-center"
          >
            <h3 
              className="uppercase tracking-widest text-center"
              style={{ 
                fontSize: 'var(--text-heading-sm)', 
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-luminous-white)',
                backgroundColor: 'rgba(0,0,0,0.6)', // Box behind text for Zara stark contrast
                padding: '8px 24px',
              }}
            >
              {side.headline}
            </h3>
          </div>
        </a>
      ))}
    </section>
  )
}
