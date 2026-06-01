---
name: RAK Supabase URL quirk
description: The SUPABASE_URL secret for the RAK project contains a publishable key string, not an HTTPS URL. Real project URL derived from anon key JWT.
---

## Rule

The `SUPABASE_URL` secret value is `sb_publishable_nsnSx0zVy5WzdjZzh4xrTw_bfu_odTz` — a publishable key format, NOT a valid HTTPS URL.

The real Supabase project URL is: `https://xokmlkgpqaliyksxpaaw.supabase.co`

This was derived by decoding the `SUPABASE_ANON_KEY` JWT payload to extract the `ref` field: `xokmlkgpqaliyksxpaaw`.

**Why:** Supabase has a new "publishable key" format alongside the classic project URL. The user stored the publishable key as `SUPABASE_URL` instead of the project URL.

**How to apply:** In `vite.config.ts`, check if the URL starts with "http" before using it; hardcode the real URL as fallback:

```ts
const supabaseUrl = process.env.SUPABASE_URL?.startsWith("http")
  ? process.env.SUPABASE_URL
  : "https://xokmlkgpqaliyksxpaaw.supabase.co";
```

If the user ever updates `SUPABASE_URL` to the correct HTTPS format, the fallback won't be needed.
