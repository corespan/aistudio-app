import { CLIENT_TOOLS } from '../tools/clientTools'
import type { ToolCall } from '../types'
import { getLocalEngine } from './localEngine'

/**
 * Tools the local AI may run on its own: harmless and undoable. `fill_input`
 * only types or picks a value — nothing is submitted until the user clicks.
 * `click_element` is left out on purpose: a loose match could press a real
 * button such as "Delete run".
 */
export const LOCAL_SAFE_TOOLS = new Set([
  'navigate',
  'go_back',
  'start_benchmark', // only opens the wizard — nothing runs until the user submits
  'set_benchmark_type',
  'reset_filters',
  'open_blog_post',
  'set_color_scheme',
  'set_theme',
  'reset_theme',
  'set_style',
  'reset_styles',
  'fill_input',
  'set_benchmark_field', // fills the wizard; the user still clicks "Start Benchmark"
  'wizard_next',
  'list_fields',
  'help',
])

/** Most steps the model may plan for one message. */
export const MAX_CALLS = 5

const SAFE_TOOLS = CLIENT_TOOLS.filter((tool) => LOCAL_SAFE_TOOLS.has(tool.name))

/** Every argument name any safe tool takes — all plain strings. */
const ARG_NAMES = [
  ...new Set(SAFE_TOOLS.flatMap((tool) => Object.keys(tool.parameters.properties))),
]

/** The shape the model's answer must have. WebLLM enforces it while generating. */
const ANSWER_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    calls: {
      type: 'array',
      maxItems: MAX_CALLS,
      items: {
        type: 'object',
        properties: {
          tool: { type: 'string', enum: SAFE_TOOLS.map((tool) => tool.name) },
          args: {
            type: 'object',
            properties: Object.fromEntries(ARG_NAMES.map((name) => [name, { type: 'string' }])),
          },
        },
        required: ['tool', 'args'],
      },
    },
  },
  required: ['calls'],
})

const TOOL_MENU = SAFE_TOOLS.map((tool) => {
  const args = Object.entries(tool.parameters.properties)
    .map(
      ([name, p]) => `${name}${p.enum ? ` (one of: ${p.enum.join(', ')})` : ''}: ${p.description}`,
    )
    .join('; ')
  return `- ${tool.name}: ${tool.description}${args ? ` Args → ${args}` : ''}`
}).join('\n')

/**
 * @param fields one line per form field on screen (see `describeFields`), so
 *   the model can map any wording onto the fields that actually exist.
 */
export const buildSystemPrompt = (pathname: string, fields: string[] = []) =>
  [
    'You are CoreMind, the assistant that controls the AI Studio web app.',
    `The user is currently on the page "${pathname}".`,
    `Turn the request below into a list of tool calls, in order (at most ${MAX_CALLS}).`,
    'Use one call per field when the user gives several values. If nothing fits, or you are unsure, return an empty list.',
    'Only fill in args the chosen tool lists. Use plain values, e.g. "teal", "dark", "sidebar".',
    '',
    'Tools:',
    TOOL_MENU,
    '',
    fields.length
      ? [
          'Form fields on screen now — to fill one, call fill_input with target = the field name exactly as written:',
          ...fields.map((line) => `- ${line}`),
        ].join('\n')
      : 'There are no form fields on screen now.',
    '',
    'Examples:',
    '"it is way too bright" → {"calls":[{"tool":"set_color_scheme","args":{"scheme":"dark"}}]}',
    '"I want a crimson vibe on the left menu" → {"calls":[{"tool":"set_style","args":{"target":"sidebar","css":"background-color: crimson"}}]}',
    '"how fast does the first token come back" → {"calls":[{"tool":"set_benchmark_type","args":{"type":"TTFT"}}]}',
    '"my machine is 10.0.0.12 and I want to test mistral" → {"calls":[{"tool":"set_benchmark_field","args":{"field":"nodeIp","value":"10.0.0.12"}},{"tool":"set_benchmark_field","args":{"field":"model","value":"mistral"}}]}',
    '"64 users at once, half precision" (fields Concurrency, Precision on screen) → {"calls":[{"tool":"fill_input","args":{"target":"Concurrency","value":"64"}},{"tool":"fill_input","args":{"target":"Precision","value":"fp16"}}]}',
    '"delete all my runs" → {"calls":[]}',
  ].join('\n')

/** One planned call → a safe ToolCall, or null. Never trust the model blindly. */
const toSafeCall = (raw: unknown): ToolCall | null => {
  if (!raw || typeof raw !== 'object') return null
  const { tool, args } = raw as { tool?: unknown; args?: unknown }
  if (typeof tool !== 'string' || !LOCAL_SAFE_TOOLS.has(tool)) return null
  const cleanArgs = Object.fromEntries(
    Object.entries((args ?? {}) as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
    ),
  )
  return { tool, args: cleanArgs }
}

/**
 * Turns the model's raw reply into the tool calls to run, in order. Calls to
 * tools it may not use are dropped (the safe list is checked again here);
 * anything unreadable gives an empty plan.
 */
export const parseDecision = (raw: string | null | undefined): ToolCall[] => {
  try {
    const parsed = JSON.parse(raw ?? '') as { calls?: unknown }
    if (!Array.isArray(parsed.calls)) return []
    return parsed.calls
      .slice(0, MAX_CALLS)
      .map(toSafeCall)
      .filter((call): call is ToolCall => call !== null)
  } catch {
    return []
  }
}

/** Ask the local model what to do. An empty list means "not mine — try elsewhere". */
export const localPickTool = async (
  message: string,
  pathname: string,
  fields: string[] = [],
): Promise<ToolCall[]> => {
  const engine = await getLocalEngine()
  const reply = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: buildSystemPrompt(pathname, fields) },
      { role: 'user', content: message },
    ],
    temperature: 0, // same message → same decision
    max_tokens: 400,
    response_format: { type: 'json_object', schema: ANSWER_SCHEMA },
    extra_body: { enable_thinking: false }, // Qwen3: skip the slow "thinking" step
  })
  return parseDecision(reply.choices[0]?.message?.content)
}
