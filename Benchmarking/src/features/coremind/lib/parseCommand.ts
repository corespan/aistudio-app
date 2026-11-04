import type { SectionKey } from '@/app/constants'
import type { ToolCall } from '../types'
import { normalize } from './normalize'
import {
  fixCommandWords,
  fixLeadingVerb,
  parseClick,
  parseFill,
  parseStyle,
} from './parseDomCommand'
import { parseTheme } from './parseTheme'
import { parseWizard } from './parseWizard'

/** Canonical section words produced by `normalize`. */
const SECTION_WORDS: [SectionKey, RegExp][] = [
  ['jupyter', /\bjupyter\b/],
  ['blogs', /\bblogs\b/],
  ['about', /\babout\b/],
  ['benchmarks', /\bbenchmarks\b/],
]

/** Filler stripped from a blog topic ("the post about pcie" → "pcie"). */
const TOPIC_FILLER = /\b(the|a|an|me|on|for|regarding|called|titled|named|go|read|to)\b/g

/**
 * Map a free-text chat message to a client tool call. Rule-based on purpose:
 * it runs entirely in the browser with no API key. `normalize` first folds
 * synonyms and typos into canonical words, so the rules below only match
 * those. Returns null when nothing matches, so the caller can reply with help.
 */
export const parseCommand = (input: string): ToolCall | null => {
  const text = normalize(input)
  if (!text) return null

  if (/^(help|\?)/.test(text)) return { tool: 'help', args: {} }

  if (/^(go )?back\b/.test(text)) return { tool: 'go_back', args: {} }

  if (/\breset\b.*\bstyl\w*\b/.test(text)) return { tool: 'reset_styles', args: {} }

  if (
    /^(?:what|which)\s+(?:can\s+i\s+fill|fields|inputs)\b|^(?:list|show)\s+(?:me\s+)?(?:the\s+|all\s+)?(?:form\s+)?fields\b/i.test(
      input.trim(),
    )
  ) {
    return { tool: 'list_fields', args: {} }
  }

  // Start Benchmark wizard, step by step: "add node ip 10.0.0.12", "select model llama", "next".
  const wizard = parseWizard(fixLeadingVerb(input))
  if (wizard) return wizard

  // App-wide theme changes (primary colour, font, radius, text size) run before
  // anything else reads "theme" — `normalize` maps "change" to "toggle", so
  // "change theme to blue" would otherwise just flip light/dark mode.
  const theme = parseTheme(input)
  if (theme) return theme

  // Generic page actions read the raw message so values keep their spelling,
  // with typos in command words repaired first — otherwise "chnage the sidebar
  // color" misses here and `normalize` turns it into "toggle theme" below.
  // Style runs before the theme rules so "set the text color to white" restyles
  // rather than flipping to light mode.
  const pageAction = parseClick(fixLeadingVerb(input)) ?? parseStyle(fixCommandWords(input))
  if (pageAction) return pageAction

  if (/\b(start|launch)\b.*\bbenchmarks\b/.test(text)) return { tool: 'start_benchmark', args: {} }

  const metric = text.match(/\b(throughput|ttft|tpot)\b/)
  if (metric) return { tool: 'set_benchmark_type', args: { type: metric[1] } }

  if (/\breset\b.*\bfilters\b|\bfilters\b.*\breset\b/.test(text)) {
    return { tool: 'reset_filters', args: {} }
  }

  const scheme = text.match(/\b(dark|light)\b/)
  if (scheme && (/\btheme\b/.test(text) || text === scheme[1] || /\bgo\b/.test(text))) {
    return { tool: 'set_color_scheme', args: { scheme: scheme[1] } }
  }
  if (/\btheme\b/.test(text) && /\b(toggle|go)\b/.test(text)) {
    return { tool: 'set_color_scheme', args: { scheme: 'toggle' } }
  }

  const fill = parseFill(fixLeadingVerb(input))
  if (fill) return fill

  // "read the post about pcie topology" → a specific article. Whatever is left
  // after the blog keyword (minus filler) is the topic; "open blogs" has none
  // and falls through to plain navigation.
  const blog = text.match(/\bblogs\b(.*)$/)
  const topic = blog?.[1]
    .replace(/\babout\b/g, '')
    .replace(TOPIC_FILLER, '')
    .trim()
  if (topic) return { tool: 'open_blog_post', args: { query: topic } }
  if (/^read\b/.test(text)) {
    const query = text
      .replace(/\babout\b/g, '')
      .replace(TOPIC_FILLER, '')
      .trim()
    if (query) return { tool: 'open_blog_post', args: { query } }
  }

  const section = SECTION_WORDS.find(([, re]) => re.test(text))
  if (section) return { tool: 'navigate', args: { section: section[0] } }

  return null
}
