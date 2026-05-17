const fs = require('fs');
let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!bodyMatch) process.exit(1);
let body = bodyMatch[1];

// Strip out <style> tags completely
body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
// Strip inline styles
body = body.replace(/ style="[^"]*"/g, '');
// Clean Qwik attributes
body = body.replace(/<!--[\s\S]*?-->/g, '');
body = body.replace(/ q:[a-zA-Z-]+="[^"]*"/g, '');
body = body.replace(/ q:[a-zA-Z-]+/g, '');
body = body.replace(/ on-[a-zA-Z:]+="[^"]*"/g, '');
body = body.replace(/ on:[a-zA-Z:]+="[^"]*"/g, '');

// Convert common HTML attributes to JSX
body = body.replace(/ class="/g, ' className="');
body = body.replace(/ for="/g, ' htmlFor="');
body = body.replace(/ tabindex="/g, ' tabIndex="');
body = body.replace(/ srcset="/g, ' srcSet="');
body = body.replace(/ fetchpriority="/g, ' fetchPriority="');
body = body.replace(/ stroke-width="/g, ' strokeWidth="');
body = body.replace(/ stroke-linecap="/g, ' strokeLinecap="');
body = body.replace(/ stroke-linejoin="/g, ' strokeLinejoin="');
body = body.replace(/ clip-rule="/g, ' clipRule="');
body = body.replace(/ fill-rule="/g, ' fillRule="');

// Fix SVG: <path ... /></path> or <path ...></path> -> <path ... />
body = body.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)([^>]*?)><\/\1>/g, '<$1$2 />');
// Also fix <path ... /> that's already self-closing but has content: none needed

// Fix self-closing void elements
body = body.replace(/<(img|input|br|hr|use|link|meta)([^>]*?)>/g, (match, tag, attrs) => {
  if (attrs.endsWith('/')) return match; // already self-closing
  return `<${tag}${attrs} />`;
});

// Fix aria-hidden with boolean
body = body.replace(/aria-hidden="true"/g, 'aria-hidden={true}');
body = body.replace(/aria-expanded="false"/g, 'aria-expanded={false}');
body = body.replace(/aria-expanded="true"/g, 'aria-expanded={true}');

// Fix decoding="async" -> that's fine in JSX as string

let pageCode = `"use client";\nimport React from 'react';\n\nexport default function LandingPage() {\n  return (\n    <>\n      ${body}\n    </>\n  );\n}\n`;

fs.writeFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/apps/web/src/app/(marketing)/page.tsx', pageCode);
console.log('Done. File size: ' + pageCode.length);
