import { useState } from 'react'
import { Box, Group, SegmentedControl, Stack } from '@mantine/core'
import { IconChartLine, IconTable } from '@tabler/icons-react'
import { BenchmarkMetricChart } from './BenchmarkMetricChart'
import { BenchmarksTable } from './BenchmarksTable'
import type { ResultsView } from '../types'

/**
 * Chart/Table toggle for the benchmark results panel. Owns which view is
 * showing — nothing else on the page needs to know or control it.
 */
export const ResultsPanel = () => {
  const [resultsView, setResultsView] = useState<ResultsView>('chart')

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
      <Group justify="flex-end">
        <SegmentedControl
          size="xs"
          value={resultsView}
          onChange={(value) => setResultsView(value as ResultsView)}
          data={[
            {
              value: 'chart',
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconChartLine size={14} />
                  Chart
                </Group>
              ),
            },
            {
              value: 'table',
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconTable size={14} />
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
