-- Drop old notifications table
DROP TABLE IF EXISTS notifications;

-- Create notification_history table for logging sent notifications
CREATE TABLE notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid REFERENCES news(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  notification_type text NOT NULL DEFAULT 'email_push' CHECK (notification_type IN ('email_push', 'email_only', 'push_only', 'custom')),
  recipients_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create notification_settings table for customizable notification formats
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_history
CREATE POLICY "notification_history_public_read" ON notification_history FOR SELECT USING (true);
CREATE POLICY "notification_history_admin_write" ON notification_history FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for notification_settings
CREATE POLICY "notification_settings_public_read" ON notification_settings FOR SELECT USING (true);
CREATE POLICY "notification_settings_admin_write" ON notification_settings FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_notification_history_news ON notification_history(news_id);
CREATE INDEX idx_notification_history_created ON notification_history(created_at DESC);

-- Insert default notification settings
INSERT INTO notification_settings (key, value, description) VALUES
  ('email_subject_template', '📰 {title}', 'Plantilla para asunto del email. Usa {title} para el título de la noticia.'),
  ('email_body_template', 'Se ha publicado una nueva noticia:\n\n{title}\n\n{summary}\n\nLeer más: {url}', 'Plantilla para cuerpo del email. Usa {title}, {summary}, {url}.'),
  ('push_title_template', '{title}', 'Plantilla para título del push. Usa {title}.'),
  ('push_body_template', '{summary}', 'Plantilla para cuerpo del push. Usa {summary}.'),
  ('app_name', 'NewsInsular', 'Nombre de la aplicación en las notificaciones');