-- Create news_templates table
CREATE TABLE IF NOT EXISTS news_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  summary_template TEXT,
  content_template TEXT,
  default_category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO news_templates (name, summary_template, content_template) VALUES
  ('Noticia Standard', NULL, '# {title}\n\n{summary}\n\n## Contenido\n\nEscribe aquí el contenido de la noticia...\n\n## Conclusión\n\n'),
  ('Noticia Breve', NULL, '# {title}\n\n{summary}\n\n'),
  ('Comunicado Oficial', NULL, '# COMUNICADO OFICIAL\n\n**Fecha:** {date}\n\nSe comunica a la población de Nueva Esparta que...\n\n'),
  ('Evento', NULL, '# Evento: {title}\n\n📅 **Fecha:** \n📍 **Lugar:** \n\n## Descripción\n\n{summary}\n\n## Programa\n\n1. \n2. \n3. \n\n## Informes\n\nContactos: ');