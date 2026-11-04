import type { ToolCall } from '../types'

/**
 * Start Benchmark wizard commands, one step at a time:
 *   "add node ip 10.0.0.12" · "add model llama" · "select model llama-3.1-8b"
 *   "put 10.0.0.12 as the node ip" · "the model is mistral" · "next"
 * Only the wizard's own fields match here; anything else falls through to the
 * generic page rules.
 */

const FIELD = String.raw`(node\s*ip(?:\s+address)?|ip(?:\s+address)?|node|machine(?:\s+ip)?|server(?:\s+ip)?|model(?:\s+name)?)\b`
const FIELD_WORD = String.raw`(?:\s+(?:field|box|input|dropdown))?`
const VERB = String.raw`(?:please\s+)?(?:add|enter|type|put|use|insert|paste|give|select|choose|pick)`
// Value-first wording keeps "type … in the model field" as a generic page fill
// (it fills whichever Model field is on screen); "add/select … to the model" is the wizard.
const VALUE_VERB = String.raw`(?:please\s+)?(?:add|use|give|select|choose|pick)`

// "add node ip 10.0.0.12" / "select model llama" / "add model" (no value → ask)
const FIELD_FIRST = new RegExp(
  String.raw`^${VERB}\s+(?:the\s+)?(?:value\s+(?:of\s+)?)?${FIELD}${FIELD_WORD}(?:\s*[:=]\s*|\s+(?:to|as|is|with)\s+|\s+)?(.*)$`,
  'i',
)
// "add 10.0.0.12 to the node ip" / "select llama as the model"
const VALUE_FIRST = new RegExp(
  String.raw`^${VALUE_VERB}\s+(.+?)\s+(?:to|in|into|as|for|on)\s+(?:the\s+)?${FIELD}${FIELD_WORD}$`,
  'i',
)
// "the model is llama" / "node ip: 10.0.0.12" / "the model should be mistral"
const STATEMENT = new RegExp(
  String.raw`^(?:the\s+)?${FIELD}${FIELD_WORD}\s*(?:should\s+be|is|=|:)\s*(.+)$`,
  'i',
)
// "next" / "next step" / "move to the next page" / "go on to the next screen" / "continue"
const NEXT =
  /^(?:please\s+)?(?:(?:go|move)\s+(?:on\s+)?(?:to\s+)?(?:the\s+)?)?(?:next|continue|proceed)(?:\s+(?:step|page|screen))?$/i
// "previous step" / "move to the previous page" / "go back a step" / "step back"
const BACK =
  /^(?:please\s+)?(?:(?:(?:go|move)\s+(?:back\s+)?(?:to\s+)?(?:the\s+)?)?(?:previous|prev)(?:\s+(?:step|page|screen))?|(?:go|move|step)\s+back(?:\s+(?:a|one)\s+(?:step|page))?)$/i

const fieldKey = (field: string) => (/^model/i.test(field) ? 'model' : 'nodeIp')

/** Strip quotes and "the value" filler: `the value "10.0.0.12"` → `10.0.0.12`. */
const cleanValue = (raw: string) =>
  raw
    .trim()
    .replace(/^(?:the\s+)?value\s+(?:of\s+)?/i, '')
    .replace(/^["'“‘](.*)["'”’]$/, '$1')
    .trim()

export const parseWizard = (raw: string): ToolCall | null => {
  const text = raw.trim().replace(/[.!?]+$/, '')
  if (NEXT.test(text)) return { tool: 'wizard_next', args: {} }
  // go_back moves the wizard back a step when it's open, else browser-back.
  if (BACK.test(text)) return { tool: 'go_back', args: {} }

  const firstField = text.match(FIELD_FIRST)
  if (firstField) {
    return {
      tool: 'set_benchmark_field',
      args: { field: fieldKey(firstField[1]), value: cleanValue(firstField[2]) },
    }
  }
  const firstValue = text.match(VALUE_FIRST) ?? text.match(STATEMENT)
  if (firstValue) {
    const [value, field] = text.match(VALUE_FIRST)
      ? [firstValue[1], firstValue[2]]
      : [firstValue[2], firstValue[1]]
    return {
      tool: 'set_benchmark_field',
      args: { field: fieldKey(field), value: cleanValue(value) },
    }
  }
  return null
}
