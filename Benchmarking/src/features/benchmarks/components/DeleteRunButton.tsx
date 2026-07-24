import { ActionIcon, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconTrash } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { useDeleteBenchmark } from '../data/queries/useDeleteBenchmark'
import { useRunStreamsStore } from '../store/useRunStreamsStore'
import type { RunActionProps } from '../types'

/**
 * Deletes a single run after a confirmation prompt. Reads the mutation directly
 * so the column definition stays free of prop drilling.
 */
export const DeleteRunButton = ({ run }: RunActionProps) => {
  const { mutate, isPending } = useDeleteBenchmark()
  const closeRun = useRunStreamsStore((s) => s.closeRun)

  const confirmDelete = () =>
    modals.openConfirmModal({
      title: 'Delete this run?',
      children: (
        <>
          Run <strong>{run.runId}</strong>
          {run.model ? ` (${run.model})` : ''} will be permanently deleted. This
          cannot be undone.
        </>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      // On success, also drop the run's live stream from the store so it can't
      // reappear as a synthetic pending row (or linger in the progress drawer).
      onConfirm: () => mutate(run.runId, { onSuccess: () => closeRun(run.runId) }),
    })

  return (
    <Tooltip label="Delete run" withArrow>
      <ActionIcon
        color="red"
        variant="subtle"
        loading={isPending}
        onClick={confirmDelete}
        aria-label={`Delete run ${run.runId}`}
      >
        <CoreIcon icon={<IconTrash stroke={1.8} />} size={16} />
      </ActionIcon>
    </Tooltip>
  )
}
