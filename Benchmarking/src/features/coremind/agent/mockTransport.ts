import type { PlanStep, RunEvent } from './events'
import type { AgentTransport, StartRunRequest } from './transport'

/**
 * A fake agent platform so the panel can be built and demoed before the API
 * exists. It mimics the planner (picks an agent from the message), the
 * plan → approve → execute flow, tool steps, budgets and UI actions.
 *
 * Try: "start a benchmark", "why is this run slow?", "service status",
 * "compare the latest runs", "use up the budget".
 */

/** Yields events; receives `true`/`false` back after a `plan.proposed` (approved or not). */
type Scenario = (request: StartRunRequest) => Generator<RunEvent, void, boolean | undefined>

const STEP_DELAY_MS = 450
const TOKEN_DELAY_MS = 28

let runCounter = 0
const newRunId = () => `mock-run-${++runCounter}`

/** Stream text the way a model does — a word at a time. */
function* say(text: string): Generator<RunEvent, void, boolean | undefined> {
  for (const word of text.match(/\S+\s*/g) ?? []) yield { type: 'token', text: word }
}

const quoteOf = (request: StartRunRequest) => {
  const selection = request.context.selection?.trim()
  if (!selection) return ''
  const short = selection.length > 80 ? `${selection.slice(0, 80)}…` : selection
  return `About the text you selected ("${short}"): `
}

const budget = (stepsUsed: number, stepsMax: number, elapsedS: number, maxS: number) =>
  ({ type: 'budget', stepsUsed, stepsMax, elapsedS, maxS }) as const

const startBenchmark: Scenario = function* () {
  yield { type: 'run.started', runId: newRunId(), agent: 'analyst' }
  yield budget(0, 6, 0, 300)
  const plan: PlanStep[] = [
    {
      id: 'p1',
      title: 'Look up the models and GPU types you can benchmark',
      tool: 'aistudio/benchmark_options',
      class: 'read',
    },
    {
      id: 'p2',
      title: 'Open the Start Benchmark wizard on this page',
      tool: 'ui/start_benchmark',
      class: 'closed',
    },
  ]
  const approved = yield { type: 'plan.proposed', steps: plan }
  if (!approved) return

  yield {
    type: 'tool.call',
    id: 't1',
    tool: 'aistudio/benchmark_options',
    title: 'Looking up models and GPU types',
    class: 'read',
  }
  yield { type: 'tool.result', id: 't1', ok: true, summary: '4 models · 2 GPU types (demo data)' }
  yield budget(1, 6, 3, 300)
  yield { type: 'ui.action', tool: 'start_benchmark', args: {} }
  yield budget(2, 6, 4, 300)
  yield* say(
    "I've opened the Start Benchmark wizard. Pick a model and GPU type, then click Start Benchmark on the last step. " +
      "I can't start runs on my own yet — that needs the platform's approval gates (step 7).",
  )
  yield { type: 'run.completed' }
}

const diagnose: Scenario = function* (request) {
  yield { type: 'run.started', runId: newRunId(), agent: 'diagnostics' }
  yield budget(0, 8, 0, 300)
  yield {
    type: 'tool.call',
    id: 't1',
    tool: 'aistudio/task_logs',
    title: 'Reading the task logs',
    class: 'read',
  }
  yield { type: 'tool.result', id: 't1', ok: true, summary: '312 log lines, 3 warnings' }
  yield budget(1, 8, 4, 300)
  yield {
    type: 'tool.call',
    id: 't2',
    tool: 'fabric/gpu_node_probe',
    title: 'Checking GPU node health',
    class: 'read',
  }
  yield { type: 'tool.result', id: 't2', ok: true, summary: 'All nodes reachable' }
  yield budget(2, 8, 9, 300)
  yield* say(
    quoteOf(request) +
      'The slowdown lines up with a warm-up phase: the first 40 requests ran at roughly twice the p99 latency of the rest. ' +
      'This is demo data — connect the real agent platform to get an actual diagnosis.',
  )
  yield { type: 'run.completed' }
}

const status: Scenario = function* () {
  yield { type: 'run.started', runId: newRunId(), agent: 'assistant' }
  yield budget(0, 4, 0, 180)
  yield {
    type: 'tool.call',
    id: 't1',
    tool: 'aistudio/service_health',
    title: 'Checking service health',
    class: 'read',
  }
  yield { type: 'tool.result', id: 't1', ok: true, summary: 'API and database healthy' }
  yield budget(1, 4, 2, 180)
  yield* say('Everything is up: the API and the database both report healthy. (Demo data.)')
  yield { type: 'run.completed' }
}

const outOfBudget: Scenario = function* () {
  yield { type: 'run.started', runId: newRunId(), agent: 'assistant' }
  for (let step = 1; step <= 4; step++) {
    yield {
      type: 'tool.call',
      id: `t${step}`,
      tool: 'aistudio/recent_runs',
      title: `Searching recent runs (page ${step})`,
      class: 'read',
    }
    yield { type: 'tool.result', id: `t${step}`, ok: true }
    yield budget(step, 4, step * 40, 180)
  }
  yield {
    type: 'run.failed',
    code: 'budget_exceeded',
    message: 'This helper used all 4 of its steps before finishing.',
  }
}

const analyse: Scenario = function* (request) {
  yield { type: 'run.started', runId: newRunId(), agent: 'analyst' }
  yield budget(0, 6, 0, 300)
  const approved = yield {
    type: 'plan.proposed',
    steps: [
      {
        id: 'p1',
        title: 'Find the latest benchmark runs',
        tool: 'aistudio/find_runs',
        class: 'read',
      },
      {
        id: 'p2',
        title: 'Compare their throughput and latency',
        tool: 'aistudio/compare',
        class: 'read',
      },
      { id: 'p3', title: 'Open the Benchmarks page', tool: 'ui/navigate', class: 'closed' },
    ],
  }
  if (!approved) return
  yield {
    type: 'tool.call',
    id: 't1',
    tool: 'aistudio/find_runs',
    title: 'Finding the latest runs',
    class: 'read',
  }
  yield { type: 'tool.result', id: 't1', ok: true, summary: '2 runs found' }
  yield budget(1, 6, 3, 300)
  yield {
    type: 'tool.call',
    id: 't2',
    tool: 'aistudio/compare',
    title: 'Comparing throughput and latency',
    class: 'read',
  }
  yield { type: 'tool.result', id: 't2', ok: true, summary: 'Compared 6 metrics' }
  yield budget(2, 6, 7, 300)
  yield { type: 'ui.action', tool: 'navigate', args: { section: 'benchmarks' } }
  yield* say(
    quoteOf(request) +
      'The newer run is about 18% faster on throughput with a similar p99 latency. ' +
      "I've opened the Benchmarks page so you can check the numbers. (Demo data.)",
  )
  yield { type: 'run.completed' }
}

/** Stand-in for the platform's planner: pick an agent from the wording. */
export const pickScenario = (input: string): Scenario => {
  const text = input.toLowerCase()
  if (/\bbudget\b/.test(text)) return outOfBudget
  if (/\b(start|run|launch|new)\b.*\bbenchmarks?\b/.test(text)) return startBenchmark
  if (/\b(why|slow|fail(ed|ing|ure)?|error|latency|debug|investigate)\b/.test(text)) return diagnose
  if (/\b(status|health|healthy|up|down|recent)\b/.test(text)) return status
  return analyse
}

const abortError = () => new DOMException('The run was cancelled.', 'AbortError')

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(abortError())
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(abortError())
      },
      { once: true },
    )
  })

export const mockTransport: AgentTransport = {
  start(request, onEvent) {
    const controller = new AbortController()
    const { signal } = controller
    let answer: ((approved: boolean) => void) | undefined

    const waitForAnswer = () =>
      new Promise<boolean>((resolve, reject) => {
        answer = resolve
        signal.addEventListener('abort', () => reject(abortError()), { once: true })
      })

    const done = (async () => {
      const run = pickScenario(request.input)(request)
      let next = run.next()
      while (!next.done) {
        const event = next.value
        await sleep(event.type === 'token' ? TOKEN_DELAY_MS : STEP_DELAY_MS, signal)
        onEvent(event)
        next = run.next(event.type === 'plan.proposed' ? await waitForAnswer() : undefined)
      }
    })()

    return {
      done,
      approve: async () => answer?.(true),
      reject: async () => answer?.(false),
      cancel: () => controller.abort(),
    }
  },
}
