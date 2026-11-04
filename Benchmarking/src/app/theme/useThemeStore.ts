import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * User customisations layered over `APP_THEME`. Every field is optional —
 * unset means "use the app default".
 */
export type ThemeOverrides = {
  /** A Mantine palette name ("teal") or a `#rrggbb` colour. */
  primaryColor?: string
  fontFamily?: string
  /** A Mantine size key (xs–xl) or a CSS length ("0", "12px"). */
  radius?: string
  /** Multiplier on the text size scale, e.g. 1.1. */
  textScale?: number
}

type ThemeStore = {
  overrides: ThemeOverrides
  setTheme: (patch: ThemeOverrides) => void
  resetTheme: () => void
}

/** Theme customisations, saved to localStorage so they survive reloads. */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      overrides: {},
      setTheme: (patch) => set((s) => ({ overrides: { ...s.overrides, ...patch } })),
      resetTheme: () => set({ overrides: {} }),
    }),
    { name: 'aistudio-theme' },
  ),
)
