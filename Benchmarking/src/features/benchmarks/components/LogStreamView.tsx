import { useMemo } from 'react'
import { Badge, Code, Group, ScrollArea, Stack, Text } from '@mantine/core'
import type { LogStreamStatus } from '../hooks/useBenchmarkLogStream'

type Props = {
  /** Task id shown in the log header. */
  taskId: string
  lines: string[]
  status: LogStreamStatus
}

const STATUS_COLOR: Record<LogStreamStatus, string> = {
  idle: 'gray',
  open: 'teal',
  reconnecting: 'yellow',
  error: 'orange',
  closed: 'green',
  failed: 'red',
}

const STATUS_LABEL: Record<LogStreamStatus, string> = {
  idle: 'Connecting…',
  open: 'Streaming',
  reconnecting: 'Reconnecting…',
  error: 'Disconnected',
  closed: 'Completed',
  failed: 'Failed',
}

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

/**
 * Presentational log output panel. Source-agnostic: renders whatever `lines` and
 * `status` it's given, whether they come from the one-shot `useLogStream` hook or
 * the shared run-streams store. Owns no stream itself.
 */
export const LogStreamView = ({ taskId, lines, status }: Props) => {
  // Memoized so we don't re-scan the whole buffer on every render (each streamed
  // line triggers one) — keeps the panel snappy while logs pour in.
  const text = useMemo(() => {
    const cleaned = cleanLines(lines)
    return cleaned.length ? cleaned.join('\n') : 'Waiting for logs…'
  }, [lines])

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Text fw={600} size="sm">
          Logs — {taskId}
        </Text>
        <Badge variant="light" color={STATUS_COLOR[status]} radius="sm">
          {STATUS_LABEL[status]}
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
