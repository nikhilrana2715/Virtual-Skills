# Virtual Skills — Design System v1.1

## Product brief
- **Product:** public discovery hub for AI + IT resources (skills, MCP servers, agents, models, cloud/IT tools). ~15 screens: Home, Explore, Category, Resource detail, Trending, Latest, auth, account, admin.
- **Users:** Visitors → find a resource fast; Members → bookmark; Admins → curate/import/sync.
- **Key flow:** header nav → category/type → resource detail → original source.
- **Pain point fixed in v1.1:** flat 4-link nav hid categories; now a mega menu exposes every category with description + count.

## Audit (v1.1, `frontend/src`)
| Area | Found | Rule |
|---|---|---|
| Brand blues | `brand-800` used but undefined (rendered nothing); raw `blue-100/800` beside brand scale | Brand scale only: 50/100/200/300/500/600/700/800/900 |
| Font sizes | xs, sm, base, lg, xl, 2xl–5xl + one `text-[9px]` (provider glyph) | Tailwind scale only; `[9px]` allowed only for 16px provider glyph |
| Radius | `rounded`, `-md`, `-lg`, `-xl`, `-full` | Controls `lg`, cards/panels `xl`, avatars/chips `full` |
| Spacing | 0.5–24 Tailwind units | 4px base; prefer 1, 2, 3, 4, 6, 8 |

## Tokens (`src/index.css` `@theme`)
- Color: `brand-*`, `ink`, Tailwind `slate-*` neutrals, `red-*` danger, `green-*` success, `amber-*` warning.
- Shadow: `shadow-menu` (floating panels).
- Font: Inter (sans), JetBrains Mono (mono).

## Components
| Name | Code |
|---|---|
| Button / Primary · Secondary · Ghost · Danger | `btn-primary` `btn-secondary` `btn-ghost` `btn-danger` |
| Input / Text, Label | `input`, `label` |
| Surface / Card, Chip | `card`, `chip` |
| Nav / Header | `components/Layout.tsx` |
| Nav / MegaMenu, Nav / MobileMegaMenu | `components/MegaMenu.tsx` |

### Nav / MegaMenu rules
- Do: item = UPPERCASE `brand-700` bold title + `slate-600` one-line description + real count chip.
- Do: every item links to a real route or filter (`/categories/:slug`, `/explore?type=…`).
- Do: hover opens on desktop; click, Enter and Esc work too; closes on navigation.
- Don't: hard-code category names/counts in the menu — they come from `/api/v1/categories`. Only the grouping (which slug goes in which menu) lives in `GROUPS`.
- Don't: link to pages that don't exist.

### Icon / Tile
- `lucide-react` SVG icons, `strokeWidth 1.75`, inside a 40px `brand-50` tile (32px on mobile); tile fills `brand-600` on hover.
- Category → icon map lives in `CATEGORY_ICONS`; an unmapped category falls back to its DB emoji, so new categories never show blank.
- Don't mix emoji and SVG for mapped items.

## Changelog
- **v1.2** (2026-11-18): icons on every mega-menu item, menu intro cards and mobile accordion (`lucide-react`).
- **v1.1** (2026-11-18): mega menu (AI & ML, IT & Cloud, Developers, Resource types, Discover); 7 IT/Cloud categories + 39 resources; added `brand-300/800/900`, `shadow-menu`; replaced raw `blue-*` with brand.
- **v1.0**: initial tokens + utilities.
