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
};
