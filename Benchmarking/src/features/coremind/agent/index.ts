import { httpTransport } from './httpTransport'
import { mockTransport } from './mockTransport'
import type { AgentTransport } from './transport'

/**
 * `mock` (default) until the agent platform's API is live; set
 * VITE_AGENT_TRANSPORT=http in .env to talk to the real backend.
 */
export const AGENT_TRANSPORT_MODE: 'mock' | 'http' =
  import.meta.env.VITE_AGENT_TRANSPORT === 'http' ? 'http' : 'mock'

export const agentTransport: AgentTransport =
  AGENT_TRANSPORT_MODE === 'http' ? httpTransport : mockTransport

/** Display names for the platform's agents. Unknown agents show their raw name. */
export const AGENT_LABELS: Record<string, string> = {
  analyst: 'Analyst',
  assistant: 'Assistant',
  diagnostics: 'Diagnostics',
}

export const agentLabel = (agent?: string) =>
  agent ? (AGENT_LABELS[agent] ?? agent) : 'Choosing a helper…'
