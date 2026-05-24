-- =============================================
-- MIGRATION 007: Scheduled Publishing
-- =============================================

ALTER TABLE news ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE news ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_news_scheduled_for ON news(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_scheduled_publish ON news(scheduled_for, published) WHERE published = false;