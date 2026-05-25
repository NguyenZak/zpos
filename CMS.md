# Fashion CMS - Product Requirement Document

## 1. Project Overview

Build a Fashion CMS for managing a fashion brand website and e-commerce content.

The CMS should allow admin users to manage products, collections, lookbooks, campaigns, pages, blog posts, SEO, media, customers, orders, promotions, and website settings.

The system should be scalable for one or multiple fashion brands in the future.

## 2. Tech Stack

Use the following technologies:

- Next.js App Router
- TypeScript
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage or Cloudinary for media
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table
- Zustand or Jotai for state management
- Vercel for deployment

## 3. Main Modules

The CMS should include these modules:

1. Dashboard
2. Products
3. Product Variants
4. Categories
5. Collections
6. Lookbooks
7. Campaigns
8. Media Library
9. Pages
10. Blog
11. SEO Manager
12. Orders
13. Customers
14. Promotions
15. Inventory
16. Website Settings
17. User Roles & Permissions
18. AI Content Assistant

---

# 4. Dashboard

## Features

The dashboard should display:

- Total products
- Total orders
- Total customers
- Total revenue
- Low stock products
- Best selling products
- Recent orders
- Recent blog posts
- Active campaigns
- Draft content
- Products missing SEO data
- Products missing images

## UI Requirements

Create a clean admin dashboard with cards, charts, and recent activity tables.

---

# 5. Product Management

## Product Fields

Each product should have:

- id
- name
- slug
- description
- short_description
- category_id
- brand_id
- collection_ids
- material
- fit_type
- care_instruction
- base_price
- sale_price
- status: draft | published | hidden | archived
- is_featured
- is_new_arrival
- is_best_seller
- seo_title
- seo_description
- og_image
- created_at
- updated_at

## Product Features

Admin should be able to:

- Create product
- Edit product
- Delete product
- Publish product
- Archive product
- Duplicate product
- Search product
- Filter by category
- Filter by collection
- Filter by status
- Filter by stock status
- Sort products
- Upload product images
- Add product to collections
- Set featured product
- Set new arrival
- Set best seller
- Add SEO data
- Preview product page

---

# 6. Product Variants

Fashion products must support variants.

## Variant Structure

Each product can have multiple variants based on:

- Color
- Size
- SKU
- Barcode
- Price
- Sale price
- Stock quantity
- Variant image
- Status

## Variant Fields

- id
- product_id
- color_id
- size_id
- sku
- barcode
- price
- sale_price
- stock_quantity
- low_stock_threshold
- image_url
- status: active | inactive | sold_out
- created_at
- updated_at

## Variant Features

Admin should be able to:

- Add color variants
- Add size variants
- Generate SKU automatically
- Update stock for each variant
- Upload images for each color
- Mark variant as sold out
- Hide unavailable size
- Set different price for variant
- Bulk create variants from selected colors and sizes

## Example

Product: Basic T-Shirt

Variants:

- White / S
- White / M
- White / L
- Black / S
- Black / M
- Black / L

Each combination should have its own SKU and stock quantity.

---

# 7. Category Management

## Category Fields

- id
- name
- slug
- description
- parent_id
- image
- seo_title
- seo_description
- sort_order
- status

## Features

Admin should be able to:

- Create category
- Edit category
- Delete category
- Create nested category
- Reorder categories
- Add SEO data
- Upload category image

Example categories:

- Women
- Men
- Kids
- Accessories
- Shoes
- Bags
- New Arrivals
- Sale

---

# 8. Collections

Collections are landing pages for product groups.

## Collection Fields

- id
- name
- slug
- description
- banner_image
- mobile_banner_image
- seo_title
- seo_description
- status
- start_date
- end_date
- sort_order
- created_at
- updated_at

## Features

Admin should be able to:

- Create collection
- Edit collection
- Delete collection
- Add products to collection
- Reorder products inside collection
- Upload collection banner
- Set collection status
- Schedule collection visibility
- Add SEO data
- Preview collection page

Example collections:

- Summer Collection
- Office Wear
- Streetwear
- Premium Line
- New Arrivals
- Best Sellers
- Black Friday Sale

---

# 9. Lookbook

## Lookbook Fields

- id
- title
- slug
- description
- cover_image
- status
- seo_title
- seo_description
- created_at
- updated_at

## Lookbook Item Fields

- id
- lookbook_id
- image_url
- title
- description
- linked_product_ids
- sort_order

## Features

Admin should be able to:

- Create lookbook
- Upload lookbook images
- Tag products inside lookbook
- Reorder lookbook images
- Publish/unpublish lookbook
- Add SEO data
- Preview lookbook page

---

# 10. Campaign Management

## Campaign Fields

- id
- name
- slug
- description
- banner_image
- landing_page_content
- start_date
- end_date
- status
- seo_title
- seo_description

## Features

Admin should be able to:

- Create campaign
- Create campaign landing page
- Add products to campaign
- Upload campaign banner
- Schedule campaign
- Add SEO
- Preview campaign

Example campaigns:

- Tet Collection
- Summer Drop
- 11.11 Sale
- 12.12 Sale
- Black Friday
- New Season Launch

---

# 11. Media Library

## Features

Admin should be able to:

- Upload images
- Upload videos
- Search media
- Filter by type
- Rename media
- Delete media
- Copy media URL
- Add alt text
- Organize media by folder
- Preview image
- Optimize image automatically

## Media Fields

- id
- file_name
- file_url
- file_type
- file_size
- width
- height
- alt_text
- folder
- created_at

Use Cloudinary if available.

---

# 12. Page Builder

CMS should allow admin to manage website pages.

## Page Fields

- id
- title
- slug
- content
- status
- seo_title
- seo_description
- og_image
- created_at
- updated_at

## Supported Pages

- Home
- About
- Contact
- Size Guide
- Shipping Policy
- Return Policy
- Privacy Policy
- Terms of Service

## Page Builder Sections

Allow admin to create sections:

- Hero Banner
- Product Grid
- Collection Grid
- Text Block
- Image Block
- Image + Text
- Lookbook Section
- Video Section
- Testimonial Section
- FAQ Section
- Newsletter Section

Each section should support:

- Title
- Subtitle
- Image
- Button text
- Button link
- Sort order
- Visibility toggle

---

# 13. Blog Module

## Blog Post Fields

- id
- title
- slug
- excerpt
- content
- thumbnail
- category_id
- tags
- author_id
- status: draft | published | scheduled
- published_at
- seo_title
- seo_description
- og_image
- created_at
- updated_at

## Features

Admin should be able to:

- Create blog post
- Edit blog post
- Delete blog post
- Save as draft
- Publish blog post
- Schedule blog post
- Add blog category
- Add tags
- Add SEO data
- Preview blog post

Example blog categories:

- Style Guide
- Fashion Tips
- Trend Report
- Brand Story
- Collection News

---

# 14. SEO Manager

The CMS should provide SEO fields for:

- Products
- Categories
- Collections
- Campaigns
- Lookbooks
- Pages
- Blog posts

## SEO Fields

- SEO title
- Meta description
- Slug
- Canonical URL
- Open Graph title
- Open Graph description
- Open Graph image
- Twitter card image
- Robots index/follow
- Schema type

## SEO Features

- Auto-generate slug from title
- Preview Google search result
- Preview social share card
- Detect missing SEO title
- Detect missing meta description
- Detect missing alt text
- Generate sitemap.xml
- Generate robots.txt
- Support 301 redirects

---

# 15. Inventory Management

## Features

Admin should be able to:

- View stock by product
- View stock by variant
- Update stock manually
- Import stock from CSV
- Export stock to CSV
- Set low stock threshold
- See low stock warning
- See sold out variants
- Track stock movement
- Support multiple warehouses in future

## Stock Movement Fields

- id
- variant_id
- type: import | export | adjustment | order | return
- quantity
- note
- created_by
- created_at

---

# 16. Order Management

## Order Fields

- id
- order_number
- customer_id
- customer_name
- customer_phone
- customer_email
- shipping_address
- subtotal
- discount_total
- shipping_fee
- grand_total
- payment_method
- payment_status
- order_status
- note
- created_at
- updated_at

## Order Item Fields

- id
- order_id
- product_id
- variant_id
- product_name
- color
- size
- sku
- quantity
- price
- total

## Order Status

- pending
- confirmed
- packing
- shipping
- completed
- cancelled
- refunded

## Features

Admin should be able to:

- View orders
- Search orders
- Filter orders by status
- View order detail
- Update order status
- Add internal note
- Print order
- Export orders
- Cancel order
- Refund order
- View customer history

---

# 17. Customer Management

## Customer Fields

- id
- name
- email
- phone
- birthday
- gender
- default_address
- total_orders
- total_spent
- customer_group
- tags
- note
- created_at

## Features

Admin should be able to:

- View customers
- Search customers
- View customer detail
- View order history
- Add customer note
- Add customer tags
- Segment customers
- Export customers

---

# 18. Promotion Management

## Promotion Fields

- id
- name
- code
- type: percentage | fixed_amount | free_shipping
- value
- min_order_value
- max_discount_value
- usage_limit
- used_count
- start_date
- end_date
- status

## Features

Admin should be able to:

- Create discount code
- Edit discount code
- Delete discount code
- Set usage limit
- Set date range
- Apply promotion to products
- Apply promotion to collections
- Apply promotion to customer groups
- Enable/disable promotion

---

# 19. Website Settings

## General Settings

- Store name
- Logo
- Favicon
- Default currency
- Contact email
- Contact phone
- Address
- Social links

## Theme Settings

- Primary color
- Secondary color
- Font family
- Button style
- Header layout
- Footer layout
- Product card layout
- Collection layout

## Navigation

Admin should be able to:

- Manage header menu
- Manage footer menu
- Add menu item
- Reorder menu item
- Add nested menu item
- Link menu to page, collection, category, or custom URL

---

# 20. User Roles and Permissions

## Roles

Create these default roles:

1. Super Admin
2. Brand Owner
3. Manager
4. Product Manager
5. Content Editor
6. Order Manager
7. Warehouse Staff
8. Marketing Staff
9. Viewer

## Permission Actions

Each module should support:

- view
- create
- update
- delete
- publish
- export
- manage_settings

## Permission Matrix

Super Admin:
- Full access

Brand Owner:
- Full access for own brand

Manager:
- Manage products, orders, customers, content

Product Manager:
- Manage products, categories, variants, inventory

Content Editor:
- Manage pages, blog, media, SEO

Order Manager:
- Manage orders and customers

Warehouse Staff:
- Manage inventory only

Marketing Staff:
- Manage campaigns, promotions, blog, SEO

Viewer:
- Read-only access

---

# 21. AI Content Assistant

The CMS should include an AI assistant for content generation.

## AI Features

Admin should be able to generate:

- Product description
- Short product description
- SEO title
- Meta description
- Blog post
- Collection description
- Campaign content
- Social media caption
- Product tags
- Outfit suggestions
- Size guide content
- Vietnamese to English translation
- English to Vietnamese translation

## AI Prompt Inputs

AI assistant should accept:

- Product name
- Category
- Material
- Color
- Fit type
- Target customer
- Brand tone
- Keywords
- Language
- Content length

## AI Output

AI should return editable content, not publish automatically.

---

# 22. Database Tables

Create these tables in Supabase:

- profiles
- roles
- permissions
- role_permissions
- brands
- categories
- products
- product_variants
- product_images
- colors
- sizes
- collections
- collection_products
- lookbooks
- lookbook_items
- campaigns
- campaign_products
- media_library
- pages
- page_sections
- blog_posts
- blog_categories
- blog_tags
- blog_post_tags
- customers
- orders
- order_items
- promotions
- promotion_products
- promotion_collections
- inventory_movements
- seo_redirects
- website_settings
- navigation_menus
- navigation_items

---

# 23. Suggested Database Schema

## products

Fields:

- id uuid primary key
- brand_id uuid
- category_id uuid
- name text
- slug text unique
- description text
- short_description text
- material text
- fit_type text
- care_instruction text
- base_price numeric
- sale_price numeric
- status text
- is_featured boolean default false
- is_new_arrival boolean default false
- is_best_seller boolean default false
- seo_title text
- seo_description text
- og_image text
- created_at timestamp
- updated_at timestamp

## product_variants

Fields:

- id uuid primary key
- product_id uuid references products(id)
- color_id uuid references colors(id)
- size_id uuid references sizes(id)
- sku text unique
- barcode text
- price numeric
- sale_price numeric
- stock_quantity integer
- low_stock_threshold integer
- image_url text
- status text
- created_at timestamp
- updated_at timestamp

## colors

Fields:

- id uuid primary key
- name text
- hex_code text
- slug text

## sizes

Fields:

- id uuid primary key
- name text
- slug text
- sort_order integer

## collections

Fields:

- id uuid primary key
- name text
- slug text unique
- description text
- banner_image text
- mobile_banner_image text
- seo_title text
- seo_description text
- status text
- start_date timestamp
- end_date timestamp
- sort_order integer
- created_at timestamp
- updated_at timestamp

## collection_products

Fields:

- id uuid primary key
- collection_id uuid references collections(id)
- product_id uuid references products(id)
- sort_order integer

## media_library

Fields:

- id uuid primary key
- file_name text
- file_url text
- file_type text
- file_size integer
- width integer
- height integer
- alt_text text
- folder text
- created_at timestamp

## pages

Fields:

- id uuid primary key
- title text
- slug text unique
- content jsonb
- status text
- seo_title text
- seo_description text
- og_image text
- created_at timestamp
- updated_at timestamp

## page_sections

Fields:

- id uuid primary key
- page_id uuid references pages(id)
- section_type text
- title text
- subtitle text
- content jsonb
- image_url text
- button_text text
- button_url text
- sort_order integer
- is_visible boolean default true

## blog_posts

Fields:

- id uuid primary key
- title text
- slug text unique
- excerpt text
- content text
- thumbnail text
- category_id uuid
- tags text[]
- status text
- published_at timestamp
- seo_title text
- seo_description text
- og_image text
- created_at timestamp
- updated_at timestamp

## orders

Fields:

- id uuid primary key
- order_number text unique
- customer_id uuid
- customer_name text
- customer_phone text
- customer_email text
- shipping_address text
- subtotal numeric
- discount_total numeric
- shipping_fee numeric
- grand_total numeric
- payment_method text
- payment_status text
- order_status text
- note text
- created_at timestamp
- updated_at timestamp

## order_items

Fields:

- id uuid primary key
- order_id uuid references orders(id)
- product_id uuid
- variant_id uuid
- product_name text
- color text
- size text
- sku text
- quantity integer
- price numeric
- total numeric

---

# 24. Admin UI Pages

Create these admin pages:

## Dashboard

Route:

/admin

## Products

Routes:

/admin/products
/admin/products/new
/admin/products/[id]/edit
/admin/products/[id]/variants
/admin/products/[id]/seo

## Categories

Routes:

/admin/categories

## Collections

Routes:

/admin/collections
/admin/collections/new
/admin/collections/[id]/edit

## Lookbooks

Routes:

/admin/lookbooks
/admin/lookbooks/new
/admin/lookbooks/[id]/edit

## Campaigns

Routes:

/admin/campaigns
/admin/campaigns/new
/admin/campaigns/[id]/edit

## Media

Route:

/admin/media

## Pages

Routes:

/admin/pages
/admin/pages/new
/admin/pages/[id]/edit

## Blog

Routes:

/admin/blog
/admin/blog/new
/admin/blog/[id]/edit

## Orders

Routes:

/admin/orders
/admin/orders/[id]

## Customers

Routes:

/admin/customers
/admin/customers/[id]

## Promotions

Routes:

/admin/promotions
/admin/promotions/new
/admin/promotions/[id]/edit

## Inventory

Route:

/admin/inventory

## Settings

Routes:

/admin/settings/general
/admin/settings/theme
/admin/settings/navigation
/admin/settings/users
/admin/settings/roles

## AI Assistant

Route:

/admin/ai-assistant

---

# 25. Frontend Website Pages

Create these public pages:

- /
- /products
- /products/[slug]
- /collections
- /collections/[slug]
- /lookbook
- /lookbook/[slug]
- /campaigns/[slug]
- /blog
- /blog/[slug]
- /about
- /contact
- /size-guide
- /shipping-policy
- /return-policy

---

# 26. Product Page Requirements

The product detail page should show:

- Product image gallery
- Color selector
- Size selector
- Price
- Sale price
- Product description
- Material
- Fit type
- Care instruction
- Size guide
- Stock status
- Add to cart button
- Related products
- Recently viewed products
- SEO metadata
- Open Graph metadata

---

# 27. Collection Page Requirements

The collection page should show:

- Collection banner
- Collection title
- Collection description
- Product grid
- Filter by size
- Filter by color
- Filter by price
- Sort by newest
- Sort by price
- Sort by best selling
- SEO metadata

---

# 28. Security Requirements

Implement:

- Supabase Auth
- Row Level Security
- Role-based access control
- Protected admin routes
- Server-side validation with Zod
- Input sanitization
- Image upload validation
- File type validation
- Rate limiting for AI endpoints
- Audit log for important admin actions

---

# 29. Audit Log

Create audit logging for:

- Product created
- Product updated
- Product deleted
- Product published
- Order status changed
- Inventory changed
- User role changed
- Promotion created
- Website settings changed

Audit log fields:

- id
- user_id
- action
- entity_type
- entity_id
- old_value
- new_value
- created_at

---

# 30. AI Coding Instructions

Please build the project step by step:

## Phase 1: Foundation

- Create Next.js project structure
- Setup Supabase client
- Setup authentication
- Setup admin layout
- Setup protected routes
- Setup database schema
- Setup role-based permissions

## Phase 2: Product CMS

- Build product CRUD
- Build category CRUD
- Build color CRUD
- Build size CRUD
- Build product variant system
- Build media upload
- Build product image gallery

## Phase 3: Content CMS

- Build collection CRUD
- Build lookbook CRUD
- Build campaign CRUD
- Build page builder
- Build blog module
- Build SEO manager

## Phase 4: Commerce CMS

- Build inventory module
- Build customer module
- Build order module
- Build promotion module

## Phase 5: AI Assistant

- Build AI assistant page
- Create API route for AI content generation
- Add product description generator
- Add SEO generator
- Add blog generator
- Add translation feature

## Phase 6: Polish

- Improve UI/UX
- Add loading states
- Add empty states
- Add error states
- Add confirmation dialogs
- Add toast notifications
- Add responsive admin UI
- Add audit log
- Add data export

---

# 31. UI Design Direction

The admin UI should feel:

- Clean
- Premium
- Minimal
- Fashion-oriented
- Modern SaaS
- Easy to use
- Similar to Shopify Admin but more elegant

Use:

- White background
- Neutral gray layout
- Large product image previews
- Clean data tables
- Rounded cards
- Clear status badges
- Modern sidebar navigation
- Beautiful form layout
- Drag and drop section builder if possible

---

# 32. Important Requirements

- Use TypeScript everywhere
- Use server actions where suitable
- Use Zod for validation
- Use Supabase RLS
- Use reusable components
- Keep components clean and modular
- Do not hardcode demo data inside business logic
- Create seed data separately
- Make admin panel mobile-friendly
- Make public website SEO-friendly
- Optimize image loading
- Support future multi-brand architecture
- Keep database schema scalable

---

# 33. Deliverables

The final project should include:

- Admin CMS
- Public fashion website
- Product variant system
- Collection system
- Blog system
- SEO system
- Media library
- AI content assistant
- Role-based permissions
- Supabase database schema
- Clean UI components
- Deployment-ready Next.js app
