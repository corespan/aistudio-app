import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconClick,
  IconListCheck,
  IconPlayerStop,
  IconX,
} from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import type { ToolClass } from '../events'
import { agentLabel, AGENT_TRANSPORT_MODE } from '../index'
import type { AgentRunState, RunStatus, ToolStep } from '../runReducer'
import { useAgentStore } from '../useAgentStore'

const STATUS_TEXT: Record<RunStatus, string> = {
  connecting: 'Connecting…',
  awaiting_approval: 'Waiting for your approval',
  running: 'Working…',
  completed: '',
  failed: 'Failed',
  cancelled: 'Stopped',
}

/** read/closed run freely; write needs approval; destructive needs approval + re-login. */
const CLASS_COLOR: Record<ToolClass, string> = {
  read: 'gray',
  closed: 'gray',
  write: 'orange',
  destructive: 'red',
}

const ERROR_TEXT: Record<string, string> = {
  budget_exceeded: 'Ran out of steps or time before finishing.',
  forbidden: "You don't have access to what this needed.",
  step_up_required: 'This action needs you to sign in again.',
}

/** One agent reply: helper label, plan to approve, tool steps, answer text and budget. */
export const AgentRunView = ({ messageId }: { messageId: string }) => {
  const run = useAgentStore((s) => s.runs[messageId])
  if (!run) return null

  const active = run.status === 'connecting' || run.status === 'running'

  return (
    <Stack gap={8} aria-busy={active}>
      <Group gap={6}>
        <Badge size="sm" variant="light" radius="sm">
          {agentLabel(run.agent)}
        </Badge>
        {AGENT_TRANSPORT_MODE === 'mock' && (
          <Badge size="xs" variant="outline" color="gray" radius="sm">
            demo
          </Badge>
        )}
        {STATUS_TEXT[run.status] && (
          <Text size="xs" c="dimmed">
            {STATUS_TEXT[run.status]}
          </Text>
        )}
        {active && <Loader size={12} />}
      </Group>

      {run.plan && <PlanCard messageId={messageId} run={run} />}

      {run.steps.length > 0 && (
        <Stack gap={4}>
          {run.steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </Stack>
      )}

      {run.actions.map((action, index) => (
        <Group key={index} gap={6} wrap="nowrap" align="flex-start">
          <CoreIcon icon={<IconClick />} size={14} color="var(--mantine-color-dimmed)" />
          <Text size="xs" c="dimmed">
            {action.text}
          </Text>
        </Group>
      ))}

      {(run.text || run.status === 'running') && (
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} aria-live="polite">
          {run.text}
          {run.status === 'running' && run.text && <BlinkingCaret />}
        </Text>
      )}

      {run.error && (
        <Alert
          variant="light"
          color="red"
          p="xs"
          icon={<CoreIcon icon={<IconAlertTriangle />} size={16} />}
        >
          <Text size="xs">{ERROR_TEXT[run.error.code] ?? run.error.message}</Text>
          {ERROR_TEXT[run.error.code] && (
            <Text size="xs" c="dimmed">
              {run.error.message}
            </Text>
          )}
        </Alert>
      )}

      {run.budget && <BudgetMeter run={run} />}
    </Stack>
  )
}

const PlanCard = ({ messageId, run }: { messageId: string; run: AgentRunState }) => {
  const approve = useAgentStore((s) => s.approve)
  const reject = useAgentStore((s) => s.reject)
  const waiting = run.status === 'awaiting_approval'

  return (
    <Paper withBorder radius="md" p="sm" bg="var(--core-surface-1)">
      <Group gap={6} mb={6}>
        <CoreIcon icon={<IconListCheck />} size={16} />
        <Text size="sm" fw={600}>
          Plan
        </Text>
        {run.planDecision && (
          <Badge
            size="xs"
            variant="light"
            color={run.planDecision === 'approved' ? 'teal' : 'gray'}
          >
            {run.planDecision}
          </Badge>
        )}
      </Group>
      <Stack component="ol" gap={6} m={0} pl={18}>
        {run.plan?.map((step) => (
          <Box component="li" key={step.id}>
            <Group gap={6} wrap="nowrap" align="flex-start" justify="space-between">
              <Text size="sm">{step.title}</Text>
              <Badge
                size="xs"
                variant="light"
                color={CLASS_COLOR[step.class]}
                style={{ flexShrink: 0 }}
              >
                {step.class}
              </Badge>
            </Group>
          </Box>
        ))}
      </Stack>
      {waiting && (
        <Group gap="xs" mt="sm">
          <Button size="xs" onClick={() => approve(messageId)}>
            Approve & run
          </Button>
          <Button size="xs" variant="default" onClick={() => reject(messageId)}>
            Reject
          </Button>
        </Group>
      )}
    </Paper>
  )
}

const StepRow = ({ step }: { step: ToolStep }) => (
  <Group gap={8} wrap="nowrap" align="flex-start">
    <Box w={14} pt={2} style={{ flexShrink: 0 }}>
      {step.status === 'running' && <Loader size={12} />}
      {step.status === 'done' && (
        <CoreIcon icon={<IconCheck />} size={14} color="var(--mantine-color-teal-6)" />
      )}
      {step.status === 'failed' && (
        <CoreIcon icon={<IconX />} size={14} color="var(--mantine-color-red-6)" />
      )}
    </Box>
    <Box miw={0}>
      <Text size="xs">{step.title ?? step.tool}</Text>
      <Text size="xs" c="dimmed" ff="monospace" truncate>
        {step.tool}
        {step.summary && ` · ${step.summary}`}
      </Text>
    </Box>
  </Group>
)

const BudgetMeter = ({ run }: { run: AgentRunState }) => {
  const budget = run.budget!
  const used = Math.min(1, budget.stepsUsed / Math.max(1, budget.stepsMax))
  return (
    <Box>
      <Progress
        value={used * 100}
        size={3}
        color={used >= 1 ? 'red' : undefined}
        aria-label="Steps used"
      />
      <Text size="10px" c="dimmed" mt={2}>
        Step {budget.stepsUsed} of {budget.stepsMax} · {Math.round(budget.elapsedS)}s of{' '}
        {budget.maxS}s
      </Text>
    </Box>
  )
}

const BlinkingCaret = () => (
  <Box
    component="span"
    aria-hidden
    style={{
      display: 'inline-block',
      width: 7,
      height: '1em',
      marginLeft: 2,
      verticalAlign: 'text-bottom',
      background: 'currentColor',
      animation: 'coremind-caret 1s steps(1) infinite',
    }}
  />
)

/** Small icon used by the composer's Stop button. */
export const StopIcon = () => <CoreIcon icon={<IconPlayerStop />} size={16} />
