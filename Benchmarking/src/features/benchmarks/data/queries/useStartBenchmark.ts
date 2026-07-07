import { useMutation } from '@tanstack/react-query'
import { startBenchmark } from '../services/benchmarkRun'

/** Fires POST /api/v1/benchmarks/start when the user starts a benchmark. */
export const useStartBenchmark = () =>
  useMutation({
    mutationFn: startBenchmark,
    meta: {
      errorNotification: {
        id: 'benchmark-start-error',
        title: 'Unable to start the benchmark. Please try again.',
      },
    },
  })
