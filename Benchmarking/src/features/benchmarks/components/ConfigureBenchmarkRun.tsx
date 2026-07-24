import { Box, Group, Stack, Text } from '@mantine/core'
import { IconServer } from '@tabler/icons-react'
import { CoreForm, CoreIcon, CoreSelect } from '@/shared/ui'
import { BENCHMARK_TYPE_OPTIONS } from '../constants'
import {
  useConcurrencies,
  useGpuTypes,
  useInputTokens,
  useModels,
  useNodes,
  useOutputTokens,
  usePrecisions,
} from '../data/queries/useBenchmarkOptions'
import {
  configureBenchmarkRunSchema,
  CONFIGURE_BENCHMARK_RUN_DEFAULTS,
} from '../configureBenchmarkRun.schema'
import type { BenchmarkRunConfig } from '../types'
import { BenchmarkFilterSync } from './BenchmarkFilterSync'
import { ResetFiltersButton } from './ResetFiltersButton'
import { GpuTypeSelect } from './GpuTypeSelect'

/**
 * The dropdown row of the Configure Benchmark Run panel:
 * Model, Machine IP, GPU Type, Benchmark Type, and Concurrency.
 */
export const ConfigureBenchmarkRun = () => {
  const models = useModels()
  const nodes = useNodes()
  const gpuTypes = useGpuTypes()
  const concurrencies = useConcurrencies()
  const precisions = usePrecisions()
  const inputTokens = useInputTokens()
  const outputTokens = useOutputTokens()

  const handleSubmit = (data: BenchmarkRunConfig) => {
    // Wire up to the run-benchmark mutation once the backend is ready.
    console.log('benchmark config', data)
  }

  return (
    <CoreForm
      formId="configure-benchmark-run"
      schema={configureBenchmarkRunSchema}
      defaultValues={CONFIGURE_BENCHMARK_RUN_DEFAULTS}
      onSubmit={handleSubmit}
    >
      <BenchmarkFilterSync />
      <Stack gap="sm">
        <Text fw={600} size="sm">
          Benchmark Filters
        </Text>
        {/* Node IP (left) and Reset (right) share one row, top-aligned so
          Reset sits level with the "Node IP" label rather than the select. */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box flex={1} maw={320} px={0} pt={0} pb={0}>
            <Group gap={4} mb={2}>
              <CoreIcon icon={<IconServer />} size={13} />
              <Text size="xs" fw={700} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                Node IP
              </Text>
            </Group>
            <CoreSelect
              name="machineIp"
              data={nodes.data ?? []}
              disabled={nodes.isPending}
              placeholder={nodes.isPending ? 'Loading…' : 'Select Node IP'}
              styles={{ input: { fontWeight: 700 } }}
            />
          </Box>
          <ResetFiltersButton />
        </Group>
        <Group align="flex-end" gap="md" grow wrap="nowrap">
          <CoreSelect
            name="model"
            label="Model"
            data={models.data ?? []}
            disabled={models.isPending}
            placeholder={models.isPending ? 'Loading…' : 'Select model'}
            flex={1.2}
          />
          <GpuTypeSelect data={gpuTypes.data ?? []} disabled={gpuTypes.isPending} />
          <CoreSelect
            name="benchmarkType"
            label="Benchmark Type"
            data={BENCHMARK_TYPE_OPTIONS}
            flex={1}
          />
          <CoreSelect
            name="concurrency"
            label="Concurrency"
            data={concurrencies.data ?? []}
            disabled={concurrencies.isPending}
            placeholder={concurrencies.isPending ? 'Loading…' : 'Select concurrency'}
            allowDeselect={false}
            flex={0.7}
          />
          <CoreSelect
            name="precision"
            label="Precision"
            data={precisions.data ?? []}
            disabled={precisions.isPending}
            placeholder={precisions.isPending ? 'Loading…' : 'Select precision'}
            allowDeselect={false}
            flex={0.8}
          />
          <CoreSelect
            name="inputTokens"
            label="Input Tokens"
            data={inputTokens.data ?? []}
            disabled={inputTokens.isPending}
            placeholder={inputTokens.isPending ? 'Loading…' : 'Select input tokens'}
            allowDeselect={false}
            flex={0.8}
          />
          <CoreSelect
            name="outputTokens"
            label="Output Tokens"
            data={outputTokens.data ?? []}
            disabled={outputTokens.isPending}
            placeholder={outputTokens.isPending ? 'Loading…' : 'Select output tokens'}
            allowDeselect={false}
            flex={0.8}
          />
        </Group>
      </Stack>
    </CoreForm>
  )
}
