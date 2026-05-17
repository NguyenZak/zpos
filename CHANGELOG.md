# Changelog

All notable changes to the ZPOS project will be documented in this file.

## [2026-05-17]

### Added
- **ToDesktop Design Tokens:** Registered ToDesktop's professional "digital engineering lab" colors, fonts, and box shadows under Tailwind CSS v4 `@theme` directive in [globals.css](file:///Users/apple/Documents/ViZ%20Solutions/Zpos/apps/web/src/app/globals.css).
- **High-Fidelity Redesigned Landing Page:** Completely rewrote the marketing homepage in [page.tsx](file:///Users/apple/Documents/ViZ%20Solutions/Zpos/apps/web/src/app/(marketing)/page.tsx) with ToDesktop's visual signature (deep cool gradients, bento grids, hairline borders, frosted cards, and typography).
- **Verified ToDesktop Buttons:** Extracted and integrated the exact CSS definitions for `.button-primary`, `.button-light`, and `.button-dark` buttons directly from `todesktop.com` including their precise multi-layered shadows, transitions, and hover state transforms.
- **Infinite Scrolling Marquee:** Activated the infinite clients scrolling ticker utilizing the `.logo-ticker-track` track animation in `globals.css`.
- **POS Sandbox Cart Terminal:** Built an interactive POS virtual register on the homepage supporting real-time items grid addition, quantity modification, and a simulated syncer ledger. Includes an **automatic checkout cart-reset feature** that resets the cart back to empty on successful sync.
- **Local Auth Bypass Simulator:** Added a console log terminal on the homepage showcasing how local dev sessions bypass Supabase unconfirmed emails and restricted RLS.

### Fixed
- **Local Dev Login Bypass Bug:** Patched the local database bypass sequence in [login-form.tsx](file:///Users/apple/Documents/ViZ%20Solutions/Zpos/apps/web/src/app/(auth)/_components/login-form.tsx) to recover from database Row Level Security (RLS) policies blocking unauthenticated joins. The sequence now uses a robust subdomain fallback and public tenant validation to successfully authenticate local owners.

