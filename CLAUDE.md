# Vital Photography (Astro rebuild) — CLAUDE.md

Project spec and working guide for Claude Code and contributors. This is a **greenfield rebuild** of a photography portfolio that previously ran on Nuxt 4 + ASP.NET Core. The product goals are unchanged; the stack is new.

---

## Project Overview

Personal photography portfolio ("Vital Photography") — a dark, moody, masonry-grid gallery with a lightbox and a single-user, password-protected admin panel for uploading and managing photos. The owner is a semi-professional hobbyist photographer. Low traffic, self-hosted.

**Genres / filter categories:** Landscape / Nature · Street / Urban

**Why this rebuild:** the previous version worked but ran as *two* services in two languages (a Nuxt SPA + a separate C# Web API) for what is essentially a single-user content site. This rebuild collapses everything into **one full-stack Astro app, one service, one deploy.**

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Astro 5** (Node adapter, hybrid rendering) | Static public pages, on-demand admin + API |
| Interactive islands | **Vue 3** via `@astrojs/vue` | Only the lightbox, filter, and admin panel ship JS |
| Server mutations | **Astro Actions** | Typed server functions for admin upload/edit/reorder/delete |
| Database | **SQLite** via **Drizzle ORM** (`better-sqlite3`) | File on a mounted volume; migrations via `drizzle-kit` |
| Image processing | **sharp** | WebP conversion + resize on upload |
| Auth | Single-user, **bcrypt** hash + signed **httpOnly cookie** session | Simpler than JWT for one user |
| Deploy | **One Docker container** (`node ./dist/server/entry.mjs`) | Data (SQLite + uploads) on a mounted volume |

**Deliberately NOT used:** a separate backend service, a client-side SPA router, a heavyweight CMS. Keep it lean.

---

## Architecture & Rendering Strategy

Astro renders most of the site to static HTML (near-zero JS) and hydrates only small "islands" of interactivity.

- **Prerendered (static):** `/` gallery shell, `/about`, `/contact`. SEO-friendly, fast.
- **On-demand (SSR):** `/admin`, `/admin/login`, and all API/Action routes.
- **Islands (Vue, hydrated):**
  - **`<Gallery>`** — a *single* island containing the masonry grid **+** filter bar **+** lightbox. Keep these together in one island so their shared state (active filter, open photo) lives in ordinary Vue reactivity. Do **not** split them into three islands.
  - **`<AdminPanel>`** — a second island for upload/reorder/metadata/delete.
  - Everything else is static `.astro`.

**Cross-island state:** Astro islands are isolated by default. Because the gallery is one island, you avoid this entirely. If two islands ever *must* communicate, use `nanostores` (`@nanostores/vue`) — the Astro-recommended pattern. Prefer restructuring into one island first.

**Why Vue (not React/Svelte):** the owner already knows Vue, so the only genuinely new surface to learn is Astro's own model (islands, hybrid rendering, Actions, content). Vue is first-class in Astro; there is no technical penalty. Note that Vue-in-Astro is "just Vue" — none of Nuxt's auto-imports, `useFetch`, Pinia auto-wiring, or file-based component routing. Astro owns routing and data loading instead.

---

## Proposed Project Structure

```
/
├─ src/
│  ├─ pages/
│  │  ├─ index.astro            # public gallery (prerendered shell + <Gallery> island)
│  │  ├─ about.astro
│  │  ├─ contact.astro
│  │  ├─ admin/
│  │  │  ├─ index.astro         # SSR, guarded — hosts <AdminPanel> island
│  │  │  └─ login.astro
│  │  ├─ uploads/[...file].ts   # serves user-uploaded images from disk w/ cache headers
│  │  └─ api/                   # any plain endpoints not covered by Actions
│  ├─ actions/
│  │  └─ index.ts               # Astro Actions: uploadPhoto, updatePhoto, reorder, deletePhoto
│  ├─ components/
│  │  ├─ Gallery.vue            # masonry + filter + lightbox (one island)
│  │  ├─ AdminPanel.vue
│  │  ├─ BlurImage.vue
│  │  └─ ...                    # SiteNav.astro, SiteFooter.astro (static)
│  ├─ lib/
│  │  ├─ db.ts                  # Drizzle client
│  │  ├─ schema.ts              # Drizzle schema
│  │  ├─ images.ts              # sharp pipeline (WebP + resize)
│  │  └─ auth.ts                # cookie session sign/verify, bcrypt check
│  ├─ middleware.ts             # guards /admin + admin actions
│  └─ styles/tokens.css         # design tokens (see below)
├─ drizzle/                     # generated migrations
├─ astro.config.mjs
├─ drizzle.config.ts
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
└─ CLAUDE.md
```

---

## Data Model

One table, `photos` (Drizzle schema):

```ts
export const photos = sqliteTable('photos', {
  id:           text('id').primaryKey(),              // uuid
  title:        text('title').notNull(),
  category:     text('category').notNull(),           // 'landscape-nature' | 'street-urban'
  description:  text('description'),
  shootDate:    text('shoot_date'),                   // ISO 8601 date
  visible:      integer('visible', { mode: 'boolean' }).notNull().default(true),
  order:        integer('order').notNull().default(0),
  thumbnailUrl: text('thumbnail_url').notNull(),      // /uploads/<id>-thumb.webp
  displayUrl:   text('display_url').notNull(),        // /uploads/<id>-display.webp
  createdAt:    text('created_at').notNull(),         // ISO 8601 datetime
});
```

Public JSON shape returned to the gallery matches these fields (camelCase).

---

## Image Pipeline (read this — it's the one non-obvious part)

**Astro's built-in image optimization (`astro:assets`) is BUILD-TIME only.** It does not help photos uploaded at runtime. So the upload path is hand-rolled with `sharp` (this is simple — the old C# `ImageService` did exactly this):

On `uploadPhoto`:
1. Receive the original via multipart / Action input.
2. `sharp` → WebP **85%** quality, two derivatives:
   - **thumbnail** — 400 px wide
   - **display** — 1800 px wide
3. Write both to the uploads volume as `<id>-thumb.webp` / `<id>-display.webp`.
4. Insert the `photos` row with the two URLs.

Images are served by `src/pages/uploads/[...file].ts`, reading from the volume and setting `Cache-Control: public, max-age=31536000, immutable`.

(Optional Phase 5 nicety: generate multiple display widths for a responsive `srcset`.)

---

## Server API / Actions

- **Reads (public):** the gallery loads visible photos ordered by `order`. Do this in the page's server frontmatter (prerender build reads the DB) or a small endpoint if you prefer runtime.
- **Mutations (admin, via Astro Actions):**
  - `uploadPhoto(file, metadata)` → runs the sharp pipeline, inserts row
  - `updatePhoto(id, metadata)` → edits title/category/description/shootDate/visible
  - `reorderPhotos(orderedIds[])`
  - `deletePhoto(id)` → removes row + both image files
- **Auth:**
  - `login(password)` → verify bcrypt against `ADMIN_PASSWORD_HASH`, set signed httpOnly cookie
  - `logout()`
- Error convention: Actions return typed errors; surface as `{ error, details? }` in the island.

---

## Auth

Single user. No third-party auth service.
- Password is stored only as a **bcrypt hash** in `ADMIN_PASSWORD_HASH` (env).
- Login verifies and sets a **signed, httpOnly, SameSite=Lax** session cookie (sign with `SESSION_SECRET`).
- `src/middleware.ts` guards `/admin/*` (redirect to `/admin/login`) and rejects unauthenticated admin Actions.

---

## Routes

| Route | Rendering | Description |
|---|---|---|
| `/` | Static shell + Vue island | Public gallery — masonry, filter, lightbox |
| `/about` | Static | Bio, gear/philosophy, portrait |
| `/contact` | Static | Email display only |
| `/admin` | SSR (guarded) | Admin panel island |
| `/admin/login` | SSR | Login form |
| `/uploads/[...file]` | SSR endpoint | Serves uploaded images with immutable cache headers |

---

## Design Tokens (Dark Theme — carry over from v1)

Defined in `src/styles/tokens.css`. These were chosen in the previous build and the owner liked them — reuse unless deciding to refresh.

```
--color-bg:         #0a0a0a   near-black canvas
--color-surface:    #141414   card / panel backgrounds
--color-border:     #232323   subtle dividers
--color-text:       #e8e8e8   primary text
--color-muted:      #6b6b6b   secondary / metadata text
--color-accent:     #6B8F71   muted sage green
--color-accent-dim: #4a6450   darker accent for hover states
```

Styling: Tailwind (via `@astrojs/tailwind`) is fine and matches v1, or plain CSS with these tokens — either is acceptable; pick one and be consistent.

---

## Image Categories (Slug → Display)

```
landscape-nature  →  Landscape / Nature
street-urban      →  Street / Urban
```

---

## Caching Strategy

| Layer | Cache-Control |
|---|---|
| Uploaded images (`/uploads/*`) | `public, max-age=31536000, immutable` |
| Public gallery data | `public, max-age=60, stale-while-revalidate=300` |
| Admin routes | no-store (auth-gated) |

---

## Environment Variables

Use Astro's typed env (`astro:env`) where possible. Copy `.env.example` → `.env` (never commit).

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite path, e.g. `file:./data/vital.db` |
| `UPLOADS_DIR` | Directory for processed images, e.g. `./data/uploads` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash (cost 11) of the admin password |
| `SESSION_SECRET` | Random string ≥ 32 chars for signing the session cookie |
| `PUBLIC_SITE_URL` | Canonical site URL (SEO/sitemap) |

---

## Deployment

Single container, one command:

```bash
docker compose up --build
```

- App: http://localhost:4321 (or mapped port)
- Data (SQLite + processed images) persists on a mounted volume (`./data/`)
- Astro built with `output: 'server'` + `@astrojs/node` (standalone), run via `node ./dist/server/entry.mjs`

---

## Phased Roadmap

Build in phases; **commit at the end of each phase with a structured message** (owner preference).

| Phase | Scope |
|---|---|
| 1 | Scaffold: Astro + Vue + Node adapter, Drizzle schema + first migration, tokens.css, Docker skeleton, this CLAUDE.md |
| 2 | Public gallery: `<Gallery>` island (masonry + filter + lightbox), DB reads, lazy/blur-up loading, static prerender, SEO basics |
| 3 | Admin: cookie auth + middleware, login page, `<AdminPanel>` island, Astro Actions (upload/edit/reorder/delete), sharp pipeline, `/uploads` endpoint |
| 4 | Content: About + Contact pages, site-wide nav & footer |
| 5 | Polish: sitemap/robots, responsive `srcset`, cache headers, one-command Docker deploy, final QA |

---

## Reference: the previous build

The old repo (Nuxt 4 + ASP.NET Core 8) is a useful reference — **port ideas, not code structure**:
- Working Vue components to adapt: `MasonryGrid.vue`, `Lightbox.vue`, `FilterBar.vue`, `BlurImage.vue`, admin `UploadZone.vue` / `MetadataModal.vue` / `PhotoAdminCard.vue`.
- The C# `ImageService` is the reference for the sharp pipeline (same WebP 85% / 400 / 1800 spec).
- The design tokens above are copied verbatim from v1.
- **Gotcha already learned:** don't expect Astro's image optimization to handle runtime uploads — see the Image Pipeline section.
```
