import { AiClient } from '@/shared/api/baseClient'
import { API_ORIGIN } from '@/shared/api/config'
import { parseRunEvent, type RunEvent } from './events'
import { createSseDecoder } from './sse'
import type { AgentTransport } from './transport'

/**
 * DRAFT endpoints, relative to `/api/v1/`. The platform hasn't published its
 * caller API yet — confirm these with the backend team and change them here.
 */
export const AGENT_ENDPOINTS = {
  /** POST { input, context } → `text/event-stream` of RunEvents. */
  runs: 'assistant/runs',
  approve: (runId: string) => `assistant/runs/${encodeURIComponent(runId)}/approve`,
  reject: (runId: string) => `assistant/runs/${encodeURIComponent(runId)}/reject`,
  cancel: (runId: string) => `assistant/runs/${encodeURIComponent(runId)}/cancel`,
}

/** The real agent platform: one POST that streams the run back as SSE. */
export const httpTransport: AgentTransport = {
  start(request, onEvent) {
    const controller = new AbortController()
    let runId: string | undefined

    const emit = (event: RunEvent) => {
      if (event.type === 'run.started') runId = event.runId
      onEvent(event)
    }

    const done = (async () => {
      // fetch, not EventSource: EventSource can't POST a body or send auth headers.
      const response = await fetch(`${API_ORIGIN}/api/v1/${AGENT_ENDPOINTS.runs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        // Session cookie today; add the JWT header here once the app has one.
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(request),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) {
        throw new Error(`The assistant is unavailable right now (HTTP ${response.status}).`)
      }

      const decoder = createSseDecoder((data) => {
        let raw: unknown
        try {
          raw = JSON.parse(data)
        } catch {
          return // not JSON — skip it rather than break the run
        }
        const event = parseRunEvent(raw)
        if (event) emit(event)
      })

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      for (;;) {
        const { value, done: finished } = await reader.read()
        if (finished) break
        decoder.push(value)
      }
      decoder.flush()
    })()

    const requireRunId = () => {
      if (!runId) throw new Error('The run has not started yet.')
      return runId
    }

    return {
      done,
      approve: async () => {
        await AiClient.post(AGENT_ENDPOINTS.approve(requireRunId()), {})
      },
      reject: async () => {
        await AiClient.post(AGENT_ENDPOINTS.reject(requireRunId()), {})
      },
      cancel: () => {
        controller.abort()
        // Best effort: tell the server too, so it stops spending the budget.
        if (runId) void AiClient.post(AGENT_ENDPOINTS.cancel(runId), {}).catch(() => {})
      },
    }
  },
}
