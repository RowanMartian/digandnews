# Dig & News

A minimalist, Everforest-themed web app for exploring **archaeological** and **paleontological** digs and reading news across **History**, **Archaeology**, and **Paleontology**. Built as a static single-page application—no backend required.

---

## Table of contents

- [Features](#features)
- [Design](#design)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Build & preview](#build--preview)
- [Data sources](#data-sources)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [License](#license)

---

## Features

### Globe view

- **Interactive 3D globe** — Active dig sites are shown as markers (yellow = Archaeology, teal = Paleontology).
- **Filters** — Show all digs or filter by **Archaeology** or **Paleontology**.
- **Click a marker** — Opens a side panel with dig name, location, description, status, and the latest news for that dig.
- **Continents visible** — Globe uses a texture so landmasses are clear; graticule and coarse curvature keep the layout readable.

### News view

- **General news** — Articles from RSS feeds plus curated items, with category filters: **All**, **History**, **Archaeology**, **Paleontology**.
- **Article loading** — Click an item to open the article **inside the app**: the page is fetched, parsed, and rendered in the site theme (text, images, captions). No iframe.
- **Curated articles** — Some entries include full text and images stored in the app; others load from the source URL.
- **Reading tools** — Text size (S / M / L), estimated reading time, share (Twitter, Facebook, copy link), and “Back to list”.

### No backend

- RSS feeds are fetched in the browser via a CORS proxy.
- Article content is fetched and parsed on the client.
- The app can be deployed to any static host (e.g. GitHub Pages, Vercel, Netlify).

---

## Design

- **Theme:** [Everforest](https://github.com/sainnhe/everforest) (dark, medium contrast): warm backgrounds, green/teal/yellow accents.
- **Style:** Minimalist, square corners, outline-based UI (borders, no heavy shadows).
- **Typography:** Outfit for body/headings, JetBrains Mono for pills/labels.

---

## Tech stack

| Area        | Technology |
|------------|------------|
| Build      | [Vite](https://vitejs.dev/) 5 |
| UI         | [React](https://react.dev/) 18 + TypeScript |
| 3D globe   | [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (Three.js) |
| Styling    | Plain CSS (Everforest variables, no framework) |

---

## Project structure

```
archeologydignews/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Pages deploy
├── public/                  # (optional) static assets
├── src/
│   ├── components/
│   │   ├── ArticleLoader.tsx   # Fetch & render article from URL in-app
│   │   ├── ArticleView.tsx    # Curated article / loader wrapper
│   │   ├── DigDetailPanel.tsx # Side panel for selected dig
│   │   ├── DigGlobe.tsx       # 3D globe + markers
│   │   └── NewsSection.tsx    # News list + filters
│   ├── data/
│   │   ├── digs.ts             # Dig sites (lat/lng, news, kind)
│   │   └── news.ts             # Curated news items
│   ├── lib/
│   │   ├── fetchNews.ts        # RSS fetch + dedupe
│   │   └── parseArticle.ts     # Fetch URL, parse HTML, extract content
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Everforest theme + base styles
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

---

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** (or yarn/pnpm)

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/archeologydignews.git
cd archeologydignews
npm install
```

---

## Development

```bash
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173)
- Vite provides HMR and fast refresh.

---

## Build & preview

```bash
npm run build
npm run preview
```

- Output is in `dist/` (static HTML, JS, CSS).
- `preview` serves `dist/` locally so you can test the production build.

For GitHub Pages (or another subpath), the deploy workflow sets `BASE_URL`; locally, `base` defaults to `/`.

---

## Data sources

### Digs

- **Source:** `src/data/digs.ts` (curated list).
- Each dig has: id, name, kind (archaeology | paleontology), lat/lng, country, region, description, status, and an array of news items.

### News

- **Curated:** `src/data/news.ts` — items with optional `fullArticle` and `imageUrls`.
- **RSS (client-side):** On load, the app fetches from several feeds via a CORS proxy and merges with curated items. Feeds include:
  - ScienceDaily (all, fossils/ruins, paleontology, archaeology)
  - Sci.News (paleontology, archaeology)
  - Archaeology Magazine
- **Deduplication:** By normalized URL (and title when no link) so the same article from multiple feeds appears once.

### Article loading

- **Parser:** `src/lib/parseArticle.ts` fetches a given URL (via proxy), parses the HTML, and extracts title, byline, main image (with caption/credit), and content blocks (paragraphs and images).
- **Fallbacks:** Multiple CORS proxies; broad article selectors and fallbacks so content shows when possible.

---

## Deployment

The app is a **static SPA**. No server or API is required.

### GitHub Pages (recommended)

1. **Push the repo**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/archeologydignews.git
   git push -u origin main
   ```

2. **Enable Pages**
   - Repo → **Settings** → **Pages**
   - **Build and deployment** → **Source:** **GitHub Actions**

3. **Deploy**
   - Every push to `main` runs `.github/workflows/deploy.yml` (build + deploy).
   - Or: **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

4. **Live URL**
   - `https://YOUR_USERNAME.github.io/archeologydignews/`  
   (Replace with your username and repo name if different.)

The workflow sets `BASE_URL=/<repo>/` so assets and routes work on GitHub Pages.

### Other static hosts

| Platform        | Build command     | Output directory |
|-----------------|-------------------|------------------|
| Vercel          | `npm run build`   | `dist`           |
| Netlify         | `npm run build`   | `dist`           |
| Cloudflare Pages| `npm run build`   | `dist`           |

For a **custom subpath** (e.g. `https://example.com/app/`), set `BASE_URL=/app/` when building.

---

## Configuration

| Item        | Where / how |
|------------|-------------|
| Base URL   | `vite.config.ts`: `base: process.env.BASE_URL \|\| '/'`. Set `BASE_URL` in CI or when running `npm run build`. |
| RSS feeds  | `src/lib/fetchNews.ts`: edit `RSS_FEEDS`. |
| CORS proxy | `src/lib/fetchNews.ts`: `CORS_PROXY`. `parseArticle.ts` uses its own proxy list. |
| Digs / curated news | `src/data/digs.ts`, `src/data/news.ts`. |

---

## License

MIT (or add your chosen license and section here.)
