import type { MantineColorsTuple } from '@mantine/core'

/** Mantine's built-in palettes — usable as `primaryColor` as-is. */
export const MANTINE_COLORS = [
  'dark',
  'gray',
  'red',
  'pink',
  'grape',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'lime',
  'yellow',
  'orange',
]

/** Everyday names for the closest Mantine palette. */
const ALIASES: Record<string, string> = {
  purple: 'grape',
  magenta: 'grape',
  grey: 'gray',
  sky: 'cyan',
  aqua: 'cyan',
  gold: 'yellow',
  amber: 'orange',
  mint: 'teal',
}

/** The Mantine palette a colour word names ("purple" → grape), or null. */
export const mantineColorName = (color: string) => {
  const lower = color.toLowerCase()
  if (MANTINE_COLORS.includes(lower)) return lower
  return ALIASES[lower] ?? null
}

/** Any CSS colour → `#rrggbb`, resolved by the browser. Null if it isn't a colour. */
export const toHex = (color: string): string | null => {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${[...color.slice(1)].map((c) => c + c).join('')}`.toLowerCase()
  }
  if (typeof document === 'undefined') return null
  const ctx = document.createElement('canvas').getContext?.('2d')
  if (!ctx) return null
  // An invalid colour leaves fillStyle unchanged, so test against two sentinels.
  ctx.fillStyle = '#000001'
  ctx.fillStyle = color
  const first = ctx.fillStyle
  ctx.fillStyle = '#000002'
  ctx.fillStyle = color
  return first === ctx.fillStyle && /^#[0-9a-f]{6}$/i.test(first) ? first : null
}

const mix = (hex: string, target: number, amount: number) =>
  `#${[1, 3, 5]
    .map((i) => {
      const channel = parseInt(hex.slice(i, i + 2), 16)
      return Math.round(channel + (target - channel) * amount)
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`

/**
 * A 10-shade Mantine palette around one colour: shade 6 is the colour itself
 * (Mantine's light-mode primary shade), lighter tints below, darker above.
 */
export const shadesOf = (hex: string): MantineColorsTuple =>
  [0.9, 0.78, 0.64, 0.5, 0.34, 0.18, 0, -0.12, -0.24, -0.36].map((amount) =>
    amount >= 0 ? mix(hex, 255, amount) : mix(hex, 0, -amount),
  ) as unknown as MantineColorsTuple
