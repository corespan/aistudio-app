# AI Studio App

This repository hosts the **Benchmarking** app — a React SPA for running and viewing
Corespan Fabric benchmarks.

The application lives in the [`Benchmarking/`](Benchmarking) directory.

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
