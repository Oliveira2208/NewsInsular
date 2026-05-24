-- Add deleted_at column for soft delete
ALTER TABLE news ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for filtering soft-deleted news
CREATE INDEX IF NOT EXISTS idx_news_deleted_at ON news(deleted_at) WHERE deleted_at IS NOT NULL;