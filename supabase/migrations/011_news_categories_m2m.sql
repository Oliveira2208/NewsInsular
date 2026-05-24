-- =============================================
-- MIGRATION 011: News Categories (Many-to-Many)
-- =============================================

CREATE TABLE IF NOT EXISTS news_categories (
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (news_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_news_categories_news ON news_categories(news_id);
CREATE INDEX IF NOT EXISTS idx_news_categories_category ON news_categories(category_id);

ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_categories_public_read" ON news_categories FOR SELECT USING (true);
CREATE POLICY "news_categories_admin_write" ON news_categories FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- MIGRATE: Existing single category assignments
-- (Migrate from old single category to many-to-many)
-- =============================================

INSERT INTO news_categories (news_id, category_id, position)
SELECT id, category_id, 0
FROM news
WHERE category_id IS NOT NULL
ON CONFLICT (news_id, category_id) DO NOTHING;