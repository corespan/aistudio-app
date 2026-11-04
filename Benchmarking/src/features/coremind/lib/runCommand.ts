import { getClientTool } from '../tools/clientTools'
import { useLocalAIStore } from '../localai/useLocalAIStore'
import type { CommandSource, ToolCall, ToolContext } from '../types'
import { describeFields, fieldsInFocus } from './fields'
import { parseCommand } from './parseCommand'
import { fixLeadingVerb } from './parseDomCommand'
import { parseFieldCommand } from './parseFieldCommand'
import { parseWizard } from './parseWizard'

export type CommandReply = { text: string; tool?: string; source?: CommandSource }

export type RunCommandOptions = {
  /** Called with the growing reply while the local AI writes an answer. */
  onPartial?: (textSoFar: string) => void
}

const SORRY = `Sorry, I didn't understand that. Type "help" to see what I can do.`
const SORRY_LOCAL_OFF = `${SORRY} To ask general questions (like "what is a GPU?"), switch on Local AI above.`
const SORRY_COMMAND = `I couldn't work out which field or action you meant. Type "help" to see what I can do.`

/**
 * Messages that start like an instruction ("add …", "set …"). When no tool fits
 * one of these, a written answer would only be made-up text — say so instead.
 */
const LOOKS_LIKE_COMMAND =
  /^(?:please\s+)?(?:add|set|put|enter|type|fill|select|choose|pick|change|update|make|open|go|click|press|start|run|launch|delete|remove|clear|use|insert)\b/i

/** Give React a moment to apply one step (e.g. open a modal) before the next runs. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 60))

/**
 * Turn a message into a reply:
 *   1. rules (instant, free): the wizard's step commands, then "add <field>
 *      <value>" for any field on screen — a field's real label beats the fuzzy
 *      synonym rules ("add retries 3" must not become "start benchmarks") —
 *      then the fixed rules;
 *   2. otherwise, if Local AI is on and loaded, the local model plans the calls;
 *   3. otherwise the local model answers the message as a question.
 */
export const runCommand = async (
  input: string,
  ctx: ToolContext,
  options: RunCommandOptions = {},
): Promise<CommandReply> => {
  const ruled =
    parseWizard(fixLeadingVerb(input)) ??
    parseFieldCommand(input, fieldsInFocus()) ??
    parseCommand(input)
  let calls: ToolCall[] = ruled ? [ruled] : []
  // Only set when the local AI made the decision, so rule-based replies keep their old shape.
  let source: CommandSource | undefined

  const localAI = useLocalAIStore.getState()
  const localReady = localAI.enabled && localAI.status === 'ready'

  if (!calls.length && localReady) {
    // Imported on demand so the WebLLM library stays out of the main bundle.
    const { localPickTool } = await import('../localai/localPickTool')
    calls = await localPickTool(input, ctx.pathname, describeFields()).catch(() => [])
    source = 'local-ai'
  }

  const steps = calls.flatMap((call) => {
    const tool = getClientTool(call.tool)
    return tool ? [{ call, tool }] : []
  })

  if (!steps.length) {
    if (!localReady) return { text: localAI.enabled ? SORRY : SORRY_LOCAL_OFF }
    if (LOOKS_LIKE_COMMAND.test(input.trim())) return { text: SORRY_COMMAND }
    // No tool fits — treat the message as a question and let the local model answer it.
    const { localAnswer } = await import('../localai/localAnswer')
    const answer = await localAnswer(input, ctx.pathname, options.onPartial).catch(() => '')
    return answer ? { text: answer, source: 'local-ai' } : { text: SORRY }
  }

  const replies: string[] = []
  for (const [index, { call, tool }] of steps.entries()) {
    if (index > 0) await settle()
    try {
      replies.push(await tool.execute(call.args, ctx))
    } catch (error) {
      replies.push(`That didn't work: ${(error as Error).message}`)
      break // later steps usually depend on this one
    }
  }
  return {
    text: replies.join('\n'),
    tool: steps.map((step) => step.tool.name).join(' → '),
    ...(source && { source }),
  }
}
