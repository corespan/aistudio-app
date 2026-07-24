import { Box, Group, Text } from '@mantine/core'
import { useWatch } from 'react-hook-form'
import { CoreSelect } from '@/shared/ui'
import { colorForGpuType, normalizeGpuType } from '../lib/gpuColors'
import type { BenchmarkRunConfig, GpuTypeSelectProps } from '../types'

/** GPU Type dropdown for the Configure Benchmark Run panel, with a color swatch
 * (matching the metric chart's per-GPU series color) on the selected value and
 * on each option in the list. */
export const GpuTypeSelect = ({ data, disabled }: GpuTypeSelectProps) => {
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
