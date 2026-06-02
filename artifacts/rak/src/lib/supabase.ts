import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://xokmlkgpqaliyksxpaaw.supabase.co";

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Public-safe video shape — project_password is intentionally omitted
// (column-level DB security + explicit SELECT column lists enforce this)
export type Video = {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  duration: string;
  featured: boolean;
  is_locked: boolean;
  /** Only present in admin queries. Never returned by public SELECT. */
  project_password?: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Admin = {
  id: string;
  email: string;
};

/** Columns safe to return to public (unauthenticated) users */
export const PUBLIC_VIDEO_COLUMNS =
  "id, title, youtube_url, thumbnail_url, category, duration, featured, is_locked, created_at" as const;

/** All columns — only for authenticated admin queries */
export const ADMIN_VIDEO_COLUMNS = "*" as const;
