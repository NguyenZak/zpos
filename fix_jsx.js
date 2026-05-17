const fs = require('fs');
let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!bodyMatch) process.exit(1);
let body = bodyMatch[1];

// Strip out <style> tags completely to avoid JSX parsing errors
body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');

// Strip inline styles completely to avoid React object conversion errors
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
body = body.replace(/ viewBox="/g, ' viewBox="');

// Fix unclosed tags
body = body.replace(/<(img|input|br|hr|path|rect|circle|use)([^\>]*[^\/])>/g, '<$1$2 />');

// Some paths are nested without closure properly or just missing trailing slash, the regex above handles most.
// Also fix any stray self closing that got doubled like <img ... />> -> <img ... />
body = body.replace(/\/>>/g, '/>');

let pageCode = `
import React from 'react';

export default function LandingPage() {
  return (
    <>
      ${body}
    </>
  );
}
`;

fs.writeFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/apps/web/src/app/(marketing)/page.tsx', pageCode);
console.log('Fixed page.tsx');
