import { useRef, useState } from 'react'
import { Anchor, Button, Card, Group, Stack, Title } from '@mantine/core'
import { IconBrandPython } from '@tabler/icons-react'
import { CoreForm, CoreTextInput, CoreIcon } from '@/shared/ui'
import { z } from 'zod'
import { useLaunchJupyter } from '../data/queries/useLaunchJupyter'
import { BenchmarkLogStream } from './BenchmarkLogStream'

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

// The notebook URL isn't in the launch response — it arrives later in the log
// stream, e.g. "✓ Jupyter Lab running at: http://10.6.12.22:8899/lab".
const extractUrlFromLog = (line: string): string | null => {
  const match = line.match(/running at:?\s*(https?:\/\/\S+)/i)
  return match ? match[1].replace(/[.,)]+$/, '') : null
}

/** Launch Jupyter: enter a Node IP, launch a notebook server, then stream its logs. */
export const LaunchJupyter = () => {
  const launch = useLaunchJupyter()
  const [taskId, setTaskId] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  // Tab opened synchronously on submit (a user gesture, so it's not blocked).
  // We hold the handle and redirect it to the notebook once the URL streams in.
  const popupRef = useRef<Window | null>(null)

  const handleSubmit = (data: LaunchJupyterForm) => {
    setUrl(null)
    popupRef.current = window.open('about:blank', '_blank')

    launch.mutate(
      { node_ip: data.nodeIp },
      {
        onSuccess: (res) => setTaskId(readTaskId(res)),
        onError: () => {
          popupRef.current?.close()
          popupRef.current = null
        },
      },
    )
  }

  const handleLogLine = (line: string) => {
    const found = extractUrlFromLog(line)
    if (!found || url) return // open only once
    setUrl(found)
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.opener = null // reverse-tabnabbing protection
      popupRef.current.location.replace(found)
    } else {
      // Tab was blocked or already closed — fall back to the manual link below.
      window.open(found, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Stack p="lg" gap="lg">
      <Title order={3} fw={700}>
        Launch Jupyter
      </Title>

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
                size="xs"
                loading={launch.isPending}
                variant="gradient"
                gradient={{ from: 'cyan', to: 'indigo', deg: 135 }}
                leftSection={<CoreIcon icon={<IconBrandPython />} size={14} />}
              >
                Launch
              </Button>
            </Group>
          </CoreForm>

          {url && (
            <Anchor href={url} target="_blank" rel="noreferrer" fw={600} size="sm">
              Open Jupyter →
            </Anchor>
          )}
        </Stack>
      </Card>

      {taskId && (
        <Card withBorder radius="md" p="lg">
          <BenchmarkLogStream
            taskId={taskId}
            streamPath={`/api/v1/jupyter/${taskId}/logs/stream`}
            onLine={handleLogLine}
          />
        </Card>
      )}
    </Stack>
  )
}
