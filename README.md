# Virtual Skills

Discover AI skills, MCP servers, agents, models, datasets and developer tools in one place — with honest license info and a link to every original source.

Built from [AI Repository Hub Implementation Blueprint.md](AI%20Repository%20Hub%20Implementation%20Blueprint.md) (MVP scope).

## Quick start

Requires Node.js 22.5+ (uses built-in `node:sqlite`).

```bash
npm install
cp backend/.env.example backend/.env   # already done on first setup
npm run seed      # 14 categories, 37 curated resources, admin user
npm run dev       # API http://localhost:5000 · Web http://localhost:5173
```

Admin (dev only): `admin@virtualskills.local` / `ChangeMe123!` → change it.

Seed data has no stars/license/last-commit on purpose. The GitHub sync job fills real values ~15s after the API starts
(60 requests/hour without a token — set `GITHUB_TOKEN` in `backend/.env` for 5,000/hour).

## Scripts

| Command | What |
|---|---|
| `npm run dev` | API + web with hot reload |
| `npm run seed` | Reset and seed the database |
| `npm test` | Backend unit + API tests (vitest, in-memory DB) |
| `npm run build` | Typecheck backend, typecheck + build frontend |

## What's in the MVP

- **Public:** home, explore (search across name/description/tags/topics/language/owner; filters by category, type, provider, language, license, reviewed, last updated; 5 sort orders; server-side pagination), categories, resource detail, trending (transparent score), latest, about/terms/privacy/licenses.
- **Accounts:** register, login, logout, bookmarks, data export, account deletion.
- **Admin:** dashboard metrics, resource CRUD, publish/unpublish/archive, verify + safety review, GitHub import with preview + duplicate detection, per-resource and bulk metadata sync, categories & tags, users (role/suspend), user reports, sync jobs, audit log.
- **Policies:** unknown license shown as unknown; download button only when the provider serves an archive *and* a license is known; imported text rendered as plain text; non-http(s) links never rendered.
- **Security:** bcrypt, JWT in HTTP-only SameSite=Strict cookie + CSRF header, server-side role checks on every admin route, Zod validation, rate limits (auth, search, import, reports), helmet headers, SSRF-safe GitHub adapter (host allowlist, redirect pinning, timeout, response size cap).

## Layout

```
backend/   Express + TypeScript API (see backend/src)
frontend/  React + Vite + Tailwind UI
docs/      API reference
CLAUDE.md  Rules for AI assistants working in this repo
```

## Known MVP deviations from the blueprint

- **SQLite instead of PostgreSQL** — no Postgres/Docker was available locally. All SQL is in `backend/src/database/`; moving to Postgres means porting that layer (schema, `LIKE` search → `tsvector`).
- **In-process scheduler** instead of Redis/BullMQ.
- Collections, Hugging Face/GitLab adapters, semantic search: Phase 2, not built.

See [docs/api.md](docs/api.md) for endpoints.

## License

Apache-2.0 — see [LICENSE](LICENSE).
