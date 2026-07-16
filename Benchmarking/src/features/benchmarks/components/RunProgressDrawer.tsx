import { Badge, Drawer, Group, Paper, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core'
import { memo } from 'react'
import { HEADER_OFFSET } from '@/app/constants'
import type { LogStreamStatus } from '../hooks/useBenchmarkLogStream'
import { useRunStreamsStore, type RunStream } from '../store/useRunStreamsStore'
import { LogStreamView } from './LogStreamView'

const STATUS_COLOR: Record<LogStreamStatus, string> = {
  idle: 'gray',
  open: 'teal',
  reconnecting: 'yellow',
  error: 'red',
  closed: 'gray',
  failed: 'red',
}

// Most-recent run first, so the just-started run lands at the top of the switcher.
const byStartedDesc = (a: RunStream, b: RunStream) => b.startedAt.localeCompare(a.startedAt)

type RunSwitcherItemProps = {
  run: RunStream
  active: boolean
  onSelect: (taskId: string) => void
}

// Memoized so a streamed log line (which updates only the active run's object in
// the store) doesn't re-render every other switcher item. Native `title` tooltips
// avoid the per-item cost of mounting Mantine/Floating-UI tooltips.
const RunSwitcherItem = memo(({ run, active, onSelect }: RunSwitcherItemProps) => {
  return (
    <UnstyledButton
      onClick={() => onSelect(run.taskId)}
      p="sm"
      style={{
        width: '100%',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-default-border)',
        background: active ? 'var(--mantine-color-default-hover)' : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate title={run.model ?? 'Benchmark run'}>
            {run.model ?? 'Benchmark run'}
          </Text>
          {run.nodeIp && (
            <Text size="xs" c="dimmed" truncate title={run.nodeIp}>
              Node {run.nodeIp}
            </Text>
          )}
          <Text size="xs" c="dimmed" ff="monospace" truncate title={run.taskId}>
            {run.taskId}
          </Text>
        </Stack>
        <Badge size="xs" variant="dot" color={STATUS_COLOR[run.status]} radius="sm" />
      </Group>
    </UnstyledButton>
  )
})
RunSwitcherItem.displayName = 'RunSwitcherItem'

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
      title="Benchmark Runs"
      position="right"
      size="50%"
      // Float the panel off the viewport edges with rounded corners, matching
      // composer's themed drawers (see AddServerDrawer).
      offset={8}
      radius="sm"
      // No backdrop blur: blurring the live chart/table behind the drawer made the
      // open animation janky. Dim only, with a snappy slide.
      overlayProps={{ backgroundOpacity: 0.4 }}
      transitionProps={{ transition: 'slide-left', duration: 150 }}
      // Flex-column panel with a full-height body so the two-column content fills
      // the drawer; bordered header mirrors composer's drawer chrome.
      // overlay/inner top offsets open the drawer *below* the app header so the
      // header stays visible, matching composer's themed drawers.
      styles={{
        overlay: { top: HEADER_OFFSET },
        inner: { top: HEADER_OFFSET },
        content: { display: 'flex', flexDirection: 'column' },
        // Gap between the header divider line and the content below it.
        body: { flex: 1, minHeight: 0, paddingTop: 'var(--mantine-spacing-lg)' },
        header: {
          padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        },
        title: { fontWeight: 600 },
      }}
    >
      {runs.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          No benchmark runs yet. Start one to see its live progress here.
        </Text>
      ) : (
        <Group align="stretch" gap="lg" wrap="nowrap" h="100%">
          <ScrollArea w={220} scrollbars="y" style={{ flexShrink: 0 }}>
            <Stack gap="xs" w="100%">
              {runs.map((run) => (
                <RunSwitcherItem
                  key={run.taskId}
                  run={run}
                  active={run.taskId === active?.taskId}
                  onSelect={openDrawer}
                />
              ))}
            </Stack>
          </ScrollArea>

          <Stack gap="md" flex={1} miw={0}>
            {active ? (
              <Paper withBorder radius="md" p="lg">
                <LogStreamView taskId={active.taskId} lines={active.lines} status={active.status} />
              </Paper>
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
