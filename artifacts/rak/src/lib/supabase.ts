import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xokmlkgpqaliyksxpaaw.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
