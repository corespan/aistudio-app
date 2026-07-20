import { Button, Card, Group, Stack } from '@mantine/core'
import { IconBrandPython } from '@tabler/icons-react'
import { CoreForm, CoreTextInput, CoreIcon } from '@/shared/ui'
import { PageShell } from '@/app/layout/PageShell'
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
  const markOpened = useJupyterRunStore((s) => s.markOpened)
  const reset = useJupyterRunStore((s) => s.reset)

  const url = run?.url ?? null
  const opened = run?.opened ?? false

  const handleSubmit = (data: LaunchJupyterForm) => {
    reset()
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

  // Opening the tab from an async callback gets popup-blocked (no user gesture).
  // Instead we surface a button once the URL is known; clicking it IS a gesture,
  // so window.open is allowed.
  const openNotebook = () => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
    // Disable the button — we've navigated using it. Persisted in the store so it
    // stays disabled after switching tabs and coming back.
    markOpened()
  }

  return (
    <PageShell>
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

        {/* Bottom action: disabled until the notebook URL arrives in the stream,
            then enabled; disabled again once opened. */}
        <Group justify="flex-end">
          <Button
            size="sm"
            onClick={openNotebook}
            disabled={!url || opened}
            leftSection={<CoreIcon icon={<IconBrandPython />} size={16} />}
          >
            {opened ? 'Jupyter Lab Opened' : 'Open Jupyter Lab'}
          </Button>
        </Group>
      </Stack>
    </PageShell>
  )
}
