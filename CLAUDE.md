# CLAUDE.md — Virtual Skills

Product name: **Virtual Skills** (always use this name in UI, titles, docs).
Spec: [AI Repository Hub Implementation Blueprint.md](AI%20Repository%20Hub%20Implementation%20Blueprint.md) — source of truth for scope, taxonomy, policies.

## What it is
Discovery hub for AI resources: skills, MCP servers, agents, models, datasets, tools, open-source repos.
Public browse/search + optional accounts (bookmarks) + admin-curated catalog + GitHub metadata import/sync.

## Stack
- `frontend/` — React + Vite + TypeScript + Tailwind v4 + React Router + TanStack Query.
- `backend/` — Node.js + Express + TypeScript (run via `tsx`), Zod validation, helmet, express-rate-limit.
- DB — **SQLite via built-in `node:sqlite`** for MVP (no Postgres/Docker available locally).
  All SQL lives in `backend/src/database/`. Keep it there so a Postgres swap only touches that layer.
- Auth — bcrypt password hash, JWT in HTTP-only `SameSite=Strict` cookie. Mutating requests must send
  `X-Requested-With: virtual-skills` header (CSRF guard).

## Commands (run from repo root)
- `npm install` — installs both workspaces.
- `npm run seed` — reset DB + seed categories, tags, curated resources, admin user.
- `npm run seed:add` — insert only missing curated categories/resources (no reset, keeps users/bookmarks).
- `npm run dev` — backend :5000 + frontend :5173 (Vite proxies `/api`).
- `npm test` — backend unit tests (vitest).
- `npm run build` — typecheck + build frontend.

Default seeded admin: `admin@virtualskills.local` / `ChangeMe123!` — dev only, change in prod.

## Hard rules (from blueprint)
- Never execute/install imported repos or third-party code.
- Never invent metadata. Unknown stars/license/etc → `null` → UI shows "Not provided" / "License: Unknown — check source terms".
- Unknown license ≠ open source. Download button only when provider supports + license known.
- Always show original source URL + last-synced date. External links labelled, `rel="noopener noreferrer"`.
- Provider logic only in `backend/src/providers/<name>/`. Imports only from allowed hosts (github.com). No arbitrary URL fetch (SSRF).
- Admin routes protected on **server** (`requireAdmin` middleware), not just hidden in UI.
- Imported text is untrusted: render as plain text, never `dangerouslySetInnerHTML`.
- Secrets only in `backend/.env` (never commit). `.env.example` documents vars.
- Do not claim features done without code + tests present. No fake buttons / placeholder success responses.

## Layout
```
backend/src/
  app.ts, server.ts
  config/          env loading
  database/        db.ts (schema+migrations), seed.ts, repositories (SQL)
  middleware/      auth, error handler
  modules/         auth, resources, categories, bookmarks, admin
  providers/github adapter (URL parse, fetch, normalize)
  utils/           slug, url canonicalize, download policy
frontend/src/
  components/      layout, resources, common
  pages/           public, account, admin
  lib/             api client, auth context
```

## Site sections (v1.3, from WEBSITE_UPGRADE_PROMPT.md)
- Header = `frontend/src/data/nav.ts`: About Us · Our Resources ▾ · Our Repository · Our Applications · Our Projects · Contact Us + "Get in Touch".
- Editable content lives in `frontend/src/data/`: `resources.json` (topics → `/topics/:slug`), `apps.json`, `projects.json`, `site.ts` (owner, links), `repoSections.ts` (category → Repository section).
- Repos stay in the DB (admin import/sync). Repository sections are derived from each repo's single category; unmapped categories → "Others".
- `/resources/:slug` is still a single repo detail page (old links); topic pages use `/topics/:slug`.
- Adding a topic: add it to `resources.json` AND `TOPIC_SLUGS` in `backend/src/modules/sitemap.ts` (test enforces).
- After editing external URLs: `npm run verify-links -w frontend`.
- Contact form → `POST /api/v1/contact` → `contact_messages` table → Admin → Messages.

## Conventions
- API prefix `/api/v1`. JSON errors `{ error: string, details? }`.
- Server-side pagination: `page`, `limit` (max 50).
- Audit log every admin mutation.
- Light theme default, blue accent, clean SaaS look.
