const fs = require('fs');

let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

// Extract head and body
const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!headMatch || !bodyMatch) process.exit(1);

let headContent = headMatch[1];
let bodyContent = bodyMatch[1];

// Extract ALL styles from head
const styleMatches = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
let styles = styleMatches.join('\n');

// Replace relative URLs to absolute in styles (including fonts!)
styles = styles.replace(/url\(\/electron/g, 'url(https://www.todesktop.com/electron');
styles = styles.replace(/url\('\/electron/g, "url('https://www.todesktop.com/electron");
styles = styles.replace(/url\("\/electron/g, 'url("https://www.todesktop.com/electron');

// Replace URLs in body
bodyContent = bodyContent.replace(/(src|href)="\/([^"]+)"/g, '$1="https://www.todesktop.com/$2"');
bodyContent = bodyContent.replace(/(src|href)='\/([^']+)'/g, "$1='https://www.todesktop.com/$2'");
bodyContent = bodyContent.replace(/srcset="\/([^"]+)"/g, (match, p1) => {
  // srcset can have multiple urls separated by comma
  return 'srcset="' + p1.split(',').map(s => {
    let parts = s.trim().split(' ');
    if (parts[0].startsWith('/')) parts[0] = 'https://www.todesktop.com' + parts[0];
    else if (!parts[0].startsWith('http')) parts[0] = 'https://www.todesktop.com/' + parts[0];
    return parts.join(' ');
  }).join(', ') + '"';
});

// Strip Qwik script tags from body so they don't throw errors
bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

// The raw html has a lot of <style> tags inside the body too. Let's make sure their URLs are fixed too
bodyContent = bodyContent.replace(/url\(\/electron/g, 'url(https://www.todesktop.com/electron');

let combinedHtml = `${styles}\n${bodyContent}`;

// Escape backticks and ${}
combinedHtml = combinedHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$');

let pageCode = `
"use client";
import React, { useEffect, useRef } from 'react';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Re-implement the basic interactions that were lost from Qwik
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 1. Scroll listener for sticky header
    const handleScroll = () => {
      const header = containerRef.current?.querySelector('.header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    
    // 2. Mobile menu toggle
    const mobileMenuBtn = containerRef.current.querySelector('button[aria-controls="mobile-products-panel"]');
    const mobileMenu = containerRef.current.querySelector('#mobile-products-panel');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('hidden');
        if (isHidden) {
          mobileMenu.classList.remove('hidden');
          mobileMenuBtn.setAttribute('aria-expanded', 'true');
        } else {
          mobileMenu.classList.add('hidden');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="todesktop-clone-container"
      dangerouslySetInnerHTML={{ __html: \`${combinedHtml}\` }} 
    />
  );
}
`;

fs.writeFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/apps/web/src/app/(marketing)/page.tsx', pageCode);
console.log('Saved fixed exact HTML/CSS.');
