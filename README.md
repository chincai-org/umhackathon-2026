# LogiMind (umhackathon-2026)

our pitch [Pitch video](logimind.mkv)
our demo video [Demo video](logimind-demo.mp3)


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

## 🧪 Tests

Run the test suite with:

```bash
bun test
```

### What the tests cover

- `src/lib/recommendation.test.ts`
  - `parseRecommendationJson` with fenced JSON
  - malformed JSON that should return `null`
  - invalid `resourceAllocation` shapes that should be rejected
  - `buildRequestPayload` prompt formatting and fused context serialization

- `src/lib/pipeline.test.ts`
  - `buildApiUrl` date range and query formatting with a fixed base date
  - `computeWeather` classification for storm, low visibility, and stable conditions
  - `AiResponseSchema` validation for empty content
  - `ProviderErrorSchema` parsing for provider error bodies
  - `fallbackRecommendation` output shape when AI returns plain text

### Why these tests exist

- Protect parsing logic from malformed AI output.
- Keep prompt text stable when the model request changes.
- Catch regressions in weather and news data shaping.
- Verify fallback paths still return usable dashboard data.
- Keep date-sensitive URL generation deterministic in tests.

### Mocking rules

- External API calls are not used in these tests.
- GLM API, weather API, and other live dependencies should be mocked in route-level or integration tests.
- Pure transformation logic stays covered here so failures are fast and deterministic.

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
