# benchmarking

React SPA for running and viewing Corespan Fabric benchmarks.

Standalone Vite app (no monorepo / workspace packages). All shared code — the API
client, UI primitives, chart wrappers — lives locally under `src/shared/`.

---

## Tech Stack

| Category     | Library                    |
| ------------ | -------------------------- |
| Framework    | React 19                   |
| Build        | Vite 7                     |
| UI           | Mantine 9                  |
| Server state | TanStack Query 5           |
| Client state | Zustand 5                  |
| Forms        | React Hook Form 7 + Zod 4  |
| Tables       | TanStack Table 8           |
| Charts       | ECharts 6                  |
| Testing      | Vitest 3 + Testing Library |

---

## Shared Code

There are no workspace packages and no private registry — every dependency in
`package.json` is public on npm, so a clean `pnpm install` is all a fresh
checkout needs.

Shared code lives under `src/shared/` and is imported through the single `@`
alias (`@` → `src`, wired in `vite.config.ts` + `tsconfig*.json`):

- `@/shared/api` — HTTP client (`baseClient`), `API_ORIGIN`, TanStack `queryClient`
- `@/shared/ui` — local primitives: `CoreChart`, `CoreTable`, `CoreForm`, `CoreIcon`

Prefer the `@` alias over deep relative paths (`../../../shared/...`).

---

## Directory Structure

```
src/
├── app/
│   ├── App.tsx              # Mantine + QueryClient providers
│   ├── constants.ts
│   └── layout/              # AppLayout, AppFooter, PageShell
├── features/
│   ├── about/               # AboutUs page + components
│   └── benchmarks/          # The main feature
│       ├── Benchmarks.tsx
│       ├── components/      # Tables, charts, modals, log streams
│       ├── data/            # Query keys, services
│       ├── lib/             # Pure helpers (maskIp, toBenchmarkRows, ...)
│       └── store/           # Zustand stores (useJupyterRunStore, ...)
├── shared/
│   ├── api/
│   │   ├── baseClient.ts    # Single createApiClient instance — never create a second
│   │   ├── config.ts        # API_ORIGIN, resolved from VITE_API_URL
│   │   ├── core/            # Client, middleware, error types
│   │   └── queryClient.ts   # TanStack QueryClient config
│   └── ui/                  # CoreChart, CoreTable, CoreForm, CoreIcon
├── index.css
└── main.tsx                 # React 19 StrictMode entry point
```

---

## API Client

A single `baseClient` instance lives in `src/shared/api/baseClient.ts`. All services
import it — never instantiate a second client.

---

## Development Proxy

`vite.config.ts` proxies two paths to `VITE_API_URL`:

- `/api` — the versioned API namespace
- `/health` — the backend's health probe, which sits at the root rather than
  under `/api/v1` and so needs its own entry

`VITE_API_URL` is **required** — the dev server throws on startup without it.
Copy `.env.example` to `.env` and point it at your backend.

---

## Deployment Routing

The app is served under `/aistudio/` (`base` in `vite.config.ts`, `basename` in
`App.tsx`), but Vite emits to the deploy root — so `vercel.json` maps the prefixed
request back onto the flat output. Rewrites are matched in order, first match wins:

| Rule | Purpose |
| ---- | ------- |
| `/aistudio` and `/aistudio/` | serve the SPA shell |
| `/aistudio/assets/:path*` | hashed bundles, straight through |
| `/aistudio/:file(<extensions>)` | files copied from `public/` |
| `/aistudio/:path*` | everything else → `index.html` (SPA routes) |

The third rule lists file extensions explicitly. It previously read
`:file([^/]+\.[^/]+)` — "any single segment containing a dot" — which is not the
same question as "is this a file". Any future route with a dot in it
(`/aistudio/model.compare`, `/aistudio/run-v1.2`, `/aistudio/v2.beta`) matched it,
got treated as a static file, and 404'd instead of reaching the SPA. The failure
would appear long after the rule was written and would not look like a routing
problem.

`vercel.json` must be strict JSON, so that reasoning lives here rather than inline.

Two consequences worth knowing before editing it:

- **Adding a new file type to `public/` means adding its extension here**, or the
  request falls through to the SPA catch-all and returns `index.html` with a 200 —
  a broken asset that does not look like a 404.
- **`[^/]+` matches one segment only.** Assets in a `public/` subdirectory
  (`public/img/logo.png`) are not covered by this rule and would hit the catch-all.
  That was true of the previous rule too; it is a known gap, not a regression. Use
  `assets/` or the flat `public/` root, or widen the pattern deliberately.
