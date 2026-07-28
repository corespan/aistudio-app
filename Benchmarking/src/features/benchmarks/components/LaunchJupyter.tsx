import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { IconBrandPython } from '@tabler/icons-react'
import { CoreForm, CoreTextInput, CoreIcon } from '@/shared/ui'
import { PageShell } from '@/app/layout/PageShell'
import { z } from 'zod'
import { useLaunchJupyter } from '../data/queries/useLaunchJupyter'
import { useJupyterRunStore } from '../store/useJupyterRunStore'
import { LogStreamView } from './LogStreamView'
import { JupyterInstancesTable } from './JupyterInstancesTable'
import type { LaunchJupyterForm } from '../types'
import { LAUNCH_JUPYTER_DEFAULTS } from '../constants'

const schema = z.object({
  nodeIp: z.string().min(1, 'Enter a node IP'),
}) satisfies z.ZodType<LaunchJupyterForm>

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

  return (
    <PageShell>
      <Stack p="lg" gap="lg">
        <Card withBorder radius="md" p="lg">
          <Stack gap="lg">
            <CoreForm
              formId="launch-jupyter"
              schema={schema}
              defaultValues={LAUNCH_JUPYTER_DEFAULTS}
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

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Text fw={600}>Jupyter Instances</Text>
            <JupyterInstancesTable />
          </Stack>
        </Card>
      </Stack>
    </PageShell>
  )
}
