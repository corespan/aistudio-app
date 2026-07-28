import { Card, Paper, ScrollArea, Select, type CSSVariablesResolver } from '@mantine/core'
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
// Height of the visible gap above the footer bar — matches the page's own
// background so it reads as breathing room, not part of the footer itself.
const TOP_GAP = 12

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

export {
  APP_THEME,
  RESOLVER,
  APP_SCALE,
  HEADER_HEIGHT,
  HEADER_OFFSET,
  REPO_URL,
  TOP_GAP,
  NAV_GROUPS,
  NAVBAR_WIDTH,
  NAVBAR_COLLAPSED_WIDTH,
}
export type { SectionKey, Section, NavGroup }
