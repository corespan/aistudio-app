import type { SectionKey } from '@/app/constants'
import type { ThemeOverrides } from '@/app/theme/useThemeStore'
import type { StartBenchmarkWizardBridge } from '@/features/benchmarks/types'

/**
 * Browser-side capabilities a client tool may use. Built once per render by
 * `useToolContext` so tools stay plain functions with no React dependency —
 * which is also what makes them unit-testable with a stub context.
 */
export type ToolContext = {
  /** Current router path (relative to the app basename), e.g. `/blogs`. */
  pathname: string
  navigateTo: (section: SectionKey) => void
  navigatePath: (path: string) => void
  goBack: () => void
  openStartBenchmark: () => void
  setBenchmarkType: (type: string) => void
  resetFilters: () => void
  setColorScheme: (scheme: 'light' | 'dark' | 'toggle') => void
  /** Current theme customisations. */
  theme: ThemeOverrides
  setTheme: (patch: ThemeOverrides) => void
  resetTheme: () => void
  /** The Start Benchmark wizard when it is mounted (null otherwise). */
  startBenchmarkWizard?: () => StartBenchmarkWizardBridge | null
  /** Go to Benchmarks, open the wizard, and wait until it is ready. */
  openStartBenchmarkWizard?: () => Promise<StartBenchmarkWizardBridge | null>
}

/** JSON-schema subset describing a tool's arguments — the shape LLM tool-calling APIs expect. */
export type ToolParameters = {
  type: 'object'
  properties: Record<string, { type: 'string'; description: string; enum?: string[] }>
  required?: string[]
}

/**
 * A client tool: an action CoreMind performs directly in the browser.
 * `execute` returns the reply shown in the chat — async for tools that wait
 * on the page (e.g. a dropdown opening).
 */
export type ClientTool = {
  name: string
  description: string
  parameters: ToolParameters
  execute: (args: Record<string, string>, ctx: ToolContext) => string | Promise<string>
}

/** A resolved command — which tool to call, and with what. */
export type ToolCall = {
  tool: string
  args: Record<string, string>
}

/** Who decided which tool to run: the regex rules or the in-browser model. */
export type CommandSource = 'rules' | 'local-ai'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Name of the tool that produced an assistant reply, shown as a badge. */
  tool?: string
  /** Who picked the tool — shown as a second badge when it was the local AI. */
  source?: CommandSource
  /** Set on agent replies: the run's state lives in `useAgentStore` under the message id. */
  agentRun?: true
  /** Page text the user attached to this message ("Ask CoreMind" on a selection). */
  quote?: string
}

/** Agent: the agent platform answers. Commands: the local rules / in-browser model. */
export type CoreMindMode = 'agent' | 'commands'

export type CoreMindStore = {
  isOpen: boolean
  mode: CoreMindMode
  messages: ChatMessage[]
  toggle: () => void
  open: () => void
  close: () => void
  setMode: (mode: CoreMindMode) => void
  /** Adds a message and returns its id. */
  addMessage: (message: Omit<ChatMessage, 'id'>) => string
  clear: () => void
}
