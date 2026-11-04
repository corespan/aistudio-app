import { z } from 'zod'

/**
 * Wire format of an agent run, as streamed by the agent platform.
 *
 * DRAFT CONTRACT — the platform's caller API isn't documented yet (see the
 * Generic Agent Platform doc: "API · SSE · UI", no schemas). This is the shape
 * the panel is built against; confirm it with the backend team and adjust here
 * only. Every event is validated, so a mismatch is dropped instead of crashing
 * the panel.
 */

/** Tool classes from the platform doc: read/closed run freely, write/destructive need approval. */
export const TOOL_CLASSES = ['read', 'closed', 'write', 'destructive'] as const
const toolClassSchema = z.enum(TOOL_CLASSES)
export type ToolClass = z.infer<typeof toolClassSchema>

export const planStepSchema = z.object({
  id: z.string(),
  /** Human wording, e.g. "Find the latest Llama runs". */
  title: z.string(),
  /** Platform tool name, `connector/tool`. */
  tool: z.string(),
  class: toolClassSchema,
})
export type PlanStep = z.infer<typeof planStepSchema>

export const runEventSchema = z.discriminatedUnion('type', [
  /** First event: which agent the planner picked for this message. */
  z.object({ type: z.literal('run.started'), runId: z.string(), agent: z.string() }),
  /** plan → approve → execute: the run pauses until the user approves or rejects. */
  z.object({ type: z.literal('plan.proposed'), steps: z.array(planStepSchema).min(1) }),
  z.object({
    type: z.literal('tool.call'),
    id: z.string(),
    tool: z.string(),
    title: z.string().optional(),
    class: toolClassSchema,
  }),
  z.object({
    type: z.literal('tool.result'),
    id: z.string(),
    ok: z.boolean(),
    summary: z.string().optional(),
  }),
  /** A chunk of the answer text — appended as it arrives. */
  z.object({ type: z.literal('token'), text: z.string() }),
  /**
   * Ask the browser to run one of CoreMind's client tools (navigate, open the
   * wizard, ...). Only names in the client-tool registry run — anything else is ignored.
   */
  z.object({
    type: z.literal('ui.action'),
    tool: z.string(),
    args: z.record(z.string(), z.string()).default({}),
  }),
  z.object({
    type: z.literal('budget'),
    stepsUsed: z.number(),
    stepsMax: z.number(),
    elapsedS: z.number(),
    maxS: z.number(),
  }),
  z.object({ type: z.literal('run.completed') }),
  /** e.g. `budget_exceeded`, `forbidden`, `step_up_required`, `tool_error`. */
  z.object({ type: z.literal('run.failed'), code: z.string(), message: z.string() }),
])
export type RunEvent = z.infer<typeof runEventSchema>

/** Validate one decoded event. Unknown or malformed events return null and are skipped. */
export const parseRunEvent = (raw: unknown): RunEvent | null => {
  const result = runEventSchema.safeParse(raw)
  return result.success ? result.data : null
}
