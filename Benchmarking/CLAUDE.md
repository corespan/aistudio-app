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
