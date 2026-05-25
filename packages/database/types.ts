export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  branding?: any;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  
  // Storefront fields
  storefront_enabled?: boolean;
  storefront_slug?: string;
  storefront_custom_domain?: string;
  custom_domain_verified?: boolean;
  custom_domain_verification_token?: string;
  custom_domain_status?: string;
  storefront_settings?: any;
  default_online_branch_id?: string;
  
  // Block engine fields (Phase 2)
  storefront_theme: string;
  storefront_features: any;
  storefront_custom_css?: string | null;
  storefront_custom_head?: string | null;
  storefront_block_whitelist: any;
};

export type StorefrontBlockOverride = {
  tenant_id: string;
  block_type: string;
  props: any;
  updated_at: string;
};

export type Branch = {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  phone?: string;
  is_main_branch: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  organization_id: string;
  category_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  sku?: string;
  barcode?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Storefront fields
  is_published_online?: boolean;
  online_price?: number;
  online_description?: string;
  online_images?: any;
  online_slug?: string;
  seo_title?: string;
  seo_description?: string;
  size_guide?: string;
};

export type Category = {
  id: string;
  organization_id: string;
  name: string;
  is_published_online?: boolean;
  online_image_url?: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  organization_id: string;
  branch_id?: string;
  customer_id?: string;
  order_number: string;
  source?: 'pos' | 'online';
  online_status?: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: string;
  customer_email?: string;
  shipping_address?: any;
  customer_note?: string;
  cart_token?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Color = {
  id: string;
  organization_id: string;
  name: string;
  hex_code: string;
  slug: string;
  created_at: string;
};

export type Size = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price: number;
  image_url?: string;
  attributes: any;
  created_at: string;
  
  // Fashion fields
  color_id?: string;
  size_id?: string;
  sale_price?: number;
  low_stock_threshold: number;
  status: 'active' | 'inactive' | 'sold_out';
};

export type Collection = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  banner_image?: string;
  mobile_banner_image?: string;
  seo_title?: string;
  seo_description?: string;
  status: 'draft' | 'published' | 'hidden' | 'archived';
  start_date?: string;
  end_date?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CollectionProduct = {
  id: string;
  collection_id: string;
  product_id: string;
  sort_order: number;
};

export type Lookbook = {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description?: string;
  cover_image?: string;
  status: 'draft' | 'published' | 'hidden';
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
};

export type LookbookItem = {
  id: string;
  lookbook_id: string;
  image_url: string;
  title?: string;
  description?: string;
  linked_product_ids: string[];
  sort_order: number;
};

export type Campaign = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  banner_image?: string;
  landing_page_content: any;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'active' | 'ended' | 'archived';
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
};

export type CampaignProduct = {
  id: string;
  campaign_id: string;
  product_id: string;
  sort_order: number;
};

export type BlogCategory = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  created_at: string;
};

export type BlogPost = {
  id: string;
  organization_id: string;
  category_id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  thumbnail?: string;
  tags: string[];
  author_id?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  created_at: string;
  updated_at: string;
};

export type Promotion = {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_order_value: number;
  max_discount_value: number;
  usage_limit: number;
  used_count: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
};

export type SeoRedirect = {
  id: string;
  organization_id: string;
  source_path: string;
  target_path: string;
  status_code: number;
  created_at: string;
};

export type NavigationMenu = {
  id: string;
  organization_id: string;
  name: string;
  location: string;
  created_at: string;
};

export type NavigationItem = {
  id: string;
  menu_id: string;
  parent_id?: string;
  label: string;
  type: 'home' | 'collection' | 'category' | 'lookbook' | 'blog' | 'page' | 'custom_url';
  link_target?: string;
  sort_order: number;
  created_at: string;
};

