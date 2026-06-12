-- =============================================
-- MIGRATION 017: Allow public INSERT on people
-- =============================================
-- After migrating from Supabase Auth to better-auth,
-- the old RLS policy required auth.role() = 'authenticated'
-- which no longer applies. Allow anonymous inserts for
-- public registration.

CREATE POLICY IF NOT EXISTS "people_public_insert" ON people
  FOR INSERT
  WITH CHECK (true);
