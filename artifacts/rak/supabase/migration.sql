-- RAK Portfolio — required schema migration
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run

-- 1. Add missing columns to videos table
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_password text NOT NULL DEFAULT '';

-- 2. Add missing column to categories table
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '';

-- 3. Backfill slug for any existing categories
UPDATE categories
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug = '';

-- 4. Ensure RLS allows authenticated users to perform CRUD on videos
--    (skip if you want fully public write access — the anon key already works)
-- ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "authenticated can manage videos" ON videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "authenticated can manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
