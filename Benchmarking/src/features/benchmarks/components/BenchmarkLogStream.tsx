import { Badge, Code, Group, ScrollArea, Stack, Text } from '@mantine/core'
import { useLogStream, type LogStreamStatus } from '../hooks/useBenchmarkLogStream'

type Props = {
  /** Task id shown in the log header. */
  taskId: string
  /**
   * Full SSE path to subscribe to. Defaults to the benchmark stream path
   * `/api/v1/benchmarks/<taskId>/logs/stream` when omitted.
   */
  streamPath?: string
  /** Called for each streamed log line (e.g. to detect a ready URL). */
  onLine?: (line: string) => void
}

const STATUS_COLOR: Record<LogStreamStatus, string> = {
  idle: 'gray',
  open: 'teal',
  error: 'red',
  closed: 'gray',
}

const STATUS_LABEL: Record<LogStreamStatus, string> = {
  idle: 'Connecting…',
  open: 'Streaming',
  error: 'Disconnected',
  closed: 'Ended',
}

/** Live log output streamed over SSE — reusable for any task type. */
export const BenchmarkLogStream = ({ taskId, streamPath, onLine }: Props) => {
  const path = streamPath ?? `/api/v1/benchmarks/${taskId}/logs/stream`
  const { lines, status } = useLogStream(path, onLine)

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

      <ScrollArea h={320} type="auto">
        <Code block>{lines.length ? lines.join('\n') : 'Waiting for logs…'}</Code>
      </ScrollArea>
    </Stack>
  )
}
