-- =============================================
-- MIGRATION 008: Soft Delete
-- =============================================

ALTER TABLE news ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_news_deleted_at ON news(deleted_at) WHERE deleted_at IS NOT NULL;