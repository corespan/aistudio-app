import { Badge, Drawer, Group, Paper, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core'
import type { LogStreamStatus } from '../hooks/useBenchmarkLogStream'
import { useRunStreamsStore, type RunStream } from '../store/useRunStreamsStore'
import { LogStreamView } from './LogStreamView'

const STATUS_COLOR: Record<LogStreamStatus, string> = {
  idle: 'gray',
  open: 'teal',
  reconnecting: 'yellow',
  error: 'red',
  closed: 'gray',
}

// Most-recent run first, so the just-started run lands at the top of the switcher.
const byStartedDesc = (a: RunStream, b: RunStream) => b.startedAt.localeCompare(a.startedAt)

type RunSwitcherItemProps = {
  run: RunStream
  active: boolean
  onSelect: (taskId: string) => void
}

const RunSwitcherItem = ({ run, active, onSelect }: RunSwitcherItemProps) => (
  <UnstyledButton
    onClick={() => onSelect(run.taskId)}
    p="sm"
    style={{
      borderRadius: 'var(--mantine-radius-md)',
      border: '1px solid var(--mantine-color-default-border)',
      background: active ? 'var(--mantine-color-default-hover)' : undefined,
    }}
  >
    <Group justify="space-between" wrap="nowrap" gap="xs">
      <Stack gap={0} miw={0}>
        <Text size="sm" fw={600} truncate>
          {run.model ?? 'Benchmark run'}
        </Text>
        <Text size="xs" c="dimmed" ff="monospace" truncate>
          {run.taskId}
        </Text>
      </Stack>
      <Badge size="xs" variant="dot" color={STATUS_COLOR[run.status]} radius="sm" />
    </Group>
  </UnstyledButton>
)

/**
 * Slide-over showing one run's live log stream, with a switcher listing every run
 * the store is tracking. Switching only changes which stream is displayed — all
 * streams keep running in the store, so no active stream is interrupted.
 */
export const RunProgressDrawer = () => {
  const drawerOpen = useRunStreamsStore((s) => s.drawerOpen)
  const openRunId = useRunStreamsStore((s) => s.openRunId)
  const streams = useRunStreamsStore((s) => s.streams)
  const openDrawer = useRunStreamsStore((s) => s.openDrawer)
  const closeDrawer = useRunStreamsStore((s) => s.closeDrawer)

  const runs = Object.values(streams).sort(byStartedDesc)
  const active = openRunId ? streams[openRunId] : null

  return (
    <Drawer
      opened={drawerOpen}
      onClose={closeDrawer}
      position="right"
      size="xl"
      title={
        <Text fw={700} size="lg">
          Benchmark Runs
        </Text>
      }
      overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
    >
      {runs.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          No benchmark runs yet. Start one to see its live progress here.
        </Text>
      ) : (
        <Group align="stretch" gap="lg" wrap="nowrap" h="100%">
          <ScrollArea.Autosize w={220} type="hover">
            <Stack gap="xs">
              {runs.map((run) => (
                <RunSwitcherItem
                  key={run.taskId}
                  run={run}
                  active={run.taskId === active?.taskId}
                  onSelect={openDrawer}
                />
              ))}
            </Stack>
          </ScrollArea.Autosize>

          <Stack gap="md" flex={1} miw={0}>
            {active ? (
              <>
                <Paper withBorder radius="md" p="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={2} miw={0}>
                      <Text size="sm" fw={700} truncate>
                        {active.model ?? 'Benchmark run'}
                      </Text>
                      {active.nodeIp && (
                        <Text size="xs" c="dimmed" truncate>
                          Node {active.nodeIp}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Paper>

                <Paper withBorder radius="md" p="lg">
                  <LogStreamView
                    taskId={active.taskId}
                    lines={active.lines}
                    status={active.status}
                  />
                </Paper>
              </>
            ) : (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                Select a run to view its live progress.
              </Text>
            )}
          </Stack>
        </Group>
      )}
    </Drawer>
  )
}
