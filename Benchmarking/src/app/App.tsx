// Always import the mantine styles first
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { queryClient } from '@/shared/api/queryClient'
import { AppLayout } from '@/app/layout/AppLayout'
import { APP_THEME, RESOLVER } from '@/app/constants'

const theme = createTheme(APP_THEME)

const App = () => {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={RESOLVER} defaultColorScheme="dark">
      <Notifications position="top-right" mt={48} mr={-4} />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          {/* `BASE_URL` is `/aistudio/` in production (see vite.config.ts) and
              `/` in dev, so client-side routes resolve correctly either way. */}
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppLayout />
          </BrowserRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}

export default App
