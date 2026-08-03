# AI Studio App

This repository hosts the **Benchmarking** app — a React SPA for running and viewing
Corespan Fabric benchmarks.

The application lives in the [`Benchmarking/`](Benchmarking) directory.


**GitHub:** [github.com/corespan/aistudio-app](https://github.com/corespan/aistudio-app),
  https://github.com/corespan/aistudio-cli,
  

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

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10 (this app uses pnpm as its package manager)

  ```bash
  npm install -g pnpm
  ```

---

## Setup

All commands run from the `Benchmarking/` directory:

```bash
cd Benchmarking
```

### 1. Configure environment variables

The Vite dev server **requires** `VITE_API_URL` (it throws on startup if missing).
Copy the example file and fill it in:

```bash
cp .env.example .env
```

`.env`:

```bash
# Backend API origin (proxied under /api by the dev server).
VITE_API_URL=http://localhost:8002

# Optional: browser to open when the dev server starts (chrome, firefox, safari, or a path).
# Leave unset to use the system default.
BROWSER=chrome
```

### 2. Install dependencies

```bash
pnpm install
```

> **Note:** pnpm asks to approve build scripts for native packages (e.g. `esbuild`).
> This is pre-approved via `pnpm-workspace.yaml` (`onlyBuiltDependencies`). If a fresh
> install still reports ignored builds, run `pnpm approve-builds` and select `esbuild`.

---

## Running the App

### Development server

```bash
pnpm dev
```

Starts Vite with hot-module reload and opens the app in your browser. Requests to
`/api` are proxied to `VITE_API_URL`.

### Production build

```bash
pnpm build
```

Type-checks (`tsc --noEmit`) and produces an optimized bundle in `Benchmarking/dist/`.

### Preview the production build

```bash
pnpm preview
```

Serves the built `dist/` locally so you can verify the production output.

---

## Other Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm lint`          | Run ESLint over the project              |
| `pnpm lint:fix`      | Run ESLint and auto-fix                  |
| `pnpm format`        | Format all files with Prettier           |
| `pnpm test`          | Run the Vitest suite once                |
| `pnpm test:watch`    | Run Vitest in watch mode                 |
| `pnpm test:coverage` | Run tests with a coverage report         |

---

## Project Structure

```
Benchmarking/
├── src/
│   ├── app/                 # App shell — providers, layout, constants
│   ├── features/
│   │   └── benchmarks/      # Benchmarks feature: components, data (queries/services/selectors), store
│   └── shared/
│       ├── api/             # HTTP client (baseClient) + TanStack QueryClient config
│       └── ui/              # Local UI primitives — forms, tables, charts, icons
├── index.html
├── vite.config.ts
└── package.json
```

See [`Benchmarking/CLAUDE.md`](Benchmarking/CLAUDE.md) for architecture details.

---

## Licensing

CoreSpan AI's source in this repository is licensed **Apache-2.0** — see
[`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).

Apache-2.0 Section 6 grants no trademark rights. "CoreSpan" and the CoreSpan
logo are trademarks of CoreSpan AI.

One consequence of that is worth stating rather than leaving to inference: the
copyright grant in Section 2 covers every file here, so the two image files that
carry the marks — `Benchmarking/public/corespan.png` and
`Benchmarking/public/favicon.svg` — are excluded from it. Swap them out if you
redistribute a modified version. Every other asset is covered normally. See
[`NOTICE`](NOTICE).

### Third-party attribution

This is a browser application: every visitor receives a bundle containing ~54
open-source packages. Serving that bundle is distribution, and MIT, BSD, ISC and
OFL-1.1 all require the copyright notice to travel with a distributed copy.

| What | Where |
| --- | --- |
| Inventory of bundled packages | [`Benchmarking/THIRD-PARTY-NOTICES.md`](Benchmarking/THIRD-PARTY-NOTICES.md) |
| Full licence texts, served with the app | `/aistudio/third-party-licences.txt`, linked from the app footer |
| Response to the licence review | [`docs/LICENCE-REVIEW-RESPONSE.md`](docs/LICENCE-REVIEW-RESPONSE.md) |

The production tree is entirely permissive — no GPL, LGPL or MPL. The
obligations are attribution only.

### Verifying it yourself

```bash
cd Benchmarking
pnpm licences          # regenerate the inventory and the served licence texts
pnpm licences:check    # fail if either is stale
pnpm compliance        # everything CI checks, minus the build-output assertions
```

CI runs the same checks plus two that can only be made against a real build —
that the licence file lands in `dist/` and that the bundle links it. See
[`.github/workflows/compliance.yml`](.github/workflows/compliance.yml).

Regenerate the inventory whenever dependencies change; CI fails if it drifts.
