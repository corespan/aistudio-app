// Always import the mantine styles first
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { useEffect, useMemo } from 'react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useMediaQuery } from '@mantine/hooks'
import { ModalsProvider } from '@mantine/modals'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { queryClient } from '@/shared/api/queryClient'
import { AppLayout } from '@/app/layout/AppLayout'
import { RESOLVER } from '@/app/constants'
import { buildTheme, loadFont } from '@/app/theme/buildTheme'
import { useThemeStore } from '@/app/theme/useThemeStore'
import { CHAT_PANEL_WIDTH } from '@/features/coremind/constants'
import { useCoreMindStore } from '@/features/coremind/store/useCoreMindStore'

// react-router's basename matcher requires the URL to start with the basename
// string, so a trailing slash (e.g. `/aistudio/`) fails to match a URL of
// exactly `/aistudio` (no trailing slash). Strip it, keeping `/` as-is.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const App = () => {
  // User customisations (set through CoreMind) layered over the app theme.
  const overrides = useThemeStore((s) => s.overrides)
  const theme = useMemo(() => buildTheme(overrides), [overrides])
  useEffect(() => loadFont(overrides.fontFamily), [overrides.fontFamily])
  // Toasts sit top-right — move them left of the CoreMind side panel while it's open.
  const isCoreMindOpen = useCoreMindStore((s) => s.isOpen)
  const isWide = useMediaQuery('(min-width: 48em)')

  return (
    <MantineProvider theme={theme} cssVariablesResolver={RESOLVER} defaultColorScheme="dark">
      <Notifications
        position="top-right"
        mt={48}
        mr={-4}
        style={{
          right:
            isCoreMindOpen && isWide
              ? `calc(${CHAT_PANEL_WIDTH}px * var(--mantine-scale))`
              : undefined,
          transition: 'right 250ms ease',
        }}
      />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          {/* `BASE_URL` is `/aistudio/` in production (see vite.config.ts) and
              `/` in dev, so client-side routes resolve correctly either way. */}
          <BrowserRouter basename={basename}>
            <AppLayout />
          </BrowserRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}

export default App
