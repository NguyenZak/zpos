const fs = require('fs');
let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

// Extract body content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!bodyMatch) process.exit(1);
let body = bodyMatch[1];

// Extract styles
const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
const styles = styleMatches.join('\n');

// Clean up some Qwik attributes that might cause issues, though dangerouslySetInnerHTML doesn't care much
// But just in case, we leave them as is.

// Escape backticks and ${}
body = body.replace(/`/g, '\\`').replace(/\$/g, '\\$');
let combinedHtml = `${styles}\n${body}`;

let pageCode = `
"use client";
import React, { useEffect, useRef } from 'react';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: \`${combinedHtml}\` }} 
    />
  );
}
`;

fs.writeFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/apps/web/src/app/(marketing)/page.tsx', pageCode);
console.log('Saved page.tsx using dangerouslySetInnerHTML');
