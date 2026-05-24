-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- News table
CREATE TABLE news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,
  content text NOT NULL,
  published boolean DEFAULT false,
  category_id uuid REFERENCES categories(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_id uuid REFERENCES auth.users(id)
);

-- News images table
CREATE TABLE news_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid REFERENCES news(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- People table
CREATE TABLE people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  identity_doc text UNIQUE NOT NULL,
  birth_date date NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  state text NOT NULL,
  municipality text NOT NULL,
  parish text NOT NULL,
  commune text NOT NULL,
  address text NOT NULL,
  push_token text,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  news_id uuid REFERENCES news(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- categories: public read, admin write
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON categories FOR ALL USING (
  auth.role() = 'authenticated'
);

-- news: public read published, admin write
CREATE POLICY "news_public_read" ON news FOR SELECT USING (published = true);
CREATE POLICY "news_admin_all" ON news FOR ALL USING (auth.role() = 'authenticated');

-- news_images: public read for published news
CREATE POLICY "news_images_public_read" ON news_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM news WHERE news.id = news_images.news_id AND news.published = true
  )
);
CREATE POLICY "news_images_admin_all" ON news_images FOR ALL USING (auth.role() = 'authenticated');

-- people: admin only
CREATE POLICY "people_admin_all" ON people FOR ALL USING (auth.role() = 'authenticated');

-- notifications: per person
CREATE POLICY "notifications_own_read" ON notifications FOR SELECT USING (
  person_id = auth.uid()
);
CREATE POLICY "notifications_admin_all" ON notifications FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_news_category ON news(category_id);
CREATE INDEX idx_news_published ON news(published);
CREATE INDEX idx_news_created ON news(created_at DESC);
CREATE INDEX idx_news_images_news ON news_images(news_id);
CREATE INDEX idx_notifications_person ON notifications(person_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;