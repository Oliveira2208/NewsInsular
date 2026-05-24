-- Remove slug from news table since we'll use id (uuid) for URLs instead
ALTER TABLE news DROP COLUMN IF EXISTS slug;

-- Create index on id for better performance
CREATE INDEX IF NOT EXISTS idx_news_id ON news(id);