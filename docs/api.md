# Virtual Skills API (v1)

Base: `/api/v1`. JSON. Errors: `{ "error": string, "details"?: [...] }`.
Mutating requests need header `X-Requested-With: virtual-skills`. Auth = HTTP-only cookie `vs_session`.

## Public
| Method | Path | Notes |
|---|---|---|
| GET | `/resources` | `q, category, type, provider, language, license (or "unknown"), verified, updatedWithinDays, sort (relevance\|recent\|updated\|stars\|name), page, limit≤50` |
| GET | `/resources/:slug` | `{ resource, related, bookmarked }` — published only |
| POST | `/resources/:slug/report` | `{ reason, details? }` |
| GET | `/categories` · `/categories/:slug` · `/categories/:slug/resources` | |
| GET | `/tags` · `/facets` · `/stats` | |
| GET | `/trending?limit=` | includes `trendingScore` |
| GET | `/latest?limit=` | |

## Auth
| POST | `/auth/register` `{name,email,password}` · `/auth/login` `{email,password}` · `/auth/logout` |
|---|---|
| GET | `/auth/me` |
| DELETE | `/auth/me` — delete own account |

## User (login required)
`GET /me/bookmarks` · `GET /me/bookmarks/ids` · `POST|DELETE /me/bookmarks/:resourceId` · `GET /me/export`

## Admin (role=admin, enforced server-side)
- `GET /admin/stats`
- `GET /admin/resources?status=` · `GET|PATCH|DELETE /admin/resources/:id` · `POST /admin/resources`
  - DELETE on a published resource archives it; drafts/archived are deleted.
- `POST /admin/resources/:id/{publish|unpublish|archive|verify|sync}`
- `POST /admin/imports/github/preview {url}` · `POST /admin/imports/github {url, categoryId, resourceType, tags?, summary?, installation?, publish?, safetyStatus?}`
- `POST /admin/sync` · `GET /admin/sync-jobs`
- `GET|POST /admin/categories` · `PATCH|DELETE /admin/categories/:id`
- `GET /admin/tags` · `DELETE /admin/tags/:id`
- `GET /admin/users` · `PATCH /admin/users/:id {role?, status?}`
- `GET /admin/reports` · `PATCH /admin/reports/:id {status}`
- `GET /admin/audit-logs`

Duplicates → `409 { error, existing: {id, slug, name} }`. GitHub rate limit → `429`.
