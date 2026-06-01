---
name: Supabase Vite injection
description: How to reliably expose Supabase secrets to Vite frontend in this monorepo — the .env and artifact.toml approaches don't work, use vite.config.ts define block.
---

## Rule

Inject Supabase (and any other secrets) into the Vite frontend via the `define` block in `vite.config.ts`, reading directly from `process.env` (Replit shell secrets).

**Why:** In this monorepo setup:
- `.env` files in the artifact directory are not reliably picked up because Vite's dep optimizer caches old values and the workflow doesn't always restart clean.
- `artifact.toml` `[services.env]` values like `VITE_SUPABASE_URL = "${SUPABASE_URL}"` are treated as literal strings, not shell interpolations.
- Only `process.env` (available at Vite config evaluation time) reliably contains Replit secrets.

**How to apply:**

```ts
export default defineConfig(async ({ mode }) => {
  const supabaseUrl = process.env.SUPABASE_URL?.startsWith("http")
    ? process.env.SUPABASE_URL
    : "https://<project-ref>.supabase.co";  // fallback if secret is wrong format
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
    },
    // ... rest of config
  };
});
```

The function form must be `async` if the plugins section uses `await`.
