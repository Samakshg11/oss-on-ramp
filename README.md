# Open Source On-Ramp

An accessible, server-rendered dashboard for finding beginner-friendly issues in Canonical open source projects.

**Live demo:** _add your deployment URL here after deploying_ · **Source:** [github.com/Samakshg11/oss-on-ramp](https://github.com/Samakshg11/oss-on-ramp)

## Why this exists

New contributors rarely struggle with writing code — they struggle with finding a good first issue, understanding which repository it belongs to, and seeing whether anyone has already picked it up. This app turns the GitHub search API into a fast, readable, keyboard-friendly page, then exposes the same data as a small REST API.

It is also a deliberate exercise in the stack Canonical uses: **SvelteKit + TypeScript + Vanilla Framework**, with accessibility and performance treated as requirements rather than afterthoughts.

> Related contribution: I fixed a stale settings reference in [Vanilla Framework issue #5375](https://github.com/canonical/vanilla-framework/issues/5375) while researching the toolkit used by this app (PR [#5889](https://github.com/canonical/vanilla-framework/pull/5889)).

## Stack

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Presentation   | SvelteKit 3, Svelte 5 (runes)                              |
| Language       | TypeScript (strict), no `any` in application code          |
| Design system  | [Vanilla Framework](https://vanillaframework.io/) 4.62.3   |
| Data source    | GitHub REST Search API, with a bundled offline snapshot    |
| Server runtime | `@sveltejs/adapter-node` (Node 22)                         |
| Tests          | Vitest (unit), Playwright + axe-core (E2E / WCAG 2.1 AA)   |
| Quality        | ESLint, Prettier, `svelte-check`, GitHub Actions CI        |
| Containers     | Multi-stage Dockerfile on `node:22-bookworm-slim` (Debian) |

## Features

- **Server-rendered by default.** The first paint contains real results; no JavaScript is needed to filter, sort or paginate. Controls are ordinary `GET` form submissions and links.
- **Accessible.** Skip link, semantic table with caption and `scope`/`aria-sort`, labelled form controls, `aria-live` result count, `aria-pressed` theme toggle, visible focus, and no axe-core WCAG 2.1 A/AA violations.
- **Data-rich.** Summary cards, repository/label facets, sortable columns, comments and opened dates for 100 open issues across 35+ Canonical repositories.
- **Resilient REST API.** `GET /api/issues` with filtering, sorting, pagination, `ETag`, `Cache-Control`, a 10-minute in-memory cache, and a snapshot fallback when GitHub is rate-limited or offline.
- **Small client bundle.** Vanilla CSS is precompiled to a static file at build time; only the theme toggle needs client-side JavaScript.

## API

```
GET /api/issues?search=accessibility&repository=canonical/vanilla-framework&sort=comments&order=asc&page=1&perPage=25
```

| Parameter    | Values                                       | Default   |
| ------------ | -------------------------------------------- | --------- |
| `search`     | free text (title, repo, author, labels)      | `''`      |
| `repository` | exact `owner/repo`                           | all       |
| `label`      | exact label name                             | all       |
| `sort`       | `created`, `comments`, `title`, `repository` | `created` |
| `order`      | `asc`, `desc`                                | `desc`    |
| `page`       | positive integer                             | `1`       |
| `perPage`    | `10`, `25`, `50`                             | `25`      |
| `refresh=1`  | bypass the in-memory cache                   | off       |

Example:

```bash
curl -s 'http://localhost:3000/api/issues?perPage=10&sort=comments' | jq '.data.items | length'
```

Every response includes `X-Data-Source` (`github` or `snapshot`) and `X-Fetched-At`. A matching `If-None-Match` returns `304 Not Modified`.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the decisions and trade-offs behind the data layer, rendering strategy and caching.

## Run locally

Requires **Node 22** (the `engines` field in `package.json` enforces it).

```bash
npm install
npm run dev        # http://localhost:5173
```

`predev` compiles Vanilla Framework SCSS into `static/vanilla.css` automatically.

## Quality checks

```bash
npm run check                  # svelte-check: types and Svelte diagnostics
npm run lint                   # Prettier + ESLint
npm run test:unit -- --run     # 13 Vitest unit tests
npx playwright install chromium
npx playwright test            # 4 E2E tests, including an axe-core WCAG scan
npm run build                  # production build via adapter-node
```

CI runs all of these on every push and pull request.

## Deployment

**One-click free demo (Render):** create a Render account, connect this repository, and Render will detect `render.yaml`. Optionally add `GITHUB_TOKEN` as an environment variable to raise the GitHub rate limit. The health check is `/`.

With `adapter-node`:

```bash
npm run build
PORT=3000 node build
```

Or with Docker:

```bash
docker build -t oss-on-ramp .
docker run --rm -p 3000:3000 oss-on-ramp
```

The app works without any environment variables. In production, set `GITHUB_TOKEN` (see `ARCHITECTURE.md`) to raise the GitHub API rate limit from 60 to 5,000 requests/hour.

## License

MIT — see [LICENSE](./LICENSE).
