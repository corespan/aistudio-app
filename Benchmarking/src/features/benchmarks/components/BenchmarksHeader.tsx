import { Button, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconGauge, IconPlayerPlay } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import type { BenchmarksHeaderProps } from '../types'

/**
 * Page header for the BenchmarksformatMetric board: branded icon, title,
 * supporting copy, a refresh action, and the start-benchmark action.
 */
export const BenchmarksHeader = ({ isStarting, onStartBenchmark }: BenchmarksHeaderProps) => {
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
