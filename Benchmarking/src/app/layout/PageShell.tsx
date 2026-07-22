import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

type PageShellProps = {
  children: ReactNode
}

export const PageShell = ({ children }: PageShellProps) => (
  <Box h="100%">{children}</Box>
)
