import { Card, Container, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ConfigureBenchmarkRun } from './components/ConfigureBenchmarkRun'
import { BenchmarksTable } from './components/BenchmarksTable'  
import { BenchmarkMetricChart } from './components/BenchmarkMetricChart'
import { BenchmarksHeader } from './components/BenchmarksHeader'
import { StartBenchmarkModal } from './components/StartBenchmarkModal'
import { RunProgressDrawer } from './components/RunProgressDrawer'
import { useBenchmarks } from './data/queries/useBenchmarks'

export const Benchmarks = () => {
  const { isFetching, refetch } = useBenchmarks()
  const [startModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)

  return (
    <Container fluid py="xl">
      <Stack gap="lg">
        <BenchmarksHeader
          isRefreshing={isFetching}
          onRefresh={refetch}
          onStartBenchmark={openModal}
        />

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <ConfigureBenchmarkRun />
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg">
          <BenchmarkMetricChart />
        </Card>

        <Stack gap="md">
          <BenchmarksTable />
        </Stack>
      </Stack>

      <StartBenchmarkModal opened={startModalOpen} onClose={closeModal} />
      <RunProgressDrawer />
    </Container>
  )
}
