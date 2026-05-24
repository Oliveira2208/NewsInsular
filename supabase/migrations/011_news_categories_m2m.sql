-- Create news_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS news_categories (
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (news_id, category_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_news_categories_news ON news_categories(news_id);
CREATE INDEX IF NOT EXISTS idx_news_categories_category ON news_categories(category_id);

-- Migrate existing single category assignments
INSERT INTO news_categories (news_id, category_id, position)
SELECT id, category_id, 0
FROM news
WHERE category_id IS NOT NULL
ON CONFLICT (news_id, category_id) DO NOTHING;

-- Drop the old foreign key constraint and column (we'll do this separately)
-- ALTER TABLE news DROP CONSTRAINT IF EXISTS news_category_id_fkey;
-- ALTER TABLE news DROP COLUMN IF EXISTS category_id;