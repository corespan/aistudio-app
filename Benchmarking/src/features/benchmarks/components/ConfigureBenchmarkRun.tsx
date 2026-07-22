import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Box, Button, Group, Stack, Text, type ComboboxData } from '@mantine/core'
import { IconRestore, IconServer } from '@tabler/icons-react'
import { CoreForm, CoreIcon, CoreSelect } from '@/shared/ui'
import { z } from 'zod'
import { BENCHMARK_TYPE_OPTIONS } from '../constants'
import { useBenchmarkFiltersStore } from '../store/useBenchmarkFiltersStore'
import {
  useConcurrencies,
  useGpuTypes,
  useInputTokens,
  useModels,
  useNodes,
  useOutputTokens,
  usePrecisions,
} from '../data/queries/useBenchmarkOptions'
import { colorForGpuType, normalizeGpuType } from '../lib/gpuColors'

const schema = z.object({
  model: z.string().min(1, 'Select a model'),
  machineIp: z.string().min(1, 'Select a machine'),
  gpuType: z.string().min(1, 'Select a GPU type'),
  benchmarkType: z.string().min(1, 'Select a benchmark type'),
  concurrency: z.string().min(1, 'Select concurrency'),
  precision: z.string().min(1, 'Select a precision'),
  inputTokens: z.string().min(1, 'Select input tokens'),
  outputTokens: z.string().min(1, 'Select output tokens'),
})

type BenchmarkRunConfig = z.infer<typeof schema>

// Every option list except Benchmark Type comes from the backend, so they start
// empty and are chosen by the user once loaded. Benchmark Type is still mock.
const DEFAULT_VALUES: BenchmarkRunConfig = {
  model: '',
  machineIp: '',
  gpuType: '',
  benchmarkType: BENCHMARK_TYPE_OPTIONS[0],
  concurrency: '',
  precision: '',
  inputTokens: '',
  outputTokens: '',
}

/**
 * Watches the dropdown selections and mirrors them into the filter store using
 * the exact `/api/v1/benchmarks` query-param names. Empty selections are dropped
 * so they aren't sent. Renders nothing — must live inside the CoreForm provider.
 */
const BenchmarkFilterSync = () => {
  const values = useWatch<BenchmarkRunConfig>()
  const setFilters = useBenchmarkFiltersStore((s) => s.setFilters)
  const setBenchmarkType = useBenchmarkFiltersStore((s) => s.setBenchmarkType)

  useEffect(() => {
    const blank = (v?: string) => (v ? v : undefined)
    setFilters({
      model: blank(values.model),
      node_ip: blank(values.machineIp),
      gpu_type: blank(values.gpuType),
      precision: blank(values.precision),
      input_tokens: blank(values.inputTokens),
      output_tokens: blank(values.outputTokens),
      concurrency: blank(values.concurrency),
    })
  }, [
    values.model,
    values.machineIp,
    values.gpuType,
    values.precision,
    values.inputTokens,
    values.outputTokens,
    values.concurrency,
    setFilters,
  ])

  // Benchmark Type drives the chart's Y axis, not the table filters.
  useEffect(() => {
    if (values.benchmarkType) setBenchmarkType(values.benchmarkType)
  }, [values.benchmarkType, setBenchmarkType])

  return null
}

/**
 * Restores every dropdown to DEFAULT_VALUES — the exact state the panel is in
 * when the app first loads. The sync effects above then push those defaults into
 * the filters store, so the chart and table return to their initial view.
 */
const ResetFiltersButton = () => {
  const { reset } = useFormContext<BenchmarkRunConfig>()
  return (
    <Button
      type="button"
      variant="default"
      size="xs"
      leftSection={<CoreIcon icon={<IconRestore stroke={1.6} />} size={14} />}
      onClick={() => reset(DEFAULT_VALUES)}
    >
      Reset
    </Button>
  )
}

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
      schema={schema}
      defaultValues={DEFAULT_VALUES}
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

const GpuTypeSelect = ({ data, disabled }: { data: ComboboxData; disabled: boolean }) => {
  const gpuTypeRaw = useWatch<BenchmarkRunConfig>({ name: 'gpuType' })
  const gpuType = normalizeGpuType(gpuTypeRaw) ?? ''
  const color = gpuType ? colorForGpuType(gpuType) : undefined

  return (
    <CoreSelect
      name="gpuType"
      label="GPU Type"
      data={data}
      disabled={disabled}
      placeholder={disabled ? 'Loading…' : 'Select GPU type'}
      flex={1}
      leftSection={
        color ? <Box w={10} h={10} bg={color} style={{ borderRadius: '50%' }} /> : undefined
      }
      leftSectionPointerEvents="none"
      renderOption={({ option, checked }) => {
        const value = normalizeGpuType(option.value) ?? option.value
        const optionColor = value ? colorForGpuType(value) : undefined
        return (
          <Group gap="xs" wrap="nowrap">
            <Box w={10} h={10} bg={optionColor} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <Text size="sm" fw={checked ? 700 : 500}>
              {option.label}
            </Text>
          </Group>
        )
      }}
    />
  )
}
