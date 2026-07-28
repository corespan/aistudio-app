import type { CategoryStyle } from './types'

/** CSS `linear-gradient(...)` using Mantine color CSS variables, for a category's cover panel. */
export const gradientBackground = ({ gradient }: CategoryStyle) => {
  const toVar = (token: string) => `var(--mantine-color-${token.replace('.', '-')})`
  return `linear-gradient(${gradient.deg ?? 135}deg, ${toVar(gradient.from)} 0%, ${toVar(gradient.to)} 100%)`
}

/** Locale-formatted post date. Falls back to the raw string if unparseable. */
export const formatDate = (raw: string, withYear = true) => {
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return raw
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}
