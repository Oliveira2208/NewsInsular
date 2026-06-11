-- Fix news.author_id to reference better-auth user table
-- Previously referenced auth.users(id) (Supabase Auth), now references public.user(id) (better-auth)

ALTER TABLE news DROP CONSTRAINT IF EXISTS news_author_id_fkey;

ALTER TABLE news ALTER COLUMN author_id TYPE TEXT USING author_id::text;

ALTER TABLE news ADD CONSTRAINT news_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE SET NULL;
