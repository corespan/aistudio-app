import {
  Badge,
  Button,
  Card,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  type CSSVariablesResolver,
} from '@mantine/core'
import type { ComponentType } from 'react'
import {
  IconArticle,
  IconBrandPython,
  IconChartBar,
  IconInfoCircle,
  type IconProps,
} from '@tabler/icons-react'

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

/** App header height in Mantine size units (px before `APP_SCALE` is applied). */
const HEADER_HEIGHT = 52

/**
 * Rendered header height in raw px. Mantine size props (e.g. the header `h`) are
 * scaled by `APP_SCALE`, so drawers must offset their top by this scaled value to
 * open exactly below the header — mirrors composer's `HEADER_OFFSET`.
 */
const HEADER_OFFSET = HEADER_HEIGHT * APP_SCALE

/**
 * Shared app theme. Mirrors apps/composer so typography (font family, scale,
 * input label sizes) and core component defaults stay consistent across apps.
 */
const APP_THEME = {
  defaultRadius: 'sm',
  primaryColor: 'indigo',
  scale: APP_SCALE,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
  // Mantine's default line-height (1.55) leaves extra space below the
  // glyph baseline, which reads as text sitting near the top of any
  // vertically-centered container (buttons, nav items, inputs, etc.).
  // `normal` uses the font's own metrics so it centers correctly.
  lineHeight: 'normal',
  components: {
    Select: Select.extend({
      defaultProps: {
        allowDeselect: false,
        comboboxProps: { shadow: 'lg' },
      },
    }),
    // Badge.module.css hardcodes its own `line-height` (derived from the
    // badge height), which ignores the theme-level line-height above —
    // override it explicitly so badge text centers the same way.
    Badge: Badge.extend({
      styles: {
        root: { lineHeight: 'normal' },
      },
    }),
    // Button pins `line-height: 1` on its root and centers the label with
    // `text-box-trim`, which only lands correctly on browsers that support it.
    // Everywhere else the label inherits that `1` and, with Inter's metrics,
    // sits high in the control — so set the line-height explicitly on both.
    Button: Button.extend({
      styles: {
        root: { lineHeight: 'normal' },
        label: { lineHeight: 'normal' },
      },
    }),
    // SegmentedControl's label is a plain `display: block` with symmetric
    // padding and no line-height of its own, so it inherits `normal` — and
    // Inter's asymmetric ascent/descent then seats the text off-centre against
    // any icon sitting beside it. Centre the label explicitly instead of
    // leaving it to the line box.
    SegmentedControl: SegmentedControl.extend({
      styles: {
        label: {
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
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
    // Scrollbars appear only while actively scrolling, then fade out.
    ScrollArea: ScrollArea.extend({
      defaultProps: {
        type: 'scroll',
      },
    }),
  },
}

// AppFooter
const REPO_URL = 'https://github.com/corespan/aistudio-app'

// AppLayout
type SectionKey = 'benchmarks' | 'jupyter' | 'blogs' | 'about'

type Section = {
  key: SectionKey
  label: string
  icon: ComponentType<IconProps>
}

type NavGroup = {
  key: string
  label: string
  children: Section[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'menu',
    label: 'Menu',
    children: [
      { key: 'benchmarks', label: 'Benchmarks', icon: IconChartBar },
      { key: 'jupyter', label: 'Launch Jupyter', icon: IconBrandPython },
      { key: 'blogs', label: 'Blogs', icon: IconArticle },
      { key: 'about', label: 'About Us', icon: IconInfoCircle },
    ],
  },
]

const NAVBAR_WIDTH = 248
const NAVBAR_COLLAPSED_WIDTH = 48
const JUPYTER_PANEL_WIDTH = 240

export {
  APP_THEME,
  RESOLVER,
  APP_SCALE,
  HEADER_HEIGHT,
  HEADER_OFFSET,
  REPO_URL,
  NAV_GROUPS,
  NAVBAR_WIDTH,
  NAVBAR_COLLAPSED_WIDTH,
  JUPYTER_PANEL_WIDTH,
}
export type { SectionKey, Section, NavGroup }
