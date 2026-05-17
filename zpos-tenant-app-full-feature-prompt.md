# ZPOS Tenant App — Full Feature Prompt

## Context

Build the Tenant App for ZPOS.

Example tenant:

https://mapa.zpos.com

This is the private dashboard for one business/customer.

The app must automatically detect the tenant from the subdomain.

---

# Core Features

- Tenant detection from subdomain
- Organization context
- Branch switching
- POS system
- Inventory management
- Orders
- Customers
- Reports
- Billing
- Staff & permissions
- Notifications
- Audit logs
- Multi-branch support
- Responsive dashboard
- Dark mode

---

# POS Features

- Product search
- Barcode scanner
- Cart system
- Discounts
- Split payment
- VietQR
- Draft orders
- Receipt printing
- Realtime inventory sync

---

# Product Features

- Product CRUD
- Variants
- SKU
- Barcode
- Category
- Inventory threshold
- Import/export Excel

---

# Inventory Features

- Stock in
- Stock out
- Transfer
- Adjustment
- Inventory count
- Movement history
- Low stock alerts

---

# Order Features

- Order list
- Refunds
- Returns
- Invoice printing
- Payment history

---

# Customer Features

- Customer profiles
- Loyalty points
- Debt tracking
- Purchase history

---

# Staff Features

- Roles
- Permissions
- Branch assignment
- Activity logs

---

# Reports

- Revenue
- Profit
- Inventory
- Product sales
- Staff performance
- Branch comparison

---

# Settings

- Business settings
- Branch settings
- Printer settings
- Billing settings
- Branding

---

# Required Tables

- organizations
- branches
- profiles
- products
- product_variants
- inventory
- inventory_movements
- customers
- orders
- order_items
- payments
- suppliers
- purchase_orders
- notifications
- audit_logs
- subscriptions

---

# Tech Stack

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

---

# Final Goal

Create a production-ready SaaS tenant dashboard using the existing next-shadcn-admin-dashboard repo as the base admin framework.
