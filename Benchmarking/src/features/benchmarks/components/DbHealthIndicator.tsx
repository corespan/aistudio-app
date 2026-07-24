import { Badge, Box, Indicator } from '@mantine/core'
import { useHealth } from '../data/queries/useHealth'
import type { HealthTone } from '../types'
import { HEALTH_TONE_COLOR } from '../constants'

/**
 * Eye-catching status pill in the app header showing backend health, polled via
 * `useHealth`. A ripple-pulsing dot + tinted pill by state: teal when the
 * DB reports "ok", red when it doesn't or the probe fails, gray while checking.
 * Styled entirely with Mantine components/props — no CSS module.
 */
export const DbHealthIndicator = () => {
  const { data, isLoading, isError } = useHealth()

  const dbOk = data?.database?.toLowerCase() === 'ok'
  const tone: HealthTone = isLoading ? 'idle' : isError || !dbOk ? 'bad' : 'ok'
  const color = HEALTH_TONE_COLOR[tone]

  const status = isLoading ? 'checking' : isError ? 'unreachable' : (data?.status ?? 'unknown')

  return (
    <Badge
      variant="light"
      color={color}
      radius="xl"
      size="lg"
      tt="capitalize"
      fw={600}
      title={
        data ? `status: ${data.status} · database: ${data.database}` : 'Checking database health…'
      }
      leftSection={
        <Indicator inline processing color={color} size={8} position="middle-center" offset={0}>
          <Box w={8} h={8} />
        </Indicator>
      }
    >
      {status}
    </Badge>
  )
}
