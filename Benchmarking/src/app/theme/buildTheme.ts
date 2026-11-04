import { createTheme, DEFAULT_THEME, type MantineThemeOverride } from '@mantine/core'
import { APP_THEME } from '@/app/constants'
import { mantineColorName, shadesOf } from './colors'
import type { ThemeOverrides } from './useThemeStore'

/** Fonts every OS ships (or CSS generics) — never fetched from Google Fonts. */
const SYSTEM_FONTS = new Set(
  (
    'inter,arial,helvetica,georgia,verdana,tahoma,times new roman,times,courier new,courier,' +
    'segoe ui,trebuchet ms,system-ui,serif,sans-serif,monospace,cursive,fantasy'
  ).split(','),
)

/** The app theme with the user's overrides applied. */
export const buildTheme = (overrides: ThemeOverrides) => {
  const theme: MantineThemeOverride = { ...APP_THEME }
  const { primaryColor, fontFamily, radius, textScale } = overrides

  if (primaryColor) {
    const named = mantineColorName(primaryColor)
    if (named) theme.primaryColor = named
    else {
      theme.colors = { custom: shadesOf(primaryColor) }
      theme.primaryColor = 'custom'
    }
  }
  if (fontFamily) {
    const family = `"${fontFamily}", ${APP_THEME.fontFamily}`
    theme.fontFamily = family
    theme.headings = { fontFamily: family }
  }
  if (radius) theme.defaultRadius = radius
  if (textScale && textScale !== 1) {
    theme.fontSizes = Object.fromEntries(
      Object.entries(DEFAULT_THEME.fontSizes).map(([size, value]) => [
        size,
        `calc(${value} * ${textScale})`,
      ]),
    )
  }
  return createTheme(theme)
}

/** Fetch a non-system font from Google Fonts so a chosen family actually renders. */
export const loadFont = (fontFamily: string | undefined) => {
  if (!fontFamily || SYSTEM_FONTS.has(fontFamily.toLowerCase())) return
  const id = `font-${fontFamily.replace(/\W+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}
