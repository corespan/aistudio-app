import { useMantineColorScheme } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router'
import { useThemeStore } from '@/app/theme/useThemeStore'
import { useBenchmarkFiltersStore } from '@/features/benchmarks/store/useBenchmarkFiltersStore'
import { useStartBenchmarkModalStore } from '@/features/benchmarks/store/useStartBenchmarkModalStore'
import type { ToolContext } from '../types'

const WIZARD_OPEN_TIMEOUT_MS = 3000

/** Wires the app's router, theme and stores into the context client tools act on. */
export const useToolContext = (): ToolContext => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { setColorScheme, toggleColorScheme } = useMantineColorScheme()
  const openStartBenchmark = useStartBenchmarkModalStore((s) => s.open)
  const setBenchmarkType = useBenchmarkFiltersStore((s) => s.setBenchmarkType)
  const setFilters = useBenchmarkFiltersStore((s) => s.setFilters)
  const theme = useThemeStore((s) => s.overrides)
  const setTheme = useThemeStore((s) => s.setTheme)
  const resetTheme = useThemeStore((s) => s.resetTheme)

  const startBenchmarkWizard = () => useStartBenchmarkModalStore.getState().wizard

  return {
    pathname,
    // Mirrors AppLayout's `pathForKey`: benchmarks is the app root.
    navigateTo: (section) => navigate(section === 'benchmarks' ? '/' : `/${section}`),
    navigatePath: (path) => navigate(path),
    goBack: () => navigate(-1),
    openStartBenchmark,
    setBenchmarkType,
    resetFilters: () => setFilters({}),
    setColorScheme: (scheme) =>
      scheme === 'toggle' ? toggleColorScheme() : setColorScheme(scheme),
    theme,
    setTheme,
    resetTheme,
    startBenchmarkWizard,
    openStartBenchmarkWizard: async () => {
      if (pathname !== '/') navigate('/')
      openStartBenchmark()
      // The wizard registers itself once it renders open — wait for that.
      const deadline = Date.now() + WIZARD_OPEN_TIMEOUT_MS
      while (Date.now() < deadline) {
        const wizard = startBenchmarkWizard()
        if (wizard?.isOpen) return wizard
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      return null
    },
  }
}
