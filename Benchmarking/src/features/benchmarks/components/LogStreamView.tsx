import { useMemo } from 'react'
import { Badge, Code, Group, ScrollArea, Stack, Text } from '@mantine/core'
import type { LogStreamViewProps } from '../types'
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
    return cleaned.length ? cleaned.join('\n') : 'Waiting for logs…'
  }, [lines])

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
