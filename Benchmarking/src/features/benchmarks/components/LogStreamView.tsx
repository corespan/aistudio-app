import { useMemo } from 'react'
import { Badge, Code, Group, ScrollArea, Stack, Text } from '@mantine/core'
import type { LogStreamStatus, LogStreamViewProps } from '../types'
import { LOG_STREAM_STATUS_COLOR, LOG_STREAM_STATUS_LABEL } from '../constants'

// Tidy the raw stream for display: trim surrounding whitespace, drop blank lines,
// and collapse consecutive duplicates (progress spam) so the log reads meaningfully.
const cleanLines = (lines: string[]): string[] => {
  const out: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (out[out.length - 1] === line) continue
    out.push(line)
  }
  return out
}

// What to show while there are zero lines, based on *why* there are zero lines —
// "Waiting for logs…" is only true while a connection is actually open or being
// established. A stream that already ended without ever producing a line (a
// finished/failed run, or a stream that could never connect) is a different,
// terminal state and saying "waiting" for it forever is misleading.
const emptyStateMessage = (status: LogStreamStatus): string => {
  switch (status) {
    case 'idle':
    case 'open':
      return 'Waiting for logs…'
    case 'reconnecting':
      return 'Connection dropped — reconnecting…'
    case 'error':
      return 'Unable to reach the log stream. The run may no longer be tracked by the server.'
    case 'failed':
      return 'This run failed before any logs were recorded.'
    case 'closed':
      return 'No logs were recorded for this run.'
  }
}

/**
 * Presentational log output panel. Source-agnostic: renders whatever `lines` and
 * `status` it's given, whether they come from the one-shot `useLogStream` hook or
 * the shared run-streams store. Owns no stream itself.
 */
export const LogStreamView = ({ taskId, lines, status }: LogStreamViewProps) => {
  // Memoized so we don't re-scan the whole buffer on every render (each streamed
  // line triggers one) — keeps the panel snappy while logs pour in.
  const text = useMemo(() => {
    const cleaned = cleanLines(lines)
    return cleaned.length ? cleaned.join('\n') : emptyStateMessage(status)
  }, [lines, status])

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text fw={600} size="sm">
          Logs — {taskId}
        </Text>
        <Badge variant="light" color={LOG_STREAM_STATUS_COLOR[status]} radius="sm">
          {LOG_STREAM_STATUS_LABEL[status]}
        </Badge>
      </Group>

      <ScrollArea h={520} scrollbars="y">
        {/* Wrap long lines so the stream only ever scrolls vertically. */}
        <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text}
        </Code>
      </ScrollArea>
    </Stack>
  )
}
