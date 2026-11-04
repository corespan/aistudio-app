import { mantineColorName } from '@/app/theme/colors'
import type { ToolCall } from '../types'
import { fixCommandWords, isColor } from './parseDomCommand'

/**
 * App-wide theme commands — primary colour, font, corner radius, text size.
 * Runs before the per-element style parser, which would otherwise read
 * "make everything rounded" as styling <body>, and before the colour-scheme
 * rule, which would read "change theme to blue" as "toggle theme".
 */

/** Colour words that mean light/dark mode, not a primary colour. */
const SCHEME_WORDS = new Set(['dark', 'light', 'black', 'white', 'night', 'day'])

/** Words saying a change is for the whole app rather than one element. */
const GLOBAL = /\b(?:theme|app|everything|all|global|whole|default|overall|ui|site|everywhere)\b/

/** First colour named in the text — two-word names first ("dark blue" → darkblue). */
const findColor = (text: string) => {
  const words = [...text.matchAll(/#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\)|[a-z]+/g)]
  for (let i = 0; i < words.length; i++) {
    const word = words[i][0]
    const next = words[i + 1]?.[0]
    if (next && isColor(word + next)) return word + next
    if (SCHEME_WORDS.has(word)) continue
    if (isColor(word) || mantineColorName(word)) return word
  }
  return null
}

const RADIUS_WORDS: [RegExp, string][] = [
  [/\b(?:none|no|square|sharp|flat|zero)\b/, '0'],
  [/\b(?:xs|tiny|extra small)\b/, 'xs'],
  [/\b(?:sm|small|slight(?:ly)?|subtle)\b/, 'sm'],
  [/\b(?:md|medium|normal|default)\b/, 'md'],
  [/\b(?:xl|pill|very|extra|fully|max)\b/, 'xl'],
  [/\b(?:lg|large|round(?:ed)?|more)\b/, 'lg'],
]

const parseRadius = (text: string): string | null => {
  const px = text.match(/\b(\d+)\s*(px|rem)?\b/)
  if (px) return `${px[1]}${px[2] ?? 'px'}`
  return RADIUS_WORDS.find(([pattern]) => pattern.test(text))?.[1] ?? null
}

const titleCase = (name: string) =>
  /[A-Z]/.test(name) ? name : name.replace(/\b[a-z]/g, (c) => c.toUpperCase())

export const parseTheme = (raw: string): ToolCall | null => {
  // Typos in command words are repaired; the font rule reads `raw` so a name
  // like "Inter" isn't "fixed" to "enter".
  const text = fixCommandWords(raw)
    .toLowerCase()
    .replace(/[^a-z0-9#%.()\s,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (
    /\b(?:reset|restore|default|original)\b.*\btheme\b|\btheme\b.*\b(?:reset|default)\b/.test(text)
  ) {
    return { tool: 'reset_theme', args: {} }
  }

  // Primary colour: "change theme to teal", "set primary color to #ff6600", "purple accent".
  if (/\b(?:theme|primary|accent|brand)\b/.test(text)) {
    const color = findColor(text.replace(/\b(?:theme|primary|accent|brand)\b/g, ' '))
    if (color) return { tool: 'set_theme', args: { primaryColor: color } }
  }

  // Font family: "change the font to Roboto", "use the Georgia font". Read from
  // the raw message so the name keeps its spelling.
  const font =
    raw.match(
      /^\s*(?:please\s+)?(?:set|change|switch|make|update|use)?\s*(?:the\s+)?(?:app\s+|global\s+|theme\s+|default\s+)?font(?:\s+family)?\s+(?:to|=|as)\s+["']?([^"']+?)["']?\s*$/i,
    ) ?? raw.match(/^\s*(?:please\s+)?use\s+(?:the\s+)?["']?([^"']+?)["']?\s+font\s*$/i)
  if (font) {
    const family = font[1].trim()
    if (/^(?:default|normal|reset|original)$/i.test(family)) {
      return { tool: 'set_theme', args: { fontFamily: 'default' } }
    }
    return { tool: 'set_theme', args: { fontFamily: titleCase(family) } }
  }

  // Corner radius: "set radius to xl", "make everything rounded", "square corners everywhere".
  const radiusWord = /\b(?:radius|corners?|rounded|round|square|sharp)\b/
  if (
    radiusWord.test(text) &&
    (GLOBAL.test(text) || /^(?:set |change )?(?:the )?(?:corner |border )?radius\b/.test(text))
  ) {
    const radius = parseRadius(text.replace(/\b(?:radius|corners?)\b/g, ' '))
    if (radius) return { tool: 'set_theme', args: { radius } }
  }

  // Text size: "make the text bigger", "zoom out", "set text size to 110%".
  if (/^zoom (?:in|out)$/.test(text)) {
    return { tool: 'set_theme', args: { textScale: text.endsWith('in') ? 'up' : 'down' } }
  }
  const sizeWords = /\b(?:text|font|fonts|everything|app)\b/
  const isGlobalSize =
    /^(?:please )?(?:make |increase |decrease |set |change |reset )?(?:the )?(?:all )?(?:the )?(?:app |global |overall )?(?:text|font|fonts|everything|app)(?: size)?\b/.test(
      text,
    ) && sizeWords.test(text)
  if (isGlobalSize && !/\bof\b|\bfor\b|\bin\b/.test(text)) {
    const percent = text.match(/\b(\d+(?:\.\d+)?)\s*%/)
    if (percent) return { tool: 'set_theme', args: { textScale: String(Number(percent[1]) / 100) } }
    if (/\b(?:bigger|larger|increase|grow|up)\b/.test(text)) {
      return { tool: 'set_theme', args: { textScale: 'up' } }
    }
    if (/\b(?:smaller|decrease|shrink|down)\b/.test(text)) {
      return { tool: 'set_theme', args: { textScale: 'down' } }
    }
    if (/\b(?:normal|default|reset)\b/.test(text)) {
      return { tool: 'set_theme', args: { textScale: '1' } }
    }
  }

  return null
}
