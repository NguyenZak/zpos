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

// Fix SVG: <path ...></path> or <circle></circle> -> self-closing
body = body.replace(/<(path|circle|rect|ellipse|line|polyline|polygon)([^>]*?)><\/\1>/g, '<$1$2 />');

// Fix void elements (img, input, br, hr, etc.)
body = body.replace(/<(img|input|br|hr|use|link|meta)([^>]*?)>/g, (match, tag, attrs) => {
  if (attrs.trim().endsWith('/')) return `<${tag}${attrs}>`;
  return `<${tag}${attrs} />`;
});

// Fix aria-hidden, aria-expanded boolean strings
body = body.replace(/aria-hidden="true"/g, 'aria-hidden={true}');
body = body.replace(/aria-hidden="false"/g, 'aria-hidden={false}');
body = body.replace(/aria-expanded="false"/g, 'aria-expanded={false}');
body = body.replace(/aria-expanded="true"/g, 'aria-expanded={true}');

// CRITICAL: Replace HTML entities inside text nodes (not inside attributes)
// This is tricky: we decode them as actual characters
body = body.replace(/&quot;/g, '"');
body = body.replace(/&amp;/g, '&');
body = body.replace(/&lt;/g, '<');
body = body.replace(/&gt;/g, '>');
body = body.replace(/&nbsp;/g, '\u00a0');
body = body.replace(/&#x27;/g, "'");
body = body.replace(/&#39;/g, "'");
body = body.replace(/&#x2F;/g, '/');
body = body.replace(/&#47;/g, '/');
body = body.replace(/&ldquo;/g, '\u201c');
body = body.replace(/&rdquo;/g, '\u201d');
body = body.replace(/&lsquo;/g, '\u2018');
body = body.replace(/&rsquo;/g, '\u2019');
body = body.replace(/&mdash;/g, '\u2014');
body = body.replace(/&ndash;/g, '\u2013');
body = body.replace(/&copy;/g, '\u00a9');

// After replacing &lt; and &gt;, we now have raw < > inside JSX text nodes
// which will break React. We need to escape them again inside text using {<} notation
// or wrap the code blocks in {`...`}
// 
// The real problem: code samples have < > which is now unescaped inside JSX
// Solution: find text between tags that contains < or > and escape them
// This regex finds text nodes and escapes < > there
body = body.replace(/>([^<]*)</g, (match, text) => {
  if (!text.includes('<') && !text.includes('>') && !text.includes('{') && !text.includes('}')) {
    return match;
  }
  // Escape remaining raw < > in text nodes
  const escaped = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
  return `>${escaped}<`;
});

let pageCode = `"use client";\nimport React from 'react';\n\nexport default function LandingPage() {\n  return (\n    <>\n      ${body}\n    </>\n  );\n}\n`;

fs.writeFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/apps/web/src/app/(marketing)/page.tsx', pageCode);
console.log('Done. File size: ' + pageCode.length);
