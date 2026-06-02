-- RAK Portfolio — Database Schema + Security Migration
-- Run in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- Safe to run multiple times (all statements use IF NOT EXISTS / OR REPLACE)

-- ══════════════════════════════════════════════════════════════════
-- STEP 1: Add missing columns
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_password text NOT NULL DEFAULT '';

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '';

UPDATE categories
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug = '';

-- ══════════════════════════════════════════════════════════════════
-- STEP 2: Enable Row Level Security on all tables
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE videos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins   ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════
-- STEP 3: Drop any old policies to avoid conflicts on re-run
-- ══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "anyone_read_videos"        ON videos;
DROP POLICY IF EXISTS "admin_insert_videos"       ON videos;
DROP POLICY IF EXISTS "admin_update_videos"       ON videos;
DROP POLICY IF EXISTS "admin_delete_videos"       ON videos;

DROP POLICY IF EXISTS "anyone_read_categories"    ON categories;
DROP POLICY IF EXISTS "admin_insert_categories"   ON categories;
DROP POLICY IF EXISTS "admin_update_categories"   ON categories;
DROP POLICY IF EXISTS "admin_delete_categories"   ON categories;

DROP POLICY IF EXISTS "admin_read_own_row"        ON admins;

-- ══════════════════════════════════════════════════════════════════
-- STEP 4: videos policies
--   Public  → SELECT only (anon + authenticated)
--   Admins  → INSERT / UPDATE / DELETE (authenticated + in admins table)
-- ══════════════════════════════════════════════════════════════════
CREATE POLICY "anyone_read_videos"
  ON videos FOR SELECT
  USING (true);

CREATE POLICY "admin_insert_videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE email = auth.email()));

CREATE POLICY "admin_update_videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.email()));

CREATE POLICY "admin_delete_videos"
  ON videos FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.email()));

-- ══════════════════════════════════════════════════════════════════
-- STEP 5: categories policies (same pattern)
-- ══════════════════════════════════════════════════════════════════
CREATE POLICY "anyone_read_categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "admin_insert_categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE email = auth.email()));

CREATE POLICY "admin_update_categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.email()));

CREATE POLICY "admin_delete_categories"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.email()));

-- ══════════════════════════════════════════════════════════════════
-- STEP 6: admins policies — each admin can only read their own row
-- ══════════════════════════════════════════════════════════════════
CREATE POLICY "admin_read_own_row"
  ON admins FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- ══════════════════════════════════════════════════════════════════
-- STEP 7: Column-level security — hide project_password from anon
--   Revoke broad SELECT from anon, re-grant only safe columns.
--   Authenticated users (admins) keep full access.
-- ══════════════════════════════════════════════════════════════════
REVOKE SELECT ON videos FROM anon;
GRANT  SELECT (id, title, youtube_url, thumbnail_url, category, duration,
               featured, is_locked, created_at)
  ON videos TO anon;

-- ══════════════════════════════════════════════════════════════════
-- STEP 8: Server-side password verification function
--   Uses SECURITY DEFINER so it can read project_password even
--   though the anon role cannot query that column directly.
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_video_password(video_id uuid, attempt text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   videos
    WHERE  id               = video_id
    AND    is_locked        = true
    AND    project_password = attempt
    AND    attempt         <> ''
  );
$$;

-- Allow anon + authenticated to call the function (password value never leaves DB)
GRANT EXECUTE ON FUNCTION check_video_password(uuid, text) TO anon, authenticated;
