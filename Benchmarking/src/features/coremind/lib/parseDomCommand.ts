import type { ToolCall } from '../types'
import { editDistance, isVocabularyWord, maxTypos } from './normalize'

/**
 * Parsers for the generic page tools — click, style, fill. They read the raw
 * message (not `normalize`d) so typed values keep their exact spelling/case.
 */

// ── typo repair ──────────────────────────────────────────────────────────

/** Words these parsers key on. Typos of them ("chnage", "sidbar", "gren") are repaired. */
const COMMAND_WORDS = (
  'make change turn style paint color colour background border sidebar navbar header footer ' +
  'hover hovered active selected clicked click press type enter input insert select choose pick ' +
  'fill field fields button buttons link links item items list bold italic underline hidden bigger smaller rounded font size ' +
  'padding margin width height opacity shadow when whenever should state ' +
  // Fill verbs — real words, so typo repair must never "fix" them ("write" → "white").
  'add put write paste use set update ' +
  'green yellow orange purple white black brown silver violet indigo maroon'
).split(' ')

const fixWord = (word: string) => {
  const lower = word.toLowerCase()
  const budget = maxTypos(lower)
  // Real words that happen to sit one letter from a command word stay put:
  // "take" isn't a typo of "make", nor "pink"/"gold" of "link"/"bold".
  if (budget === 0 || COMMAND_WORDS.includes(lower)) return word
  if (isVocabularyWord(lower) || isColor(lower)) return word
  let best: { fix: string; distance: number } | undefined
  for (const candidate of COMMAND_WORDS) {
    if (Math.abs(candidate.length - lower.length) > budget) continue
    const distance = editDistance(lower, candidate)
    if (distance <= budget && (!best || distance < best.distance))
      best = { fix: candidate, distance }
  }
  return best?.fix ?? word
}

/** Repair typos in every word outside quotes — for style commands, whose values are colours/sizes. */
export const fixCommandWords = (raw: string) =>
  raw
    .split(/("[^"]*"|'[^']*')/)
    .map((part, i) => (i % 2 ? part : part.replace(/[A-Za-z]+/g, fixWord)))
    .join('')

/** Repair only the leading verb — for fill/click, whose remaining words are user values. */
export const fixLeadingVerb = (raw: string) =>
  raw.replace(
    /^(\s*(?:please\s+)?)([A-Za-z]+)/i,
    (_, lead: string, verb: string) => lead + fixWord(verb),
  )

// ── click ────────────────────────────────────────────────────────────────

export const parseClick = (raw: string): ToolCall | null => {
  const match = raw.trim().match(/^(?:please\s+)?(?:click|press|tap|hit|push)\s+(?:on\s+)?(.+)$/i)
  return match ? { tool: 'click_element', args: { target: match[1].trim() } } : null
}

// ── style ────────────────────────────────────────────────────────────────

/** Used when `CSS.supports` is unavailable (tests / very old browsers). */
const FALLBACK_COLORS = new Set(
  (
    'red blue green yellow orange purple pink black white gray grey teal cyan indigo violet ' +
    'lime brown gold silver navy maroon olive magenta coral salmon crimson tomato orchid ' +
    'turquoise khaki beige ivory lavender transparent lightblue darkblue lightgreen darkgreen ' +
    'lightgray lightgrey darkgray darkgrey darkred lightpink hotpink skyblue royalblue'
  ).split(' '),
)
const NOT_COLORS = new Set(['inherit', 'initial', 'unset', 'revert', 'currentcolor', 'none'])

export const isColor = (word: string) => {
  if (/^#[0-9a-f]{3,8}$/i.test(word) || /^(rgb|hsl)a?\(.+\)$/i.test(word)) return true
  if (!/^[a-z]+$/.test(word) || NOT_COLORS.has(word)) return false
  if (FALLBACK_COLORS.has(word)) return true
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    ? CSS.supports('color', word)
    : false
}

/** Words naming a CSS property; a value takes the nearest one before it. */
const PROPERTY_WORDS: [RegExp, string][] = [
  [/\b(?:background|bg|fill)(?:\s+colou?r)?\b/g, 'background-color'],
  [/\bborder\s+radius\b|\bradius\b|\brounded(?:\s+corners)?\b|\bcorners?\b/g, 'border-radius'],
  [/\bborder(?:\s+colou?r)?\b/g, 'border'],
  [/\b(?:text|font)\s+size\b|\bsize\b/g, 'font-size'],
  [/\b(?:text|font)\s+colou?r\b|\btext\b/g, 'color'],
  [/\bfont\s+weight\b|\bweight\b/g, 'font-weight'],
  [/\bletter\s+spacing\b/g, 'letter-spacing'],
  [/\bpadding\b/g, 'padding'],
  [/\bmargin\b/g, 'margin'],
  [/\bwidth\b/g, 'width'],
  [/\bheight\b/g, 'height'],
  [/\bopacity\b/g, 'opacity'],
]

/** Value-less style words. */
const ADJECTIVES: [RegExp, Record<string, string>][] = [
  [/\bbold(?:er)?\b/g, { 'font-weight': '700' }],
  [/\bitalics?\b/g, { 'font-style': 'italic' }],
  [/\bunderlined?\b/g, { 'text-decoration': 'underline' }],
  [/\b(?:uppercase|all caps|capitals?)\b/g, { 'text-transform': 'uppercase' }],
  [/\blowercase\b/g, { 'text-transform': 'lowercase' }],
  [/\b(?:hidden|hide|invisible|disappear)\b/g, { display: 'none' }],
  [/\b(?:bigger|larger|grow|enlarge|zoom(?: in)?|scale up)\b/g, { transform: 'scale(1.08)' }],
  [/\b(?:smaller|shrink|scale down)\b/g, { transform: 'scale(0.92)' }],
  [/\b(?:shadow|glow|lift(?:ed)?|elevated?)\b/g, { 'box-shadow': '0 6px 20px rgba(0,0,0,0.35)' }],
  [/\b(?:faded|translucent|see through|dimmed)\b/g, { opacity: '0.5' }],
  [/\b(?:rounded|round|pill)\b/g, { 'border-radius': '16px' }],
  [/\b(?:square|sharp)\b/g, { 'border-radius': '0' }],
  [/\b(?:pointer|clickable)\b/g, { cursor: 'pointer' }],
  [/\b(?:centered|centred|center|centre)\b/g, { 'text-align': 'center' }],
]

const HOVER = /\b(?:hover(?:ed|ing|s)?|mouse\s*over|mouseover)\b/
/** "active", "selected", "when clicked" — the current/pressed item. */
const ACTIVE =
  /\b(?:active|selected|current|clicked|click(?:ing|s)?|pressed|press(?:ing)?|chosen)\b/
const STATE_WORDS = new RegExp(`${ACTIVE.source}|\\b(?:states?|or)\\b`, 'g')
const STYLE_START =
  /^(?:please\s+)?(?:make|turn|change|set|style|colou?r|paint|give|apply|add|when|whenever|on|while|if|hide|bold|underline|italicize|round|enlarge|shrink)\b/
const FILLER =
  /\b(?:please|can|could|you|make|turn|change|set|style|paint|colou?r(?:ed)?|give|apply|add|put|when|whenever|while|if|on|upon|hover(?:ed|ing|s)?|mouse\s*over|mouse|over|i|me|my|it|its|the|a|an|to|into|as|of|be|become|should|is|are|and|with|so|that|look|looks|appear|have|has|then|also|font)\b/g

/** CSS for a "bare" colour ("make the button red") — the tool picks color vs background per element. */
export const BARE_COLOR = '--coremind-color'

const PX_PROPERTIES = new Set([
  'font-size',
  'padding',
  'margin',
  'width',
  'height',
  'border-radius',
  'letter-spacing',
])

type Span = { index: number; end: number; text: string }

const valueFor = (property: string, number: string, unit: string | undefined) => {
  if (property === 'opacity') return String(Number(number) > 1 ? Number(number) / 100 : number)
  if (property === 'font-weight') return number
  if (property === 'border') return `${number}${unit ?? 'px'} solid currentColor`
  if (property === 'color' || property === 'background-color') return null
  return `${number}${unit ?? (PX_PROPERTIES.has(property) ? 'px' : '')}`
}

export const parseStyle = (raw: string): ToolCall | null => {
  const text = raw
    .toLowerCase()
    .replace(/[^a-z0-9#%.()\s,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!STYLE_START.test(text) && !HOVER.test(text) && !/\bshould (?:be|look)\b/.test(text)) {
    return null
  }

  const keywords: (Span & { property: string })[] = []
  for (const [pattern, property] of PROPERTY_WORDS) {
    for (const m of text.matchAll(pattern)) {
      if (keywords.some((k) => m.index! >= k.index && m.index! < k.end)) continue
      keywords.push({ index: m.index!, end: m.index! + m[0].length, text: m[0], property })
    }
  }
  const propertyAt = (index: number) =>
    keywords.filter((k) => k.end <= index).sort((a, b) => b.end - a.end)[0]?.property

  const decls: Record<string, string> = {}
  const consumed: Span[] = []

  // Colours — try two-word names first ("dark blue" → darkblue).
  const words = [...text.matchAll(/#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\)|[a-z]+/g)]
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const next = words[i + 1]
    const pair = next && next.index === w.index! + w[0].length + 1 ? w[0] + next[0] : null
    const color = pair && isColor(pair) ? pair : isColor(w[0]) ? w[0] : null
    if (!color) continue
    const end = color === pair ? next!.index! + next![0].length : w.index! + w[0].length
    consumed.push({ index: w.index!, end, text: text.slice(w.index!, end) })
    const property = propertyAt(w.index!)
    if (property === 'border') decls.border = `2px solid ${color}`
    else if (property === 'background-color' || property === 'color') decls[property] = color
    else decls[BARE_COLOR] = color
    if (color === pair) i++
  }

  // Numbers — need a property word before them, or an explicit unit (→ font size).
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?)\s*(px|rem|em|%|pt|vh|vw)?\b/g)) {
    const property = propertyAt(m.index!) ?? (m[2] ? 'font-size' : undefined)
    const value = property && valueFor(property, m[1], m[2])
    if (!property || !value) continue
    decls[property] = value
    consumed.push({ index: m.index!, end: m.index! + m[0].length, text: m[0] })
  }

  for (const [pattern, css] of ADJECTIVES) {
    if (!pattern.test(text)) continue
    for (const [property, value] of Object.entries(css)) decls[property] ??= value
    pattern.lastIndex = 0
  }

  if (Object.keys(decls).length === 0) return null

  // Whatever isn't a style word, value or filler is the element description.
  let target = text
  for (const span of [...consumed].sort((a, b) => b.index - a.index)) {
    target = target.slice(0, span.index) + ' ' + target.slice(span.end)
  }
  for (const [pattern] of [...PROPERTY_WORDS, ...ADJECTIVES]) target = target.replace(pattern, ' ')
  target = target.replace(STATE_WORDS, ' ').replace(FILLER, ' ').replace(/\s+/g, ' ').trim()

  const states = [HOVER.test(text) && 'hover', ACTIVE.test(text) && 'active'].filter(Boolean)
  // Nothing left: "change the active state to green" means the nav items (the
  // only thing with an active state); "set the text color to white" the page.
  target ||= states.includes('active') ? 'sidebar items' : 'body'

  const css = Object.entries(decls)
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ')
  return {
    tool: 'set_style',
    args: { target, css, state: states.join(',') || 'normal' },
  }
}

// ── fill ─────────────────────────────────────────────────────────────────

const unquote = (value: string) => value.trim().replace(/^["'“‘](.*)["'”’]$/, '$1')

/** "the value 64" → "64": drop the filler people put before the actual value. */
const fillValue = (raw: string) => unquote(raw).replace(/^(?:the\s+)?value\s+(?:of\s+)?/i, '')

export const parseFill = (raw: string): ToolCall | null => {
  const text = raw.trim().replace(/[.!]+$/, '')
  // "type llama 3 in the model field" / "add 64 to concurrency" / "use llama as the model"
  // — greedy value, so target follows the last connector.
  const typed = text.match(
    /^(?:please\s+)?(?:type|enter|input|put|write|fill\s+in|insert|paste|add|use)\s+(.+)\s+(?:in|into|inside|on|for|to|as)\s+(?:the\s+)?(.+)$/i,
  )
  if (typed) {
    return { tool: 'fill_input', args: { target: typed[2], value: fillValue(typed[1]) } }
  }

  // "the model should be llama 3"
  const should = text.match(/^(?:the\s+)?(.+?)\s+should\s+be\s+(.+)$/i)
  if (should)
    return { tool: 'fill_input', args: { target: should[1], value: fillValue(should[2]) } }

  // "select H100 from the gpu type dropdown"
  const picked = text.match(
    /^(?:please\s+)?(?:select|choose|pick)\s+(.+)\s+(?:in|from|for|on)\s+(?:the\s+)?(.+)$/i,
  )
  if (picked) return { tool: 'fill_input', args: { target: picked[2], value: unquote(picked[1]) } }

  // "set the model field to llama 3" / "fill model with llama"
  const set = text.match(
    /^(?:please\s+)?(?:set|change|update|fill|make|select|choose|pick)\s+(?:the\s+)?(.+?)\s+(?:to|=|as|with)\s+(.+)$/i,
  )
  if (set) return { tool: 'fill_input', args: { target: set[1], value: unquote(set[2]) } }

  // "clear the search field"
  const cleared = text.match(/^(?:clear|empty)\s+(?:the\s+)?(.+\s(?:field|input|box))$/i)
  if (cleared) return { tool: 'fill_input', args: { target: cleared[1], value: '' } }

  return null
}
