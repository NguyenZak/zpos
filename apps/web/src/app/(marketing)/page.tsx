"use client";

import React, { useEffect, useRef } from 'react';

export default function LandingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Auto-resize iframe to match content height
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Set iframe height to match content
          const updateHeight = () => {
            const height = doc.documentElement.scrollHeight;
            iframe.style.height = height + 'px';
          };
          updateHeight();
          
          // Watch for resize changes
          const observer = new ResizeObserver(updateHeight);
          observer.observe(doc.documentElement);

          // Intercept link clicks to navigate in parent
          doc.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor) {
              const href = anchor.getAttribute('href');
              if (href && (href.startsWith('/login') || href.startsWith('/register') || href.startsWith('/app'))) {
                e.preventDefault();
                window.location.href = href;
              }
            }
          });
        }
      } catch (err) {
        // Cross-origin fallback - just set a large height
        iframe.style.height = '8000px';
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="/landing.html"
      title="ZPOS Landing Page"
      className="w-full border-0 overflow-hidden"
      style={{
        width: '100%',
        minHeight: '100vh',
        border: 'none',
        display: 'block',
      }}
      scrolling="no"
    />
  );
}
