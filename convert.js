const fs = require('fs');

let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

// Extract body content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (!bodyMatch) {
  console.log('No body found');
  process.exit(1);
}
let body = bodyMatch[1];

// Remove Qwik specific tags and comments
body = body.replace(/<!--[\s\S]*?-->/g, '');
body = body.replace(/ q:[a-zA-Z-]+="[^"]*"/g, '');
body = body.replace(/ q:[a-zA-Z-]+/g, '');
body = body.replace(/ on-[a-zA-Z:]+="[^"]*"/g, '');
body = body.replace(/ on:[a-zA-Z:]+="[^"]*"/g, '');

// Convert common HTML attributes to JSX
body = body.replace(/ class="/g, ' className="');
body = body.replace(/ for="/g, ' htmlFor="');
body = body.replace(/ tabindex="/g, ' tabIndex="');
body = body.replace(/ stroke-width="/g, ' strokeWidth="');
body = body.replace(/ stroke-linecap="/g, ' strokeLinecap="');
body = body.replace(/ stroke-linejoin="/g, ' strokeLinejoin="');
body = body.replace(/ clip-rule="/g, ' clipRule="');
body = body.replace(/ fill-rule="/g, ' fillRule="');
body = body.replace(/ viewBox="/g, ' viewBox="');

// Fix unclosed tags (img, input, hr, br, path, rect, circle)
body = body.replace(/<(img|input|br|hr|path|rect|circle|use)([^\>]*[^\/])>/g, '<$1$2 />');
// Note: SVG elements might be tricky, but this simple regex handles most.

// Fix styles (inline styles)
// E.g. style="box-shadow:0px 1.5px..." -> style={{boxShadow: "0px 1.5px..."}}
body = body.replace(/ style="([^"]*)"/g, (match, styleString) => {
  const styles = styleString.split(';').filter(s => s.trim());
  const styleObj = {};
  styles.forEach(s => {
    const [key, ...valParts] = s.split(':');
    if (key && valParts.length) {
      const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      styleObj[camelKey] = valParts.join(':').trim();
    }
  });
  return ` style={${JSON.stringify(styleObj)}}`;
});

// Since the string is massive, let's wrap it in a React component
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
console.log('Successfully wrote page.tsx');
