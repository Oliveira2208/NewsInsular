-- =============================================
-- MIGRATION 010: News Templates
-- =============================================

CREATE TABLE IF NOT EXISTS news_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  summary_template TEXT,
  content_template TEXT,
  default_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE news_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_templates_public_read" ON news_templates;
DROP POLICY IF EXISTS "news_templates_admin_write" ON news_templates;
CREATE POLICY "news_templates_public_read" ON news_templates FOR SELECT USING (true);
CREATE POLICY "news_templates_admin_write" ON news_templates FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- SEED 010: News Templates (4 templates)
-- =============================================

INSERT INTO news_templates (name, summary_template, content_template) VALUES
  ('Noticia Standard', NULL, '<h1>{title}</h1><p><strong>{summary}</strong></p><h2>Contenido</h2><p>Escribe aquí el contenido de la noticia...</p><h2>Conclusión</h2><p></p>'),
  ('Noticia Breve', NULL, '<h1>{title}</h1><p>{summary}</p>'),
  ('Comunicado Oficial', NULL, '<h1>COMUNICADO OFICIAL</h1><p><strong>Fecha:</strong> {date}</p><p>Se comunica a la población de Nueva Esparta que...</p>'),
  ('Evento', NULL, '<h1>Evento: {title}</h1><p><strong>📅 Fecha:</strong> </p><p><strong>📍 Lugar:</strong> </p><h2>Descripción</h2><p>{summary}</p><h2>Programa</h2><ol><li></li><li></li><li></li></ol><h2>Informes</h2><p>Contactos: </p>')
ON CONFLICT DO NOTHING;