import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { jupyterKeys } from '../keys'
import { deleteJupyterInstance } from '../services/jupyter'

/**
 * Fires DELETE /api/v1/jupyter/instances/:taskId, then refetches the instances
 * list so the deleted server drops out of the table. Shows a success toast on
 * completion — mirrors useDeleteBenchmark.
 */
export const useDeleteJupyterInstance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteJupyterInstance(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: jupyterKeys.all })
      notifications.show({
        color: 'green',
        title: 'Instance deleted',
        message: `Jupyter instance ${taskId} was removed.`,
      })
    },
    meta: {
      errorNotification: {
        id: 'jupyter-instance-delete-error',
        title: 'Unable to delete the Jupyter instance. Please try again.',
      },
    },
  })
}
