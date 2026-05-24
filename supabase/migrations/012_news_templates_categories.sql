-- =============================================
-- MIGRATION 012: News Templates Categories (Many-to-Many)
-- =============================================

CREATE TABLE IF NOT EXISTS news_templates_categories (
  template_id UUID REFERENCES news_templates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (template_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_news_templates_categories_template ON news_templates_categories(template_id);
CREATE INDEX IF NOT EXISTS idx_news_templates_categories_category ON news_templates_categories(category_id);

ALTER TABLE news_templates_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_templates_categories_public_read" ON news_templates_categories FOR SELECT USING (true);
CREATE POLICY "news_templates_categories_admin_write" ON news_templates_categories FOR ALL USING (auth.role() = 'authenticated');

-- Remove old default_category_id column if exists
ALTER TABLE news_templates DROP COLUMN IF EXISTS default_category_id;