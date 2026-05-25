import type { BlockProps } from '../schema'

export function HeroBlock({ props }: { props: BlockProps<'hero'> }) {
  const { headline, subheadline, image, video, cta, align } = props
  
  // Zara style: Split screen if image/video exists. Left is white with text, right is media.
  // If no media, it's just centered stark text.
  
  const hasMedia = !!(image || video);

  return (
    <section
      className={`w-full ${hasMedia ? 'min-h-[80vh] flex flex-col md:flex-row' : 'min-h-[50vh] flex flex-col justify-center items-center py-20'}`}
      style={{ backgroundColor: 'var(--color-luminous-white)' }}
    >
      {/* Content Side */}
      <div
        className={`${hasMedia ? 'w-full md:w-1/3 flex flex-col justify-center' : 'w-full max-w-4xl mx-auto'}`}
        style={{
          padding: 'var(--section-gap) 2rem',
          textAlign: hasMedia ? 'left' : (align as any),
        }}
      >
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl tracking-tight uppercase"
          style={{ 
            color: 'var(--color-pitch-black)', 
            fontWeight: 'var(--font-weight-regular)' 
          }}
        >
          {headline}
        </h1>
        
        {subheadline && (
          <p 
            className="mt-6 text-sm md:text-base max-w-md"
            style={{ 
              color: 'var(--color-subtle-gray)',
              lineHeight: 'var(--leading-body-lg)'
            }}
          >
            {subheadline}
          </p>
        )}
        
        {cta && (
          <div className="mt-12">
            <a
              href={cta.href}
              className="inline-block uppercase text-xs tracking-wider hover:opacity-70 transition-opacity"
              style={{
                border: '1px solid var(--color-pitch-black)',
                padding: '12px 32px',
                color: 'var(--color-pitch-black)',
                background: 'transparent',
              }}
            >
              {cta.label}
            </a>
          </div>
        )}
      </div>

      {/* Media Side */}
      {hasMedia && (
        <div className="w-full md:w-2/3 relative min-h-[50vh] md:min-h-full">
          {video ? (
            <video
              src={video}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : image ? (
            <img
              src={image}
              alt={headline}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
        </div>
      )}
    </section>
  )
}
