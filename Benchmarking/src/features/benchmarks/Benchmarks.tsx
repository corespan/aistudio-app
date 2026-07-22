import { Button, Card, Container, Group, Stack } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { ConfigureBenchmarkRun } from './components/ConfigureBenchmarkRun'
import { BenchmarkKpiCards } from './components/BenchmarkKpiCards'
import { BenchmarksTable } from './components/BenchmarksTable'
import { BenchmarkMetricChart } from './components/BenchmarkMetricChart'
import { StartBenchmarkModal } from './components/StartBenchmarkModal'
import { RunProgressDrawer } from './components/RunProgressDrawer'
import { PageShell } from '@/app/layout/PageShell'
import { useStartBenchmarkModalStore } from './store/useStartBenchmarkModalStore'

export const Benchmarks = () => {
  const startModalOpen = useStartBenchmarkModalStore((s) => s.isOpen)
  const openModal = useStartBenchmarkModalStore((s) => s.open)
  const closeModal = useStartBenchmarkModalStore((s) => s.close)

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
              <BenchmarkMetricChart />
            </Card>

            <Stack gap="md">
              <BenchmarksTable />
            </Stack>
          </Stack>
        </Container>
      </PageShell>

      <StartBenchmarkModal opened={startModalOpen} onClose={closeModal} />
      <RunProgressDrawer />
    </>
  )
}
