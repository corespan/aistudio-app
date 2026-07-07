import { useQuery } from '@tanstack/react-query'
import { benchmarkOptionKeys } from '../keys'
import { getBenchmarks } from '../services/benchmarkOptions'
import { toBenchmarkRows } from '../selectors/toBenchmarkRows'
import { useBenchmarkFiltersStore } from '../../store/useBenchmarkFiltersStore'

export const useBenchmarks = () => {
  const filters = useBenchmarkFiltersStore((s) => s.filters)

  return useQuery({
    queryKey: benchmarkOptionKeys.benchmarks(filters),
    queryFn: () => getBenchmarks(filters),
    select: toBenchmarkRows,
    meta: {
      errorNotification: {
        id: 'benchmarks-error',
        title: 'Unable to load benchmarks. Please try again.',
      },
    },
  })
}
