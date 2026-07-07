import { Card, CSSVariablesResolver, Paper, Select } from '@mantine/core'

const RESOLVER: CSSVariablesResolver = (theme) => ({
  variables: {},
  dark: {
    '--core-surface-0': theme.colors.dark[8],
    '--core-surface-1': theme.colors.dark[7],
    '--core-card-shadow': 'none',
    '--core-card-border': theme.colors.dark[4],
  },
  light: {
    '--core-surface-0': theme.white,
    '--core-surface-1': theme.colors.gray[1],
    '--core-card-shadow': theme.shadows.xs,
    '--core-card-border': theme.colors.gray[2],
  },
})

/** Global Mantine size scale — shrinks all rem-based sizes by this factor. */
const APP_SCALE = 0.9

/**
 * Shared app theme. Mirrors apps/composer so typography (font family, scale,
 * input label sizes) and core component defaults stay consistent across apps.
 */
const APP_THEME = {
  defaultRadius: 'sm',
  primaryColor: 'indigo',
  scale: APP_SCALE,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
  components: {
    Select: Select.extend({
      defaultProps: {
        allowDeselect: false,
        comboboxProps: { shadow: 'lg' },
      },
    }),
    Card: Card.extend({
      defaultProps: {
        p: 'sm',
        withBorder: true,
      },
    }),
    Paper: Paper.extend({
      defaultProps: {
        p: 'sm',
        withBorder: true,
      },
    }),
  },
}

export { APP_THEME, RESOLVER, APP_SCALE }
