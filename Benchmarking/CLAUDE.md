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

## Shared Packages

This app consumes the workspace packages via `workspace:*` and path aliases
(wired in `vite.config.ts` + `tsconfig*.json`):

- `@corespan/ui` — shared components (peer deps only — this app provides Mantine/React/etc.)
- `@corespan/api` — zero-dep HTTP client (`createApiClient`)
- `@corespan/utils` — zero-dep helpers

Never import across workspace boundaries with relative paths — always use the `@corespan/` alias.

---

## Directory Structure

```
src/
├── app/
│   └── App.tsx              # Mantine + QueryClient providers
├── features/
│   └── benchmarks/
│       └── Benchmarks.tsx   # Starter page
├── shared/
│   └── api/
│       ├── baseClient.ts    # Single createApiClient instance — never create a second
│       └── queryClient.ts   # TanStack QueryClient config
├── index.css
└── main.tsx                 # React 19 StrictMode entry point
```

---

## API Client

A single `baseClient` instance lives in `src/shared/api/baseClient.ts`. All services
import it — never instantiate a second client.

---

## Development Proxy

The Vite config has no backend proxy yet. When the app needs to call the backend,
add a proxy block mirroring `apps/composer/vite.config.ts` and document the required
`.env` vars here (see `.env.example`).
