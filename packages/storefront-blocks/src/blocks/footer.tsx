import type { BlockProps } from '../schema'

export function FooterBlock({ props }: { props: BlockProps<'footer'> }) {
  const { about, columns, social, copyright } = props
  return (
    <footer 
      className="sb-footer border-t" 
      style={{ 
        padding: 'var(--section-gap) 2rem', 
        background: 'var(--color-luminous-white)', 
        color: 'var(--color-pitch-black)',
        borderColor: 'var(--color-pitch-black)'
      }}
    >
      <div 
        className="max-w-7xl mx-auto"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}
      >
        {about ? (
          <div>
            <h4 
              className="uppercase tracking-widest"
              style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-regular)', marginBottom: '1.5rem' }}
            >
              Về chúng tôi
            </h4>
            <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body-sm)', color: 'var(--color-subtle-gray)' }}>
              {about}
            </p>
          </div>
        ) : null}
        
        {columns.map((col, i) => (
          <div key={i}>
            <h4 
              className="uppercase tracking-widest"
              style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-regular)', marginBottom: '1.5rem' }}
            >
              {col.title}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {col.links.map((l, j) => (
                <li key={j}>
                  <a 
                    href={l.href} 
                    className="hover:underline underline-offset-4"
                    style={{ color: 'var(--color-subtle-gray)', textDecoration: 'none', fontSize: 'var(--text-body-sm)' }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto mt-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        {social.length > 0 ? (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {social.map((s, i) => (
              <a 
                key={i} 
                href={s.href} 
                className="uppercase tracking-widest text-xs hover:opacity-70"
                style={{ color: 'var(--color-pitch-black)' }}
              >
                {s.platform}
              </a>
            ))}
          </div>
        ) : <div />}

        {copyright ? (
          <p 
            className="uppercase tracking-widest"
            style={{ fontSize: 'var(--text-caption)', color: 'var(--color-subtle-gray)' }}
          >
            {copyright}
          </p>
        ) : null}
      </div>
    </footer>
  )
}
