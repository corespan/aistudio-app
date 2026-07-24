import { Button } from '@mantine/core'
import { useFormContext } from 'react-hook-form'
import { IconRestore } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { CONFIGURE_BENCHMARK_RUN_DEFAULTS } from '../configureBenchmarkRun.schema'
import type { BenchmarkRunConfig } from '../types'

/**
 * Restores every dropdown to its default values — the exact state the panel is
 * in when the app first loads. `BenchmarkFilterSync` then pushes those defaults
 * into the filters store, so the chart and table return to their initial view.
 */
export const ResetFiltersButton = () => {
  const { reset } = useFormContext<BenchmarkRunConfig>()
  return (
    <Button
      type="button"
      variant="default"
      size="xs"
      leftSection={<CoreIcon icon={<IconRestore stroke={1.6} />} size={14} />}
      onClick={() => reset(CONFIGURE_BENCHMARK_RUN_DEFAULTS)}
    >
      Reset
    </Button>
  )
}
