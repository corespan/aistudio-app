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

/**
 * Presentational log output panel. Source-agnostic: renders whatever `lines` and
 * `status` it's given, whether they come from the one-shot `useLogStream` hook or
 * the shared run-streams store. Owns no stream itself.
 */
export const LogStreamView = ({ taskId, lines, status }: Props) => (
  <Stack gap="sm">
    <Group justify="space-between">
      <Text fw={600} size="sm">
        Logs — {taskId}
      </Text>
      <Badge variant="light" color={STATUS_COLOR[status]} radius="sm">
        {STATUS_LABEL[status]}
      </Badge>
    </Group>

    <ScrollArea h={320} type="auto">
      <Code block>{lines.length ? lines.join('\n') : 'Waiting for logs…'}</Code>
    </ScrollArea>
  </Stack>
)
