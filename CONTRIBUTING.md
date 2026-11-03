# Contributing to AI Studio App

Thank you for your interest in contributing to the **AI Studio App**! We welcome contributions from the community — whether you are fixing bugs, proposing new features, adding documentation, or contributing new benchmark datasets and results.

This document outlines the guidelines and workflow for contributing to this project.

---

## Table of Contents

1. [How to Contribute](#how-to-contribute)
   - [Reporting Issues](#reporting-issues)
   - [Development Setup](#development-setup)
   - [Development Workflow](#development-workflow)
   - [Coding Standards & Formatting](#coding-standards--formatting)
   - [Compliance & Licensing Requirements](#compliance--licensing-requirements)
2. [Areas that Can Be Improved](#areas-that-can-be-improved)
3. [Adding Benchmarks (Import / Export via CLI & Server)](#adding-benchmarks-import--export-via-cli--server)
   - [Overview of Benchmarks](#overview-of-benchmarks)
   - [Running Benchmarks with `aistudio-cli`](#running-benchmarks-with-aistudio-cli)
   - [Benchmark Results Structure](#benchmark-results-structure)
   - [Exporting Benchmark Runs](#exporting-benchmark-runs)
   - [Importing Benchmark Runs into `aistudio-server`](#importing-benchmark-runs-into-aistudio-server)
   - [Contributing Import/Export Features to the App](#contributing-importexport-features-to-the-app)
4. [Community & Getting Help](#community--getting-help)

---

## How to Contribute

### Reporting Issues

Before opening a new issue:
- Check existing [GitHub Issues](https://github.com/corespan/aistudio-app/issues) to ensure the bug or feature hasn't already been reported or requested.
- If filing a **bug report**, provide clear reproduction steps, browser version, environment configuration, expected vs. actual behavior, and relevant console/network logs.
- If submitting a **feature request**, articulate the problem you are solving, the proposed user experience or API change, and any alternative solutions considered.

### Development Setup

#### Prerequisites
- **Node.js** ≥ 20
- **pnpm** ≥ 10 (this repository strictly uses `pnpm`)

```bash
npm install -g pnpm
```

#### Clone and Install
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/aistudio-app.git
   cd aistudio-app/Benchmarking
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure `VITE_API_URL` to point to a running `aistudio-server` backend instance (e.g. `http://localhost:8002`). The dev server requires `VITE_API_URL` to start.

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```
   This will run Vite with hot-module reloading and open the app in your browser.

### Development Workflow

1. Create a feature branch off the default branch (`master`):
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes adhering to project architectural patterns (see `Benchmarking/CLAUDE.md`).
3. Run local verifications:
   ```bash
   # Run type checks
   npx tsc --noEmit

   # Run compliance checks (licenses, asset origins, attribution)
   pnpm compliance

   # Format code
   pnpm format
   ```
4. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(benchmarks): add export to CSV button"
   ```
5. Push to your fork and submit a Pull Request against the `corespan/aistudio-app` repository.

### Coding Standards & Formatting

- **Single API Client**: Always use the shared `baseClient` instance (`AiClient` from `@/shared/api/baseClient`). Do not instantiate new Axios or Fetch clients.
- **Import Alias**: Use the `@` alias (`@/...`) for paths starting at `src/`. Avoid deep relative imports like `../../../shared/...`.
- **UI Components**: Use Mantine 9 components and local primitives under `@/shared/ui` (`CoreTable`, `CoreChart`, `CoreForm`, `CoreIcon`).
- **Formatting**: Adhere to Prettier formatting rules defined in `Benchmarking/.prettierrc`.

### Compliance & Licensing Requirements

AI Studio App is an open-source project licensed under **Apache-2.0**.
Because this application is distributed directly to user browsers as client bundles, copyright and license attribution must remain strictly compliant:
- **Adding new npm packages**: Whenever dependencies in `package.json` are added or changed, regenerate the third-party license notices:
  ```bash
  cd Benchmarking
  pnpm licences
  ```
- **Compliance verification**: Ensure CI compliance checks pass locally:
  ```bash
  cd Benchmarking
  pnpm compliance
  ```
- **Trademarks & Assets**: Note that "CoreSpan" and company logos are protected trademarks. See `NOTICE` and `README.md` for guidelines.

---

## Areas that Can Be Improved

We actively welcome contributions in the following areas:

1. **Benchmark Import & Export UI**:
   - Provide in-app UI to export benchmark runs to CSV or JSON directly from the table or chart.
   - Provide file drag-and-drop or upload dialog to import historical `benchmark_result.json` files without needing direct database manipulation.
2. **Benchmark Visualizations & Comparisons**:
   - Side-by-side run comparisons with delta metrics (e.g. comparing TTFT / TPOT across hardware revisions or model quantizations).
   - Advanced filtering presets (by GPU family, concurrency threshold, or precision).
   - Custom chart series configuration (selecting custom X/Y metrics).
3. **Automated Test Coverage**:
   - Adding Vitest unit and component tests under `Benchmarking/src/` for UI primitives, data selectors, and store logic.
   - Adding integration tests for table filtering and log streaming flows.
4. **Error Handling & Observability**:
   - Improving user-facing error boundaries and friendly offline/reconnect banners for SSE log streams.
   - Enhanced validation feedback on the Start Benchmark modal forms.
5. **Accessibility & Responsive Polish**:
   - Enhancing keyboard navigation and ARIA attributes in custom table and chart controls.
   - Optimizing dashboard layouts for smaller screens and mobile viewports.

---

## Adding Benchmarks (Import / Export via CLI & Server)

Contributors can contribute benchmark runs or add tooling to import and export results between [`aistudio-cli`](https://github.com/corespan/aistudio-cli), the backend [`aistudio-server`](https://github.com/corespan/aistudio-server), and this dashboard app.

### Overview of Benchmarks

Benchmarks in AI Studio evaluate GPU inference performance across LLMs, capturing critical serving metrics:
- **Throughput**: Total tokens generated per second.
- **TTFT**: Time to First Token (in milliseconds).
- **TPOT**: Time Per Output Token (in milliseconds).
- **E2EL**: End-to-End Latency (in milliseconds).
- **Concurrency**: Number of concurrent clients generating requests.

### Running Benchmarks with `aistudio-cli`

To generate real benchmark data on your GPU machine, you can run `ai-studio-cli`:

1. Install `ai-studio-cli`:
   ```bash
   curl -sL https://raw.githubusercontent.com/corespan/aistudio-cli/master/install.sh | bash
   ```
2. Run a benchmark run (e.g., using synthetic tokens or standard datasets):
   ```bash
   # Synthetic token benchmark
   ai-studio-cli bench --endpoint http://<ip>:<port> --concurrency 20 --requests 200

   # Custom dataset benchmark (e.g. ShareGPT)
   ai-studio-cli bench --endpoint http://<ip>:<port> --dataset sharegpt --dataset-path ./ShareGPT_V3_unfiltered_cleaned_split.json --requests 500 --concurrency 32
   ```

### Benchmark Results Structure

When `ai-studio-cli` completes a benchmark run, it outputs a structured JSON file at:
```
bench-results/{model}/{gpu_tag}/{timestamp}/benchmark_result.json
```

A benchmark record in the app and backend contains the following standard structure:

```json
{
  "run_id": "run-20260515-104523-a100",
  "model_name": "Qwen2.5-32B-Instruct",
  "node_ips": ["192.168.1.50"],
  "server_name": "node-01",
  "gpu_type": "NVIDIA A100-SXM4-80GB",
  "gpu_count": 4,
  "workload_type": "vLLM Serving",
  "precision": "FP8",
  "concurrency": 32,
  "total_token_throughput": 1420.5,
  "mean_ttft_ms": 42.8,
  "mean_tpot_ms": 14.2,
  "mean_e2el_ms": 320.6,
  "status": "completed",
  "started_at": "2026-05-15T10:45:23Z",
  "completed_at": "2026-05-15T10:52:10Z"
}
```

### Exporting Benchmark Runs

1. **Via `aistudio-cli`**:
   Results are already exported as JSON files in `bench-results/`. You can also run the CLI with `--json`:
   ```bash
   ai-studio-cli nvbandwidth nvlink --json > nvlink_results.json
   ```
2. **Via `aistudio-server` REST API**:
   You can fetch and export stored benchmark runs directly:
   ```bash
   curl -s "http://<aistudio-server-host>:8002/api/v1/benchmarks" | jq . > exported_benchmarks.json
   ```

### Importing Benchmark Runs into `aistudio-server`

To populate benchmark runs from `aistudio-cli` into the backend database:
1. **Via Server API**:
   Post the benchmark payload to `aistudio-server`:
   ```bash
   curl -X POST "http://<aistudio-server-host>:8002/api/v1/benchmarks" \
     -H "Content-Type: application/json" \
     -d @benchmark_result.json
   ```
2. **Via Database Seed / Migration**:
   If hosting a local `aistudio-server`, you can load historical benchmark JSON records into your PostgreSQL/SQLite database backing the API. Once inserted, `aistudio-app` automatically queries and visualizes them on the Benchmarks page.

### Contributing Import/Export Features to the App

Contributions to integrate import/export directly in this frontend app are highly appreciated!
Recommended integration points:
- **Export**: In `Benchmarking/src/features/benchmarks/components/BenchmarksHeader.tsx` or `BenchmarksTable.tsx`, add an **Export** menu option (CSV/JSON) utilizing current table filter states.
- **Import**: Add an **Import Benchmark** action to `BenchmarksHeader.tsx` that accepts a JSON result file (or archive of runs) and uploads it to the server endpoint or visualizes it locally.

---

## Community & Getting Help

- **Discussions & Issues**: Join our GitHub issues to ask questions, propose RFCs, or request help.
- **Pull Requests**: Pull requests are reviewed by maintainers; please allow a few days for review and feedback.
