const fs = require('fs');

let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

// Extract head and body
const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!headMatch || !bodyMatch) process.exit(1);

let headContent = headMatch[1];
let bodyContent = bodyMatch[1];

// Extract just the styles and maybe preload links
const styleMatches = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
let styles = styleMatches.join('\n');

// Fix asset paths in both styles and body
// Replace "/electron/..." with "https://www.todesktop.com/electron/..."
// Replace "/cdn-cgi/..." with "https://www.todesktop.com/cdn-cgi/..."
const fixUrls = (str) => {
  return str
    .replace(/(src|href)="\/([^"]+)"/g, '$1="https://www.todesktop.com/$2"')
    .replace(/(src|href)='\/([^']+)'/g, "$1='https://www.todesktop.com/$2'")
    .replace(/url\("\/([^"]+)"\)/g, 'url("https://www.todesktop.com/$1")')
    .replace(/url\('\/([^']+)'\)/g, "url('https://www.todesktop.com/$1')")
    .replace(/url\(\/([^\)]+)\)/g, 'url(https://www.todesktop.com/$1)');
};

styles = fixUrls(styles);
bodyContent = fixUrls(bodyContent);

// Strip out Qwik script tags from body just in case they error
bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

let combinedHtml = `${styles}\n${bodyContent}`;

// Escape backticks and ${}
combinedHtml = combinedHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$');

let pageCode = `
"use client";
import React, { useEffect, useRef } from 'react';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
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
console.log('Saved page.tsx with exact HTML/CSS and fixed asset URLs.');
