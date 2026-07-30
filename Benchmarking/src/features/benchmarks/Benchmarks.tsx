import { Button, Card, Container, Group, Stack } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { PageShell } from '@/app/layout/PageShell'
import { CoreIcon } from '@/shared/ui'
import { useStartBenchmarkModalStore } from './store/useStartBenchmarkModalStore'
import { ConfigureBenchmarkRun } from './components/ConfigureBenchmarkRun'
import { BenchmarkKpiCards } from './components/BenchmarkKpiCards'
import { ResultsPanel } from './components/ResultsPanel'
import { StartBenchmarkModal } from './components/StartBenchmarkModal'
import { RunProgressDrawer } from './components/RunProgressDrawer'

export const Benchmarks = () => {
  const startModalOpen = useStartBenchmarkModalStore((s) => s.isOpen)
  const openModal = useStartBenchmarkModalStore((s) => s.open)
  const closeModal = useStartBenchmarkModalStore((s) => s.close)

  return (
    <>
      <PageShell>
        <Container fluid pt="lg" pl="lg" pr="lg" pb="xl" h="100%">
          <Stack gap="md" h="100%" style={{ minHeight: 0 }}>
            <Group justify="flex-end">
              <Button
                size="sm"
                leftSection={<CoreIcon icon={<IconPlus />} size={16} />}
                onClick={openModal}
              >
                Start Benchmark
              </Button>
            </Group>

            <BenchmarkKpiCards />

            <Card withBorder radius="md" p="lg">
              <Stack gap="md">
                <ConfigureBenchmarkRun />
              </Stack>
            </Card>

            <Card
              withBorder
              radius="md"
              p="lg"
              style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              <ResultsPanel />
            </Card>
          </Stack>
        </Container>
      </PageShell>

      <StartBenchmarkModal opened={startModalOpen} onClose={closeModal} />
      <RunProgressDrawer />
    </>
  )
}
