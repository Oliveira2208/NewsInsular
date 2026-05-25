-- =============================================
-- MIGRATION 013: Fix People Table
-- =============================================

-- Step 1: Drop old table (if exists, CASCADE handles dependencies)
DROP TABLE IF EXISTS people CASCADE;

-- Note: The old notifications table was already replaced by 
-- notification_history in migration 004, so no FK cleanup needed here

-- Step 2: Recreate with new structure
CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  identity_doc TEXT UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  state_id INTEGER REFERENCES states(id),
  municipality_id INTEGER REFERENCES municipalities(id),
  parish_id INTEGER REFERENCES parishes(id),
  commune_id INTEGER REFERENCES communes(id),
  address TEXT NOT NULL,
  push_token TEXT,
  notifications_email BOOLEAN DEFAULT true,
  unsubscribe_token TEXT UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Step 3: Create indexes
CREATE INDEX idx_people_deleted_at ON people(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_people_state ON people(state_id);
CREATE INDEX idx_people_municipality ON people(municipality_id);
CREATE INDEX idx_people_parish ON people(parish_id);
CREATE INDEX idx_people_commune ON people(commune_id);
CREATE INDEX idx_people_identity ON people(identity_doc) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_email ON people(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_unsubscribe ON people(unsubscribe_token);

-- Step 4: Enable RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
CREATE POLICY "people_public_read" ON people FOR SELECT USING (true);
CREATE POLICY "people_public_update" ON people FOR UPDATE USING (true);
CREATE POLICY "people_admin_write" ON people FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- NOTIFICATION HISTORY: Add news_id for tracking
-- =============================================

ALTER TABLE notification_history ADD COLUMN IF NOT EXISTS news_id UUID REFERENCES news(id) ON DELETE SET NULL;