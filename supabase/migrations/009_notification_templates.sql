-- =============================================
-- MIGRATION 009: Notification Templates
-- =============================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT,
  notification_type TEXT DEFAULT 'email_push' CHECK (notification_type IN ('email_push', 'email_only', 'push_only', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_templates_public_read" ON notification_templates;
DROP POLICY IF EXISTS "notification_templates_admin_write" ON notification_templates;
CREATE POLICY "notification_templates_public_read" ON notification_templates FOR SELECT USING (true);
CREATE POLICY "notification_templates_admin_write" ON notification_templates FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- SEED 009: Notification Templates (4 templates)
-- =============================================

INSERT INTO notification_templates (name, title_template, body_template, notification_type) VALUES
  ('Nueva Noticia', '📰 {title}', '<h1>{title}</h1><p>{summary}</p><p>Leer más: <a href="{url}">aquí</a></p>', 'email_push'),
  ('Alerta General', '🔔 Alerta', '<p>{body}</p>', 'push_only'),
  ('Recordatorio', '⏰ Recordatorio', '<p>{body}</p>', 'email_push'),
  ('Actualización', '🔄 Actualización', '<p>{body}</p>', 'email_push')
ON CONFLICT DO NOTHING;