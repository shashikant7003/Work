# RAK — Video Editor Portfolio

A premium full-stack portfolio website for RAK, a professional video editor. Features a dark glassmorphism design with a public-facing portfolio and a secure admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/rak run dev` — run the RAK frontend (port 18483)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + wouter
- Backend DB/Auth: Supabase (PostgreSQL + Auth)
- UI: shadcn/ui, lucide-react, react-icons, framer-motion
- API: Express 5 (health/status only; data comes from Supabase directly)

## Where things live

- `artifacts/rak/src/` — RAK portfolio frontend
- `artifacts/rak/src/lib/supabase.ts` — Supabase client + types
- `artifacts/rak/src/context/AuthContext.tsx` — Supabase auth context
- `artifacts/rak/src/pages/Home.tsx` — public portfolio page
- `artifacts/rak/src/pages/AdminLogin.tsx` — admin sign-in
- `artifacts/rak/src/pages/AdminDashboard.tsx` — admin video management
- `artifacts/rak/src/components/` — Navbar, Hero, FeaturedVideos, VideoGallery, VideoModal, AboutSection, ContactSection, Footer
- `artifacts/rak/.env` — Vite env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- `artifacts/rak/vite.config.ts` — injects Supabase creds via `define` from shell env

## Architecture decisions

- Supabase is used directly from the frontend (no proxy through Express). The Express API server is only used for health checks.
- Supabase credentials are injected into Vite at build time via `vite.config.ts` `define` block, reading from `SUPABASE_URL` and `SUPABASE_ANON_KEY` shell secrets.
- Admin access is a two-step check: (1) Supabase Auth login, (2) email existence check against the `admins` table. If not in admins table, the session is immediately invalidated.
- The `SUPABASE_URL` secret was provided as a publishable key (not an HTTPS URL). The real project URL `https://xokmlkgpqaliyksxpaaw.supabase.co` is hardcoded as a fallback in `vite.config.ts`.
- YouTube thumbnails are auto-derived from the video ID if no thumbnail_url is provided.

## Product

- **Public**: Hero, Featured Videos, Video Gallery (search + category filter + grid/list view), About, Contact (Instagram/Gmail/WhatsApp)
- **Admin**: Secure login → video CRUD (add/edit/delete/featured toggle), category selection

## User preferences

_Populate as you build._

## Gotchas

- `SUPABASE_URL` secret contains a publishable key (not an HTTPS URL). The correct Supabase project URL is derived from the anon key JWT and hardcoded as fallback in vite.config.ts.
- Always run `pnpm --filter @workspace/rak run dev` via the workflow, not directly — it needs PORT and BASE_PATH.
- After secrets change, both the `.env` file and `vite.config.ts` define block must be updated.
- Vite dep cache (`node_modules/.vite`) must be cleared if Supabase URL changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
