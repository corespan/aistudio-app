import { Button, Group, Indicator, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconGauge, IconLayoutSidebarRightExpand, IconPlayerPlay } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { useRunStreamsStore } from '../store/useRunStreamsStore'

type Props = {
  /** Whether the runs list is currently refetching. */
  isRefreshing?: boolean
  onRefresh?: () => void
  /** Whether the start-benchmark mutation is in flight. */
  isStarting?: boolean
  onStartBenchmark?: () => void
}

/**
 * Page header for the BenchmarksformatMetric board: branded icon, title with a live run
 * count, supporting copy, a refresh action, and the start-benchmark action.
 */
export const BenchmarksHeader = ({ isStarting, onStartBenchmark }: Props) => {
  const runCount = useRunStreamsStore((s) => Object.keys(s.streams).length)
  const openPanel = useRunStreamsStore((s) => s.openPanel)

  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Group align="center" gap="md" wrap="nowrap">
        <ThemeIcon
          size={44}
          radius="md"
          variant="gradient"
          gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
        >
          <CoreIcon icon={<IconGauge stroke={1.6} />} size={26} />
        </ThemeIcon>

        <Stack gap={2}>
          <Group gap="xs" align="center">
            <Title order={3} fw={700} lh={1.1}>
              Benchmarks
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Configure and track model performance across your Fabric machines
          </Text>
        </Stack>
      </Group>

      <Group gap="sm" wrap="nowrap">
        <Indicator label={runCount} size={18} color="indigo" disabled={runCount === 0} offset={4}>
          <Button
            variant="default"
            radius="md"
            onClick={openPanel}
            leftSection={
              <CoreIcon icon={<IconLayoutSidebarRightExpand stroke={1.8} />} size={16} />
            }
          >
            Runs
          </Button>
        </Indicator>
        {onStartBenchmark && (
          <Button
            bg="#3b5bdb"
            c="white"
            radius="md"
            onClick={onStartBenchmark}
            loading={isStarting}
            leftSection={<CoreIcon icon={<IconPlayerPlay stroke={1.8} />} size={16} />}
          >
            Start Benchmark
          </Button>
        )}
      </Group>
    </Group>
  )
}
