import type { CoreMindField } from '@/shared/coremind/fieldRegistry'
import type { ToolCall } from '../types'
import { namesOf } from './fields'

const VERB =
  /^(?:please\s+)?(?:add|set|enter|type|put|use|insert|fill(?:\s+in)?|select|choose|pick|change|update|search(?:\s+for)?)\s+(?:the\s+)?/i
const LINK = /^\s*(?:field|box|input|dropdown)?\s*(?:[:=]|\b(?:to|as|is|with|of)\b)?\s*/i
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A regex matching a field name at the start of text, loose about spaces/underscores/dashes. */
const namePattern = (name: string) => {
  const parts = name
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(escape)
  return parts.length ? new RegExp(`^${parts.join('[\\s_-]+')}\\b`, 'i') : null
}

/** The longest field name `text` starts with, and where it ends. */
const leadingField = (text: string, fields: CoreMindField[]) => {
  let best: { name: string; end: number } | null = null
  for (const field of fields) {
    for (const name of namesOf(field)) {
      const pattern = namePattern(name)
      const match = pattern && text.match(pattern)
      if (match && (!best || match[0].length > best.end)) {
        best = { name: field.label, end: match[0].length }
      }
    }
  }
  return best
}

/**
 * Understand "add <field> <value>" for ANY field on screen, using the live
 * field list — e.g. "add concurrency 64", "set max tokens 256", "precision fp16".
 * Runs after the fixed rules, so it only handles what they didn't.
 */
export const parseFieldCommand = (raw: string, fields: CoreMindField[]): ToolCall | null => {
  if (!fields.length) return null
  const text = raw.trim().replace(/[.!]+$/, '')

  // "add concurrency 64" / "set the max tokens to 256" / "select precision fp16"
  const verb = text.match(VERB)
  const rest = verb ? text.slice(verb[0].length) : text
  const field = leadingField(rest, fields)
  if (!field) return null

  const after = rest.slice(field.end)
  // Without a verb, only "<field> is/=/: <value>" counts — "model comparison" is not a command.
  if (!verb && !/^\s*(?:[:=]|\b(?:is|should\s+be)\b)/i.test(after)) return null
  const value = after
    .replace(/^\s*should\s+be\s*/i, '')
    .replace(LINK, '')
    .trim()
    .replace(/^["'“‘](.*)["'”’]$/, '$1')
  return { tool: 'fill_input', args: { target: field.name, value } }
}
