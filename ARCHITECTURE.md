# Architecture and decisions

## Request flow

```
Browser ──GET /?search=... ──▶ SvelteKit load()
                                  │
                                  ├─ parseIssueQuery()  (validate + clamp input)
                                  ├─ getDataset()       (cache → GitHub → snapshot)
                                  └─ buildIssuePage()   (filter → sort → paginate → facets)
                                  │
Browser ◀── server-rendered HTML ──┘

Browser ──GET /api/issues?... ──▶ +server.ts ──▶ same pure functions ──▶ JSON
```

The UI and the REST API share `parseIssueQuery`, `filterIssues`, `sortIssues` and `buildIssuePage`. There is exactly one implementation of the filtering rules, which is why the unit tests cover the API behaviour without a running server.

## Key decisions

**Server-side filtering instead of a client-side data grid.** The page works with JavaScript disabled, which is both a progressive-enhancement and an accessibility win: form submissions and links produce ordinary navigations, browser history works, and screen readers get a new document with an updated `aria-live` status. It also keeps the client bundle small — the only client code is the theme toggle. The trade-off is a round trip per filter change; mitigated by SSR and by moving all expensive work to pure functions on the server.

**Vanilla Framework compiled at build time.** The npm package publishes SCSS, not CSS. `npm run build:css` compiles `vanilla-framework/scss/build.scss` once into `static/vanilla.css` with `--silence-deprecation` flags for the upstream Sass 3.x deprecations. This avoids compiling 500 KB of Sass on every request and makes the CSS cacheable as a static asset. Component-specific styles stay in Svelte `<style>` blocks, which Svelte scopes automatically.

**Live GitHub data with a bundled snapshot fallback.** `getDataset()` calls the GitHub Search API (`org:canonical is:issue is:open label:"good first issue"`), caches the result in memory for 10 minutes, and falls back to `src/lib/data/issues-snapshot.json` (100 real issues captured on 2026-11-26) on any failure. The snapshot is not fake data — it is a real response normalised to the same shape. This keeps a demo or CI environment usable when GitHub rate-limits an unauthenticated IP. Set `GITHUB_TOKEN` in production to raise the limit to 5,000 requests/hour.

**Why `is:issue is:open` and not `state:open`.** GitHub's search API returns zero results for `state:open` with this label query, while `is:issue is:open` returns 200+. The query is centralised in `GITHUB_QUERY` and covered by the fallback test.

**ETag and Cache-Control.** `/api/issues` returns `ETag` derived from the fetch timestamp, issue count and query, plus `Cache-Control: public, max-age=60, stale-while-revalidate=300`. A matching `If-None-Match` yields `304`, so browsers and proxies avoid re-downloading unchanged datasets.

**In-memory cache caveat.** The cache lives in the Node process. With multiple instances each instance has its own cache; this is acceptable for a demo and keeps the deployment dependency-free. A shared Redis cache would be the next step for a multi-instance production service.

**Strict input handling.** `parseIssueQuery()` whitelists sort keys and page sizes, clamps page numbers, and truncates free text to 120 characters. Malformed input degrades to documented defaults rather than producing a 500 or an injection vector.

## Accessibility notes

- One `<h1>` per page; headings follow a logical order and section labels are wired with `aria-labelledby`.
- "Skip to main content" target is `<main tabindex="-1">`.
- The results table has a `<caption>`, `scope="col"`/`scope="row"` headers, and `aria-sort` on the active sortable column. Sort direction is also visible as an arrow and announced correctly.
- Filters are real `<label>`/`<input>`/`<select>` pairs inside a labelled `<form>`.
- The result count uses `role="status" aria-live="polite"` so filter changes are announced without stealing focus.
- The theme button uses `aria-pressed` and persists the choice in `localStorage`.
- `prefers-reduced-motion` is respected by avoiding transitions on state changes.
- Playwright runs axe-core with `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` tags on the rendered home page and asserts zero violations.

## Performance notes

- Initial HTML is server-rendered with the real dataset; no loading spinner or empty first paint.
- Filters, sorting and pagination need no JavaScript.
- Vanilla CSS is a single precompiled static asset; Svelte scopes and tree-shakes component CSS.
- Build output: ~8.9 kB gzipped for the page module, ~3.5 kB for the layout, ~21 kB for the shared framework chunk.
- The 10-minute server cache means normally zero GitHub requests per user interaction.

## Possible next steps

- Stream the dataset with SvelteKit `load` streaming for very large result sets.
- Add a shared cache (Redis) and a persisted snapshot refresh job.
- Add a Flutter web view of the same REST API to demonstrate the cross-platform story.
- Add per-issue detail pages with a comment timeline.
