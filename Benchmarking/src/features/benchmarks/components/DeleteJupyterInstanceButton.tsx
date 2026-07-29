import { ActionIcon, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconTrash } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { useDeleteJupyterInstance } from '../data/queries/useDeleteJupyterInstance'
import type { JupyterInstanceActionProps } from '../types'

/**
 * Deletes a single Jupyter instance after a confirmation prompt. Mirrors
 * DeleteRunButton's shape so the two delete flows stay consistent.
 */
export const DeleteJupyterInstanceButton = ({ instance }: JupyterInstanceActionProps) => {
  const { mutate, isPending } = useDeleteJupyterInstance()

  const confirmDelete = () =>
    modals.openConfirmModal({
      title: 'Delete this instance?',
      children: (
        <>
          Jupyter instance <strong>{instance.taskId}</strong> will be permanently
          deleted. This cannot be undone.
        </>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => mutate(instance.taskId),
    })

  return (
    <Tooltip label="Delete instance" withArrow>
      <ActionIcon
        color="red"
        variant="subtle"
        loading={isPending}
        onClick={confirmDelete}
        aria-label={`Delete instance ${instance.taskId}`}
      >
        <CoreIcon icon={<IconTrash stroke={1.8} />} size={16} />
      </ActionIcon>
    </Tooltip>
  )
}
