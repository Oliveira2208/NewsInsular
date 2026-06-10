-- =============================================
-- MIGRATION 014: Add Environmental Interests Fields
-- =============================================

ALTER TABLE people ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Venezuela';
ALTER TABLE people ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE people ADD COLUMN IF NOT EXISTS participation_type TEXT CHECK (participation_type IN ('digital_activist', 'field_volunteer', 'coordinator', 'expert_leader'));
ALTER TABLE people ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS experience_proposal TEXT;

-- Update RLS policy to include new fields
DROP POLICY IF EXISTS "people_public_read" ON people;
DROP POLICY IF EXISTS "people_public_update" ON people;
DROP POLICY IF EXISTS "people_public_insert" ON people;

CREATE POLICY "people_public_read" ON people FOR SELECT USING (true);
CREATE POLICY "people_public_insert" ON people FOR INSERT WITH CHECK (true);
CREATE POLICY "people_public_update" ON people FOR UPDATE USING (true);