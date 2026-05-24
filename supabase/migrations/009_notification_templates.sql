-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT,
  notification_type TEXT DEFAULT 'email_push',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO notification_templates (name, title_template, body_template, notification_type) VALUES
  ('Nueva Noticia', '📰 {title}', 'Se ha publicado una nueva noticia: {title}', 'email_push'),
  ('Alerta General', '🔔 Alerta', '{body}', 'push_only'),
  ('Recordatorio', '⏰ Recordatorio', '{body}', 'email_push'),
  ('Actualización', '🔄 Actualización', '{body}', 'email_push');