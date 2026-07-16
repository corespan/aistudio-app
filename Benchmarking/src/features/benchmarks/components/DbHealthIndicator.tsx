import type { CSSProperties } from 'react'
import { useHealth } from '../data/queries/useHealth'
import classes from './DbHealthIndicator.module.css'

type Tone = 'ok' | 'bad' | 'idle'

const TONE_COLOR: Record<Tone, string> = {
  ok: 'var(--mantine-color-teal-6)',
  bad: 'var(--mantine-color-red-6)',
  idle: 'var(--mantine-color-gray-5)',
}

/**
 * Eye-catching status pill in the app header showing backend health, polled via
 * `useHealth`. A ripple-pulsing dot + tinted pill tint by state: teal when the
 * DB reports "ok", red when it doesn't or the probe fails, gray while checking.
 */
export const DbHealthIndicator = () => {
  const { data, isLoading, isError } = useHealth()

  const dbOk = data?.database?.toLowerCase() === 'ok'
  const tone: Tone = isLoading ? 'idle' : isError || !dbOk ? 'bad' : 'ok'

  const status = isLoading ? 'checking' : isError ? 'unreachable' : (data?.status ?? 'unknown')

  return (
    <span
      className={classes.pill}
      style={{ '--status-color': TONE_COLOR[tone] } as CSSProperties}
      title={
        data ? `status: ${data.status} · database: ${data.database}` : 'Checking database health…'
      }
    >
      <span className={classes.dot} />
      {status}
    </span>
  )
}
