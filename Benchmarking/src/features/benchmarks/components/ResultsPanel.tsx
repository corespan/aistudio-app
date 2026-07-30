import { useState } from 'react'
import { Box, Group, SegmentedControl, Stack, Text } from '@mantine/core'
import { IconChartLine, IconTable } from '@tabler/icons-react'
import { BenchmarkMetricChart } from './BenchmarkMetricChart'
import { BenchmarksTable } from './BenchmarksTable'
import type { ResultsView } from '../types'
import { CoreIcon } from '@/shared/ui'

/**
 * Chart/Table toggle for the benchmark results panel. Owns which view is
 * showing — nothing else on the page needs to know or control it.
 */
export const ResultsPanel = () => {
  const [resultsView, setResultsView] = useState<ResultsView>('chart')

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
      <Group justify="space-between">
        {resultsView === 'chart' ? <Text fw={600}>Metric vs Concurrency</Text> : <Box />}
        <SegmentedControl
          size="xs"
          radius="md"
          // `.label` sets its own font-weight (Mantine's "medium" is 600), so
          // a root-level `fw` prop would be overridden — target the label.
          styles={{ label: { fontWeight: 500 } }}
          value={resultsView}
          onChange={(value) => setResultsView(value as ResultsView)}
          data={[
            {
              value: 'chart',
              label: (
                <Group gap={6} wrap="nowrap">
                  <CoreIcon icon={<IconChartLine />} size={14} />
                  Chart
                </Group>
              ),
            },
            {
              value: 'table',
              label: (
                <Group gap={6} wrap="nowrap">
                  <CoreIcon icon={<IconTable />} size={14} />
                  Table
                </Group>
              ),
            },
          ]}
        />
      </Group>

      <Box style={{ flex: 1, minHeight: 0 }}>
        {resultsView === 'chart' ? <BenchmarkMetricChart /> : <BenchmarksTable />}
      </Box>
    </Stack>
  )
}
