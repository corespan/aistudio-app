import { useEffect, useRef } from 'react'
import { Button, Card, Group, ScrollArea, Stack } from '@mantine/core'
import { IconBrandPython } from '@tabler/icons-react'
import { CoreForm, CoreTextInput, CoreIcon } from '@/shared/ui'
import { z } from 'zod'
import { useLaunchJupyter } from '../data/queries/useLaunchJupyter'
import { useJupyterRunStore } from '../store/useJupyterRunStore'
import { LogStreamView } from './LogStreamView'

const schema = z.object({
  nodeIp: z.string().min(1, 'Enter a node IP'),
})

type LaunchJupyterForm = z.infer<typeof schema>

const DEFAULT_VALUES: LaunchJupyterForm = { nodeIp: '' }

const readTaskId = (raw: unknown): string | null => {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  const data =
    obj?.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj
  const id = data?.task_id
  return typeof id === 'string' ? id : null
}

/** Launch Jupyter: enter a Node IP, launch a notebook server, then stream its logs. */
export const LaunchJupyter = () => {
  const launch = useLaunchJupyter()
  // The run lives in the store, so it survives navigating away from this panel.
  const run = useJupyterRunStore((s) => s.run)
  const startRun = useJupyterRunStore((s) => s.startRun)
  const reset = useJupyterRunStore((s) => s.reset)

  const url = run?.url ?? null

  // Track the URL we've already opened so we open the notebook tab exactly once.
  const openedUrlRef = useRef<string | null>(null)

  const handleSubmit = (data: LaunchJupyterForm) => {
    reset()
    openedUrlRef.current = null
    launch.mutate(
      { node_ip: data.nodeIp },
      {
        onSuccess: (res) => {
          const taskId = readTaskId(res)
          if (taskId) startRun({ taskId, nodeIp: data.nodeIp })
        },
      },
    )
  }

  // No tab is opened on Launch. Only once the notebook URL arrives in the log
  // stream do we open it directly — once.
  useEffect(() => {
    if (!url || openedUrlRef.current === url) return
    openedUrlRef.current = url
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
      // Blocked by the popup blocker: window.open here isn't tied to a user
      // gesture (the Launch click was seconds ago). Allow popups for this site.
      console.warn(`[Jupyter] Browser blocked opening ${url}. Allow popups for this site.`)
    }
  }, [url])

  return (
    <ScrollArea h="100%" scrollbarSize={8}>
      <Stack p="lg" gap="lg">
        <Card withBorder radius="md" p="lg">
          <Stack gap="lg">
            <CoreForm
              formId="launch-jupyter"
              schema={schema}
              defaultValues={DEFAULT_VALUES}
              onSubmit={handleSubmit}
            >
              <Group align="flex-end" gap="md" wrap="nowrap">
                <CoreTextInput name="nodeIp" label="Node IP" placeholder="Enter node IP" flex={1} />
                <Button
                  type="submit"
                  size="sm"
                  loading={launch.isPending}
                  leftSection={<CoreIcon icon={<IconBrandPython />} size={16} />}
                >
                  Launch
                </Button>
              </Group>
            </CoreForm>
          </Stack>
        </Card>

        {run && (
          <Card withBorder radius="md" p="lg">
            <LogStreamView taskId={run.taskId} lines={run.lines} status={run.status} />
          </Card>
        )}
      </Stack>
    </ScrollArea>
  )
}
