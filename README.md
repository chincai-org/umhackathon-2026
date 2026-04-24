# umhackathon-2026 ✨

> A dashboard about fused operational intelligence and AI-driven dispatch recommendations.

Astro site with Bun + HTMX.

## 🚀 Quick Start

```bash
bun install
bun run dev
```

Open the local URL Bun prints in your terminal.

## 📦 Requirements

- Bun
- An `.env` file with `ILMU_API_KEY`

### Example `.env`

```bash
ILMU_API_KEY=your_api_key_here
```

## 🛠️ Useful Commands

- `bun run dev` - start the local site
- `bun run build` - build the production site
- `bun run check` - run Astro type and config checks
- `bun run preview` - preview the built site locally

## 🗂️ What’s Inside

- `src/pages/` - site pages and API routes
- `src/components/` - reusable UI pieces
- `src/layouts/` - shared page layout
- `src/lib/` - server-side helpers, data fetchers, and recommendation logic
- `src/styles/` - CSS files and shared styling
- `public/` - static files served as-is
- `astro.config.mjs` - Astro runtime and adapter config
- `tsconfig.json` - TypeScript config
- `package.json` - scripts, deps, and project metadata
- `bun.lock` - Bun lockfile for reproducible installs
- `.github/workflows/` - GitHub Actions CI workflow

## 📝 Notes

- The recommendation API expects a valid `ILMU_API_KEY`.

## 🧯 If Something Breaks

1. Make sure Bun is installed.
2. Run `bun install` again.
3. Check that `.env` exists and contains `ILMU_API_KEY`.
4. Run `bun run check` to catch config or type issues.

## 👋 First Time Here?

1. Install dependencies with `bun install`.
2. Add your `ILMU_API_KEY` to `.env`.
3. Start the site with `bun run dev`.
4. Visit the local URL shown in the terminal.
