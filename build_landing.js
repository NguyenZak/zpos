const fs = require('fs');

let html = fs.readFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/www.todesktop.com/www.todesktop.com/index.html', 'utf8');

// Fix ALL relative URLs to absolute (images, fonts, etc.)
html = html.replace(/(src|href)="\/([^"]+)"/g, '$1="https://www.todesktop.com/$2"');
html = html.replace(/(src|href)='\/([^']+)'/g, "$1='https://www.todesktop.com/$2'");

// Fix srcset attributes
html = html.replace(/srcset="([^"]+)"/g, (match, srcsetVal) => {
  const fixed = srcsetVal.split(',').map(s => {
    s = s.trim();
    if (s.startsWith('/')) return 'https://www.todesktop.com' + s;
    return s;
  }).join(', ');
  return 'srcset="' + fixed + '"';
});

// Fix url() in styles (both in head and body style blocks)
html = html.replace(/url\(\/([^)]+)\)/g, 'url(https://www.todesktop.com/$1)');
html = html.replace(/url\('\/([^']+)'\)/g, "url('https://www.todesktop.com/$1')");
html = html.replace(/url\("\/([^"]+)"\)/g, 'url("https://www.todesktop.com/$1")');

// Fix any fetch() calls pointing to relative paths
html = html.replace(/fetch\("\/([^"]+)"\)/g, 'fetch("https://www.todesktop.com/$1")');
html = html.replace(/import\("\/([^"]+)"\)/g, 'import("https://www.todesktop.com/$1")');

// Remove Qwik script tags that would cause errors  
html = html.replace(/<script[^>]*src="[^"]*\/_home\/build\/[^"]*"[^>]*><\/script>/g, '');
html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

// Add our own scroll handler script
const scrollScript = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  var header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    });
  }
  
  // Make lazy images visible
  document.querySelectorAll('.lazy-image.opacity-0').forEach(function(img) {
    img.classList.remove('opacity-0');
  });
  document.querySelectorAll('.lazy-background-image.opacity-0').forEach(function(el) {
    el.classList.remove('opacity-0');
  });
  
  // Fix internal links to point to ZPOS
  document.querySelectorAll('a[href*="todesktop.com/login"], a[href*="todesktop.com/signup"]').forEach(function(a) {
    a.href = '/login';
  });
  document.querySelectorAll('a[href*="app.todesktop.com"]').forEach(function(a) {
    a.href = '/login';
  });
});
</script>
`;

// Insert script before closing body tag
html = html.replace('</body>', scrollScript + '</body>');

// Write as static file
fs.writeFileSync('/Users/apple/Documents/ViZ Solutions/Zpos/apps/web/public/landing.html', html);
console.log('Saved landing.html to public/. Size:', html.length);
