# Ink & Pigment

**A black-and-white portfolio that visitors colour in.**

Every page starts out as a line drawing in ink. Visitors pick a pigment, use the paint bucket to flood shapes with colour, brush over the hero scenery to reveal it, or roll paint across the whole screen. Small celebrations mark each finished piece. Visitors can also leave their mark on a shared community wall and take home a postcard of what they painted.

Built with **Angular 21**: standalone components, signals, zoneless change detection, and no UI framework.

---

## Contents

- [Highlights](#highlights)
- [Quick start](#quick-start)
- [Pages](#pages)
- [Editing your content (no code)](#editing-your-content-no-code)
- [Controls and shortcuts](#controls-and-shortcuts)
- [Project structure](#project-structure)
- [Backend](#backend)
- [Building and deploying](#building-and-deploying)
- [Tech stack](#tech-stack)

---

## Highlights

| | |
|---|---|
| **Paint bucket** | Click any outlined shape and it floods with colour from the point you clicked, with an ink-bleed edge. |
| **Brush reveal** | Brush over the monochrome hero scene to uncover the colour painting underneath. |
| **Whole-screen roller** | Paint the entire page background in light or dark mode. Text automatically switches between light and dark to stay readable. |
| **Mono / Colour switch** | Flip the whole site between the ink drawing and a fully coloured version with a circular sweep. |
| **Palette moods** | Six hand-picked palettes. Shuffling the palette recolours everything already painted, because fills remember a palette slot rather than a fixed colour. |
| **Paper and chalk themes** | A cream-paper light theme and a chalkboard dark theme. |
| **Paint-chip projects** | Each project is a paint-store colour chip that you can flip over. |
| **Brush-stroke timeline** | The career journey is drawn as one long brush stroke while you scroll. |
| **Celebrations** | Finishing a block shows a paint burst and a toast. Finishing the whole site triggers a bigger celebration. |
| **Postcards** | Turns what you painted into a 1600 × 1000 postcard with your own message, then downloads, shares or sends it to you. Approved postcards hang on a rack on the Contact page. |
| **Community wall** | Visitors paint one shape of a shared city mural, or throw one splash of paint, sign it, and can edit it later. Everyone sees the same wall. |
| **Colouring studio** | Free colouring pages that you can save as images. |
| **Undo / redo and saving** | Every fill can be undone and redone, and progress is kept in the visitor's browser. |

---

## Quick start

Requires **Node.js 20.19+** (or 22.12+) and npm.

```bash
npm install
npx ng serve --port 4300 -o
```

Then open <http://localhost:4300>. The page reloads automatically when you save a file.

Without the backend running, the walls save to your own browser and postcards can only be downloaded. To run the backend too, see [Backend → Running it locally](#running-it-locally).

> `npm start` also works, but it uses Angular's default port 4200. Use `--port` to pick another one if 4200 is taken.

| Command | What it does |
|---|---|
| `npx ng serve --port 4300` | Development server with live reload |
| `npm run build` | Production build into `dist/port/browser` |
| `npm run watch` | Rebuilds on every change (development configuration) |
| `npm run api` | Local backend + production build on <http://localhost:8788> (run `npm run build` first) |
| `npm run check:server` | Type-check the backend code |

---

## Pages

Every navbar link is its own lazy-loaded page, so the browser only downloads a page's code when someone visits it.

| Route | Page | What visitors do there |
|---|---|---|
| `/` | Home | Brush the hero scenery into colour and browse the chapter cards |
| `/about` | About | Paint the portrait and the quick facts |
| `/skills` | Skills | A shelf of paint jars, each filled to its skill level |
| `/work` | Work | Projects as flip-able paint chips |
| `/journey` | Journey | A timeline drawn as a brush stroke |
| `/wall` | Wall | The community mural (`?view=splash` opens the splash wall) |
| `/contact` | Contact | Paint the envelope, find the links and make a postcard |
| `/studio` | Studio | Free colouring pages |

The **Previous / Next** links at the bottom of every page step through them in order.

---

## Editing your content (no code)

All personal content lives in **`public/content.json`**. The site loads it at runtime, so changing it never needs a rebuild.

### With the built-in editor

Open the hidden editor in any of three ways:

- press **Ctrl + Alt + E**
- click the faint **edit icon** at the end of the footer
- add **`?edit`** to the URL, e.g. `http://localhost:4300/?edit`

It has a tab for each part of the site: Basics, About, Skills, Projects, Journey and Links. Changes preview live and are saved as a **draft in that browser only**.

### Everything at once

1. In the editor's **Import & export** tab, click **Copy template**. This copies a short field guide plus your current content as JSON.
2. Fill in your details in any text editor.
3. Paste the result back into the tab and press **Apply**. You can also load a `.json` file instead.

The editor validates whatever it imports: missing fields fall back to defaults, and unsafe links such as `javascript:` are dropped.

### Publishing changes

On the live site, open **`/admin`**, sign in with your admin key and press **Publish to the live site** on the **Content** tab. Every visitor sees the new content straight away, with no rebuild.

Without the backend you can still click **Download content.json** and replace `public/content.json` with it. Published content from the backend always wins over that file.

---

## Controls and shortcuts

| Key | Action |
|---|---|
| `1` – `6` | Choose a pigment from the palette |
| `B` | Paint bucket |
| `R` | Roller (paint the whole screen) |
| `E` | Eraser |
| `M` | Shuffle to a new palette mood |
| `Ctrl + Z` / `Ctrl + Shift + Z` | Undo / redo |
| `Ctrl + Alt + E` | Open the content editor |

All of these tools are also in the **paint dock** at the bottom of the screen, along with the postcard button. The theme and Mono / Colour toggles are in the navbar.

---

## Project structure

```
src/app/
├── core/        app-wide services and logic, no UI
│                paint-state, content-store, celebration, postcard,
│                chapters, palettes, mural-store, splash-store, title-strategy,
│                api (backend status + fetch helper), edit-tokens, wall-limits
├── data/        content types and the built-in placeholder content
├── shared/      building blocks reused across pages
│   ├── art/         line-art definitions (scenes, portrait, mural city, splats)
│   ├── paint/       paintable and paint-block directives, flood animation, art canvas
│   ├── directives/  reveal-on-scroll, postcard source
│   └── ui/          icon, section header
├── layout/      the app shell
│                navbar, paint-dock, footer, page-nav, celebration-layer,
│                postcard-dialog, content-editor (one component per tab)
└── features/    one folder per page, each with its own components
    ├── home/      hero, brush-reveal, chapter-card
    ├── about/     portrait-card, fact-list
    ├── skills/    skill-shelf, paint-jar
    ├── work/      project-chip
    ├── journey/   brush-spine, timeline-entry
    ├── wall/      mural-board, mural-canvas, splash-board, splash-canvas,
    │              sign-form, recent-artists
    ├── contact/   envelope-art, social-links, postcard-cta, postcard-rack
    ├── studio/    artwork-picker, easel
    └── admin/     the owner's back office at /admin (postcards, walls, content)

server/          the backend: router, walls, postcards, admin (Cloudflare Pages Functions)
functions/api/   the one function file that sends every /api request to server/
migrations/      database tables (Cloudflare D1)
```

- **Import aliases:** `@core/…`, `@shared/…`, `@layout/…`, `@features/…` and `@data/…`, defined in `tsconfig.json`.
- **Icons:** [Font Awesome](https://fontawesome.com) free solid, regular and brand sets, mapped by name in `shared/ui/icon.ts`. Use them like `<app-icon name="bucket" />`. Social links pick the matching brand logo automatically.
- **Saved state:** a visitor's painting progress is kept in their own browser's `localStorage` under keys starting with `ink-pigment:`. Wall marks, postcards and published content live in the backend.

---

## Backend

The backend runs on **Cloudflare**: the site is served by **Cloudflare Pages**, the `/api` routes are **Pages Functions** (`functions/` → `server/`), and data lives in a **D1** database (SQLite). Everything fits in Cloudflare's free plan and nothing goes to sleep when traffic is low.

| What | Where it lives | Notes |
|---|---|---|
| Mural shapes | `mural_claims` table | The database allows **one painter per shape** |
| Splashes | `splashes` table | One per visitor (remembered in their browser) |
| Postcards | `postcards` table (image included) | Stay **pending** until you approve them in `/admin` |
| Site content | `content` table | Set from `/admin → Content` |

**Safety built in**

- Each mark gets a secret **edit token** that only the painter's browser keeps (the database stores a hash), so only they can edit it.
- **Rate limits** per visitor: 12 wall writes and 3 postcards per hour. Visitor IPs are only stored as salted hashes.
- Every name, city and message is cleaned and length-limited on the server, using the same limits as the site (`src/app/core/wall-limits.ts`).
- Postcard images are checked to be real JPEG/PNG/WebP files and capped at 1.2 MB.
- Writes are only accepted from the site's own origin. Admin routes need the `ADMIN_KEY` secret.

### API

| Method & path | Purpose |
|---|---|
| `GET /api/health` | Lets the site know the backend is up |
| `GET /api/content` | Published content |
| `GET` / `POST /api/mural`, `PATCH /api/mural/:id` | List, paint and edit mural shapes |
| `GET` / `POST /api/splashes`, `PATCH /api/splashes/:id` | List, throw and edit splashes |
| `GET` / `POST /api/postcards`, `GET /api/postcards/:id/image` | The rack, sending a postcard, approved images |
| `/api/admin/…` | Postcard review, removing wall marks, publishing content (needs the admin key) |

### Running it locally

```bash
cp .dev.vars.example .dev.vars   # then set your own ADMIN_KEY and IP_SALT
npm run db:migrate:local         # creates the tables in a local database
npm run build
npm run api                      # site + backend on http://localhost:8788
```

`npx ng serve --port 4300` forwards `/api` to that local backend (`proxy.conf.json`), so live reload and the backend work together. Restart `ng serve` once after adding the proxy for the first time.

### Optional: email me new postcards

Create a free [Resend](https://resend.com) account and set two more secrets: `RESEND_API_KEY` and `NOTIFY_EMAIL` (your address). Each new postcard then sends you a short email. Without them, check `/admin` instead.

---

## Building and deploying

One-time setup (needs a free Cloudflare account):

```bash
npx wrangler login
npx wrangler d1 create ink-pigment        # copy the printed database_id into wrangler.toml
npm run db:migrate                        # creates the tables in the live database
npx wrangler pages project create ink-pigment --production-branch main
npx wrangler pages secret put ADMIN_KEY --project-name ink-pigment   # your admin password for /admin
openssl rand -hex 32 | npx wrangler pages secret put IP_SALT --project-name ink-pigment
```

After that, **every push deploys itself** through GitHub Actions (`.github/workflows/deploy.yml`):

- a push to `main` updates the live site, and applies any new files in `migrations/` first
- a push to any other branch gets its own preview link

The workflow needs one repository secret, under **Settings → Secrets and variables → Actions**: `CLOUDFLARE_API_TOKEN`, made in Cloudflare → My Profile → API Tokens → Create Token, with **Cloudflare Pages: Edit** and **D1: Edit**. The Cloudflare account id is written in the workflow itself (it isn't private); if you fork this, put yours there (`npx wrangler whoami` shows it).

You can still deploy by hand from your own machine:

```bash
npm run deploy                            # builds and uploads the site + backend
```

Cloudflare gives the site a `*.pages.dev` address; you can add your own domain in the Pages dashboard. Unknown paths fall back to `index.html` automatically, so every page route works on refresh.

Once the site is on a real domain, postcards print that address. On `localhost` they leave it out.

---

## Tech stack

- **Framework:** Angular 21 with standalone components, signals, zoneless change detection, the new control flow and lazy feature routes.
- **Rendering:** SVG line art and Canvas 2D, with no extra libraries. It covers the brush reveal, coverage checks, postcards and image export.
- **Page transitions:** the View Transitions API, used for the theme, mode and page-change transitions.
- **Styles:** SCSS with CSS custom properties. Colours are chosen with WCAG contrast checks so painted backgrounds and accents stay readable.
- **Fonts:** Fraunces, DM Sans and Caveat, from Google Fonts.
- **Icons:** Font Awesome 7 via `@fortawesome/angular-fontawesome`.
