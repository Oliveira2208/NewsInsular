-- Add scheduled_for column for future publishing
ALTER TABLE news ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Add published_at to track actual publish time
ALTER TABLE news ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for efficient queries on scheduled news
CREATE INDEX IF NOT EXISTS idx_news_scheduled_for ON news(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Create index for efficient queries on scheduled news that need publishing
CREATE INDEX IF NOT EXISTS idx_news_scheduled_publish ON news(scheduled_for, published) WHERE published = false;