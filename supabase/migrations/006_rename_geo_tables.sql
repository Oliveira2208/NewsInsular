-- Rename tables to English and add RLS

-- Rename tables
ALTER TABLE estados RENAME TO states;
ALTER TABLE municipios RENAME TO municipalities;
ALTER TABLE parroquias RENAME TO parishes;
ALTER TABLE comunas RENAME TO communes;

-- Rename columns to English
ALTER TABLE states RENAME COLUMN nombre TO name;
ALTER TABLE municipalities RENAME COLUMN nombre TO name;
ALTER TABLE municipalities RENAME COLUMN estado_id TO state_id;
ALTER TABLE parishes RENAME COLUMN nombre TO name;
ALTER TABLE parishes RENAME COLUMN municipio_id TO municipality_id;
ALTER TABLE communes RENAME COLUMN nombre TO name;
ALTER TABLE communes RENAME COLUMN municipio_id TO municipality_id;

-- Enable RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - public read
CREATE POLICY "states_public_read" ON states FOR SELECT USING (true);
CREATE POLICY "municipalities_public_read" ON municipalities FOR SELECT USING (true);
CREATE POLICY "parishes_public_read" ON parishes FOR SELECT USING (true);
CREATE POLICY "communes_public_read" ON communes FOR SELECT USING (true);

-- RLS Policies - admin write
CREATE POLICY "states_admin_write" ON states FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "municipalities_admin_write" ON municipalities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "parishes_admin_write" ON parishes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "communes_admin_write" ON communes FOR ALL USING (auth.role() = 'authenticated');