CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bật RLS (Row Level Security)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc public đối với các bài đánh giá đã được duyệt
CREATE POLICY "Allow public read access to product_reviews"
  ON product_reviews FOR SELECT
  USING (status = 'published');

-- Cho phép các service / admin toàn quyền
CREATE POLICY "Allow full access for service role"
  ON product_reviews USING (true);
