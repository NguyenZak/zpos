# ZPOS SaaS Architecture Prompt

## Project Overview

Build a modern SaaS Retail Operating System named **ZPOS**.

The platform is a cloud-based web application similar to KiotViet, Sapo, Shopify POS and modern SaaS admin systems.

The system must support:

- POS sales
- Inventory management
- Product management
- Customer CRM
- Staff & permissions
- Multi-branch operations
- Multi-tenant SaaS architecture
- Beautiful dashboard UI
- Realtime updates
- Cloud-first architecture

The application must be built with:

```txt
- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase
- PostgreSQL
- Zustand
- TanStack Table
- React Hook Form
- Zod
- Recharts
- Sonner
- Vercel
```

---

# DOMAIN STRUCTURE

## Main Public Website

```txt
https://zpos.com
```

Purpose:
- Landing page
- SEO pages
- Features
- Pricing
- Contact
- Blog
- Demo booking
- Product showcase

Pages:

```txt
/
 /features
 /solutions
 /pricing
 /about
 /blog
 /contact
 /book-demo
```

---

# MAIN APPLICATION

## Main SaaS App

```txt
https://app.zpos.com
```

Purpose:
- Main application dashboard
- Authentication
- Workspace selection
- POS system
- Inventory
- Orders
- Reports
- Settings

Routes:

```txt
/app
/app/pos
/app/products
/app/inventory
/app/orders
/app/customers
/app/staff
/app/reports
/app/settings
```

---

# TENANT SUBDOMAIN ARCHITECTURE

Each customer has their own subdomain.

Example:

```txt
https://mapa.zpos.com
https://roving.zpos.com
https://azlabs.zpos.com
```

Purpose:
- Dedicated customer workspace
- White-label capable
- Faster login experience
- Separate branding support
- Enterprise-ready SaaS architecture

Tenant system requirements:

```txt
- Detect tenant from subdomain
- Resolve organization_id automatically
- Load organization branding
- Load branch configuration
- Apply tenant theme
- Protect tenant isolation
```

---

# SUPER ADMIN SYSTEM

## Internal Company Console

```txt
https://console.zpos.com
```

Purpose:
- Internal company management
- SaaS monitoring
- Subscription management
- Tenant management
- User management
- Revenue analytics
- System health monitoring
- Support tools

Console modules:

```txt
- Tenant management
- Subscription plans
- Revenue analytics
- System metrics
- Audit logs
- Support tickets
- Feature flags
- Global settings
```

---

# CMS SYSTEM

## Landing Page CMS

```txt
https://cms.zpos.com
```

Purpose:
- Manage landing page content
- Blog posts
- SEO content
- Pricing pages
- Feature pages
- Marketing assets

CMS modules:

```txt
- Blog editor
- SEO manager
- Media library
- Landing page builder
- Hero content
- Pricing content
- Feature content
```

---

# REPOSITORY STRUCTURE

Use one monorepo architecture.

```txt
/apps
  /web
  /console
  /cms

/packages
  /ui
  /types
  /database
  /config
  /utils
  /auth
```

---

# NEXT.JS APP STRUCTURE

```txt
src/app
├── (marketing)
├── (auth)
├── app
├── api
├── globals.css
└── layout.tsx
```

---

# AUTHENTICATION FLOW

## Public User

```txt
zpos.com
→ click login
→ app.zpos.com/login
→ select workspace
→ redirect to tenant workspace
```

Example:

```txt
User logs in
→ organization = mapa
→ redirect to:
https://mapa.zpos.com
```

---

# MULTI-TENANT ARCHITECTURE

All tables must contain:

```sql
organization_id uuid
```

Tenant isolation must be handled by:

```txt
- Supabase RLS
- Middleware
- Subdomain resolver
- Organization context
```

---

# SUBDOMAIN MIDDLEWARE

Create middleware that:

```txt
1. Detects hostname
2. Extracts subdomain
3. Resolves tenant
4. Loads organization
5. Injects organization context
6. Redirects invalid tenants
```

Example:

```txt
mapa.zpos.com
→ tenant = mapa
→ organization = MAPA Bistro
```

---

# UI/UX DIRECTION

Style reference:

```txt
- Linear
- Stripe
- Vercel
- Shopify Admin
- Notion
```

UI style:

```txt
- Modern SaaS
- Glassmorphism nhẹ
- Clean dashboard
- Minimal
- Fast UX
- Responsive
- Dark mode
- Large spacing
- Rounded 2xl
```

---

# DASHBOARD STRUCTURE

## App Dashboard

```txt
Sidebar
Topbar
Workspace Switcher
Branch Switcher
Notifications
Search
User Menu
```

---

# MAIN SIDEBAR

```txt
Dashboard
POS
Products
Inventory
Orders
Customers
Suppliers
Purchases
Staff
Reports
Settings
```

---

# POS SYSTEM

The POS screen must be optimized for speed.

Features:

```txt
- Barcode scanning
- Product search
- Keyboard shortcuts
- Fast checkout
- Cart system
- Customer selector
- Discount support
- QR payment
- Receipt printing
- Draft orders
- Return orders
```

---

# DATABASE SYSTEM

Use PostgreSQL with Supabase.

Core tables:

```txt
organizations
branches
profiles
organization_members
products
product_variants
categories
inventory
inventory_movements
orders
order_items
customers
payments
suppliers
purchase_orders
audit_logs
```

---

# SECURITY REQUIREMENTS

```txt
- Supabase RLS enabled
- organization_id isolation
- Role-based permissions
- Zod validation
- Rate limiting
- Secure middleware
- Secure server actions
- No client-side secrets
```

---

# DEPLOYMENT STRUCTURE

## Vercel

```txt
zpos.com
app.zpos.com
console.zpos.com
cms.zpos.com
*.zpos.com
```

Wildcard subdomain support required.

---

# ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAIN_DOMAIN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

---

# MONETIZATION MODEL

Plans:

```txt
Free
Starter
Pro
Business
Enterprise
```

Support:

```txt
- Monthly billing
- Annual billing
- Trial period
- Subscription management
- Feature limitations
```

---

# FUTURE SCALING

Architecture must support:

```txt
- Mobile app
- Offline POS
- AI reports
- AI assistant
- Ecommerce integration
- Marketplace
- API access
- White-label
- Multi-language
- Multi-currency
```

---

# FINAL GOAL

Build a world-class SaaS Retail Operating System with:

```txt
- Modern architecture
- Enterprise-ready structure
- Beautiful UI/UX
- Fast performance
- Multi-tenant scalability
- Cloud-native infrastructure
- Production-ready codebase
```
