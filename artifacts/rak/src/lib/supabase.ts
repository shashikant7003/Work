import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://xokmlkgpqaliyksxpaaw.supabase.co";

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Video = {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  duration: string;
  featured: boolean;
  is_locked: boolean;
  project_password: string;
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
