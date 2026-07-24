import { Button } from '@mantine/core'
import { IconActivity } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { useRunStreamsStore } from '../store/useRunStreamsStore'
import type { RunActionProps } from '../types'

/**
 * Opens the progress drawer for a run, starting its log stream if it isn't already
 * streaming. Reads the store directly rather than being prop-drilled.
 */
export const ViewProgressButton = ({ run }: RunActionProps) => {
  const viewRun = useRunStreamsStore((s) => s.viewRun)
  return (
    <Button
      size="compact-xs"
      variant="light"
      leftSection={<CoreIcon icon={<IconActivity stroke={1.8} />} size={14} />}
      onClick={() => viewRun({ taskId: run.runId, model: run.model, nodeIp: run.machineIp })}
    >
      View Progress
    </Button>
  )
}
