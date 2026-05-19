# ZPOS Tenant Welcome Overlay Screen

## Overview

Create a modern welcome overlay screen for the ZPOS Tenant Dashboard.

This screen appears immediately after a tenant user logs in and enters the dashboard.

Example tenant:

```txt
https://mapa.zpos.com
```

The overlay should create a premium SaaS greeting experience similar to:

```txt
Linear
Stripe
Apple
Notion
Vercel
```

---

# Goal

The welcome overlay should feel:

```txt
Premium
Modern
Elegant
Fast
Mobile-first
```

---

# Show Conditions

Show overlay when:

```txt
User logs in successfully
User enters tenant dashboard
User returns after long inactivity
```

Route:

```txt
/
```

---

# Hide Conditions

Hide overlay instantly when:

```txt
User clicks
User taps screen
User scrolls
User presses key
User switches tab
User leaves browser window
```

Important:

```txt
If user switches browser tab immediately:
→ overlay disappears instantly
→ dashboard remains usable
```

---

# Required Browser Events

Use:

```txt
pointerdown
touchstart
keydown
scroll
visibilitychange
blur
focus
```

---

# UI Style

```txt
Premium SaaS
Glassmorphism
Soft blur
Ambient gradient
Apple-like motion
Minimal design
```

Avoid:

```txt
Heavy animation
Gaming style
Neon overload
Slow transitions
```

---

# Overlay Layout

```txt
Tenant logo
Greeting text
Business name
Branch name
Staff name
Realtime clock
Animated gradient background
Mini metrics cards
Tap anywhere to continue
```

---

# Greeting Logic

Morning:

```txt
Chào buổi sáng ☀️
```

Afternoon:

```txt
Chào buổi chiều 🌤️
```

Evening:

```txt
Chào buổi tối 🌙
```

---

# Example Greeting

```txt
Chào buổi sáng, Zak ☀️

MAPA Bistro
Chi nhánh Nhà Chung

Chúc bạn kinh doanh thuận lợi hôm nay.
```

---

# Metrics Preview

Optional cards:

```txt
Doanh thu hôm nay
Đơn hàng hôm nay
Sản phẩm sắp hết
```

Rules:

```txt
Show skeleton while loading
Hide cards on very small screens if needed
Do not block overlay rendering
```

---

# Animation Requirements

Use:

```txt
Framer Motion
```

Animations:

```txt
Fade in
Scale in
Blur transition
Smooth exit animation
Floating gradient
Soft card entrance
```

Animation feeling:

```txt
Smooth
Lightweight
Premium
Calm
```

---

# Required Components

Create:

```txt
TenantWelcomeOverlay
GreetingMessage
AnimatedBackground
FloatingMetrics
RealtimeClock
```

Suggested structure:

```txt
src/components/welcome/
├── tenant-welcome-overlay.tsx
├── greeting-message.tsx
├── animated-background.tsx
├── floating-metrics.tsx
└── realtime-clock.tsx
```

---

# State Management

Use Zustand or React state.

State:

```ts
isWelcomeVisible
hasUserInteracted
hasSeenWelcomeInSession
```

Use sessionStorage:

```txt
zpos_welcome_seen=true
```

---

# Session Rules

```txt
Show once per browser session
Do not show on every route change
Show again after logout/login
Show again after long inactivity
```

---

# Mobile UX

Requirements:

```txt
Fullscreen overlay
Safe area support
Touch-first
Fast interaction
Lightweight animations
Large readable text
```

Layout:

```txt
Logo top
Greeting center
Business name center
Metrics cards below
Tap anywhere to continue
```

---

# Desktop UX

Requirements:

```txt
Centered content
Ambient blur background
Floating metric cards
Soft shadows
Glassmorphism panels
```

---

# Performance Requirements

```txt
Do not block dashboard rendering
Use CSS transforms
Avoid heavy canvas rendering
Run smoothly on low-end phones
Exit instantly on interaction
```

---

# Accessibility

```txt
Respect prefers-reduced-motion
Allow ESC key to close
Readable contrast
ARIA labels
No keyboard trap
```

---

# Integration

Add overlay into tenant dashboard layout.

Example:

```txt
src/app/(tenant)/layout.tsx
```

Usage:

```tsx
<TenantWelcomeOverlay />
<AppDashboardLayout>{children}</AppDashboardLayout>
```

---

# Props

```ts
type TenantWelcomeOverlayProps = {
  userName?: string;
  tenantName: string;
  branchName?: string;
  logoUrl?: string;
  metrics?: {
    revenueToday?: number;
    ordersToday?: number;
    lowStockCount?: number;
  };
};
```

---

# Example Flow

```txt
User login
→ Dashboard loads
→ Welcome overlay appears
→ User switches tab
→ Overlay disappears immediately
→ Dashboard usable normally
```

Another flow:

```txt
User login
→ Overlay appears
→ User taps screen
→ Overlay fades out
→ Dashboard active
```

---

# Required Logic

Implement:

```txt
Listen pointerdown
Listen touchstart
Listen keydown
Listen scroll
Listen visibilitychange
Listen blur
Remove listeners after close
Save session flag
Use AnimatePresence for exit animation
```

---

# Suggested Copy

Vietnamese:

```txt
Chào mừng quay trở lại
Chúc bạn kinh doanh thuận lợi hôm nay
Đang chuẩn bị dữ liệu cửa hàng
Nhấn bất kỳ đâu để tiếp tục
```

English fallback:

```txt
Welcome back
Preparing your store data
Tap anywhere to continue
```

---

# Final Goal

Create a premium tenant welcome overlay experience for ZPOS that feels modern, elegant, fast and mobile-first.

The overlay should improve the first impression without interrupting the workflow.
