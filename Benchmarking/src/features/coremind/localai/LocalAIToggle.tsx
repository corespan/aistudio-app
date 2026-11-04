import { Progress, Stack, Switch, Text } from '@mantine/core'
import { useLocalAIStore } from './useLocalAIStore'

/** The "Local AI" switch at the top of the CoreMind panel, with download progress. */
export const LocalAIToggle = () => {
  const enabled = useLocalAIStore((s) => s.enabled)
  const status = useLocalAIStore((s) => s.status)
  const progress = useLocalAIStore((s) => s.progress)
  const message = useLocalAIStore((s) => s.message)
  const turnOn = useLocalAIStore((s) => s.turnOn)
  const turnOff = useLocalAIStore((s) => s.turnOff)

  return (
    <Stack
      gap={4}
      px="sm"
      py={6}
      style={{ borderBottom: '1px solid var(--app-shell-border-color)' }}
    >
      <Switch
        size="xs"
        label="Local AI — understands any wording, runs on your computer"
        checked={enabled}
        disabled={status === 'loading'}
        onChange={(event) => (event.currentTarget.checked ? turnOn() : turnOff())}
      />
      {status === 'loading' && (
        <>
          <Progress
            value={progress * 100}
            size="sm"
            animated
            aria-label="Local AI download progress"
          />
          <Text size="xs" c="dimmed" lineClamp={2}>
            {message}
          </Text>
        </>
      )}
      {(status === 'unsupported' || status === 'error') && (
        <Text size="xs" c="red">
          {message}
        </Text>
      )}
    </Stack>
  )
}
