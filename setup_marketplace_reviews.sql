-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT CHECK (order_type IN ('rent','sale')) NOT NULL,
  order_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  subject_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT different_users CHECK (author_id != subject_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_order ON marketplace_reviews(order_type, order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_author ON marketplace_reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_subject ON marketplace_reviews(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_created_at ON marketplace_reviews(created_at);

-- Enable RLS
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read reviews they wrote or received" ON marketplace_reviews
  FOR SELECT USING (auth.uid() = author_id OR auth.uid() = subject_user_id);

CREATE POLICY "Users can create reviews as authors" ON marketplace_reviews
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own reviews" ON marketplace_reviews
  FOR UPDATE USING (auth.uid() = author_id);

-- Test the table
SELECT 'Marketplace reviews table created successfully!' as status;
