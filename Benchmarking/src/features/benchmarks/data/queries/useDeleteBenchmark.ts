import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { benchmarkOptionKeys } from '../keys'
import { deleteBenchmark } from '../services/benchmarkRun'

/**
 * Fires DELETE /api/v1/benchmarks/:runId, then refetches the benchmarks list so
 * the deleted run drops out of the table. Shows a success toast on completion.
 */
export const useDeleteBenchmark = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (runId: string) => deleteBenchmark(runId),
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({ queryKey: benchmarkOptionKeys.all })
      notifications.show({
        color: 'green',
        title: 'Run deleted',
        message: `Benchmark run ${runId} was removed.`,
      })
    },
    meta: {
      errorNotification: {
        id: 'benchmark-delete-error',
        title: 'Unable to delete the run. Please try again.',
      },
    },
  })
}
