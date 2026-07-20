import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

type PageShellProps = {
  children: ReactNode
}

/**
 * Shared page content wrapper. The app-level layout owns the shared scroll area
 * and universal footer so every section inherits the same end-of-page treatment.
 */
export const PageShell = ({ children }: PageShellProps) => (
  <Box h="100%">{children}</Box>
)
