import { useState } from 'react'
import { Button, Card, Container, Group, SegmentedControl, Stack } from '@mantine/core'
import { IconChartLine, IconPlus, IconTable } from '@tabler/icons-react'
import { ConfigureBenchmarkRun } from './components/ConfigureBenchmarkRun'
import { BenchmarkKpiCards } from './components/BenchmarkKpiCards'
import { BenchmarksTable } from './components/BenchmarksTable'
import { BenchmarkMetricChart } from './components/BenchmarkMetricChart'
import { StartBenchmarkModal } from './components/StartBenchmarkModal'
import { RunProgressDrawer } from './components/RunProgressDrawer'
import { PageShell } from '@/app/layout/PageShell'
import { useStartBenchmarkModalStore } from './store/useStartBenchmarkModalStore'

type ResultsView = 'chart' | 'table'

export const Benchmarks = () => {
  const startModalOpen = useStartBenchmarkModalStore((s) => s.isOpen)
  const openModal = useStartBenchmarkModalStore((s) => s.open)
  const closeModal = useStartBenchmarkModalStore((s) => s.close)
  const [resultsView, setResultsView] = useState<ResultsView>('chart')

  return (
    <>
      <PageShell>
        <Container fluid pt="sm" px="sm" pb="xl">
          <Stack gap="md">
            <Group justify="flex-end">
              <Button size="sm" leftSection={<IconPlus size={16} />} onClick={openModal}>
                Start Benchmark
              </Button>
            </Group>

            <BenchmarkKpiCards />

            <Card withBorder radius="md" p="lg">
              <Stack gap="md">
                <ConfigureBenchmarkRun />
              </Stack>
            </Card>

            <Card withBorder radius="md" p="lg">
              <Stack gap="md">
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

                {resultsView === 'chart' ? <BenchmarkMetricChart /> : <BenchmarksTable />}
              </Stack>
            </Card>
          </Stack>
        </Container>
      </PageShell>

      <StartBenchmarkModal opened={startModalOpen} onClose={closeModal} />
      <RunProgressDrawer />
    </>
  )
}
