import type { ComponentType, ReactNode } from 'react'
import { Badge, Box, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconAdjustmentsHorizontal,
  IconArrowDown,
  IconBan,
  IconBrain,
  IconCloudDownload,
  IconCornerRightDown,
  IconDatabase,
  IconFileText,
  IconMessageCircle,
  IconPuzzle,
  IconRobot,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconTool,
  IconTopologyStar3,
  IconUser,
  IconWand,
} from '@tabler/icons-react'
import type { IconProps } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'

type FlowVariant = 'default' | 'decision' | 'terminal' | 'store'

/** One box in the flow — same bordered-Paper + ThemeIcon language as the
 * About page's platform-evolution stage boxes, just sized for a standalone
 * diagram instead of an inline pipeline row. */
const FlowNode = ({
  icon: Icon,
  label,
  color,
  variant = 'default',
  w = 220,
}: {
  icon: ComponentType<IconProps>
  label: string
  color: string
  variant?: FlowVariant
  w?: number
}) => (
  <Paper
    withBorder
    radius={variant === 'store' ? 'xl' : 'md'}
    p="sm"
    w={w}
    mx="auto"
    style={{
      borderColor:
        variant === 'decision' ? `var(--mantine-color-${color}-5)` : 'var(--core-card-border)',
      borderWidth: variant === 'decision' ? 2 : 1,
      background: variant === 'terminal' ? 'var(--core-surface-1)' : 'var(--mantine-color-body)',
      opacity: variant === 'terminal' ? 0.85 : 1,
    }}
  >
    <Group gap={8} wrap="nowrap" justify="center">
      <ThemeIcon size={26} radius="md" variant="light" color={color} style={{ flexShrink: 0 }}>
        <CoreIcon icon={<Icon />} size={14} />
      </ThemeIcon>
      <Text size="xs" fw={700} ta="center" lh={1.25}>
        {label}
      </Text>
    </Group>
  </Paper>
)

/** A short vertical connector, with an optional edge label (e.g. "On-topic"). */
const FlowArrow = ({ label, color = 'gray' }: { label?: string; color?: string }) => (
  <Stack gap={4} align="center" py={2}>
    {label && (
      <Badge size="xs" variant="light" color={color} radius="sm">
        {label}
      </Badge>
    )}
    <CoreIcon icon={<IconArrowDown />} size={13} color="var(--mantine-color-dimmed)" />
  </Stack>
)

/** Two branches side by side, each hanging off the same decision node above. */
const FlowBranch = ({ children }: { children: ReactNode }) => (
  <Group align="flex-start" justify="center" gap="lg" wrap="wrap">
    {children}
  </Group>
)

const LaneHeader = ({
  icon: Icon,
  title,
  color,
}: {
  icon: ComponentType<IconProps>
  title: string
  color: string
}) => (
  <Stack gap={6} mb="xs">
    <Group gap={8} wrap="nowrap">
      <ThemeIcon
        size={28}
        radius="md"
        variant="gradient"
        gradient={{ from: color, to: `${color}.8`, deg: 135 }}
      >
        <CoreIcon icon={<Icon />} size={15} />
      </ThemeIcon>
      <Title order={4} fz={15} fw={700}>
        {title}
      </Title>
    </Group>
    <Box
      h={3}
      w={56}
      style={{
        borderRadius: 999,
        background: `linear-gradient(90deg, var(--mantine-color-${color}-5), transparent)`,
      }}
    />
  </Stack>
)

/**
 * Native flow diagram for the AI Assistant's architecture — built the same
 * way the About page's platform-evolution diagram is (bordered stage boxes,
 * ThemeIcon + arrows, no external image), just laid out as two vertical
 * lanes with branches instead of one horizontal chain.
 */
export const AgentArchitectureDiagram = ({ accent }: { accent: string }) => (
  <Paper withBorder radius="lg" p={{ base: 'md', sm: 'xl' }} style={{ overflowX: 'auto' }}>
    <Group align="flex-start" gap="xl" wrap="wrap" justify="center">
      {/* Execution Flow (Agent) */}
      <Stack gap={0} miw={260}>
        <LaneHeader icon={IconRobot} title="Execution Flow (Agent)" color={accent} />

        <FlowNode icon={IconUser} label="User / Browser Context" color={accent} />
        <FlowArrow />
        <FlowNode icon={IconRobot} label="Agent" color={accent} />
        <FlowArrow />
        <FlowNode icon={IconShieldCheck} label="Guardrail Node" color="orange" variant="decision" />

        <FlowBranch>
          <Stack gap={0} align="center">
            <FlowArrow label="Off-topic" color="gray" />
            <FlowNode icon={IconBan} label="Refuse Response" color="gray" variant="terminal" />
          </Stack>
          <Stack gap={0} align="center">
            <FlowArrow label="On-topic" color={accent} />
            <FlowNode icon={IconSearch} label="Mandatory Retrieval Node" color={accent} />
          </Stack>
        </FlowBranch>

        <FlowArrow />
        <FlowNode
          icon={IconAdjustmentsHorizontal}
          label="Hybrid Retriever: Dense + Sparse + Rerank"
          color={accent}
        />
        <FlowArrow />
        <FlowNode
          icon={IconBrain}
          label="Agent Logic Node: LLM Reasoning"
          color="orange"
          variant="decision"
        />

        <FlowBranch>
          <Stack gap={4} align="center">
            <FlowArrow label="Needs Detail" color="gray" />
            <FlowNode icon={IconTool} label="Tool Call: Graph/Search" color={accent} />
            <Group gap={4} wrap="nowrap" mt={2}>
              <CoreIcon
                icon={<IconCornerRightDown />}
                size={12}
                color="var(--mantine-color-dimmed)"
              />
              <Text size="9px" c="dimmed" fs="italic">
                loops back to Hybrid Retriever
              </Text>
            </Group>
          </Stack>
          <Stack gap={0} align="center">
            <FlowArrow label="Sufficient" color={accent} />
            <FlowNode icon={IconSparkles} label="Final Generator Node" color={accent} />
            <FlowArrow />
            <FlowNode
              icon={IconMessageCircle}
              label="Streaming Response"
              color={accent}
              variant="terminal"
            />
          </Stack>
        </FlowBranch>
      </Stack>

      {/* Ingestion Pipeline */}
      <Stack gap={0} miw={260}>
        <LaneHeader icon={IconDatabase} title="Ingestion Pipeline" color="cyan" />

        <FlowNode icon={IconCloudDownload} label="Sources: Bitbucket, Web, Local" color="cyan" />
        <FlowArrow />
        <FlowNode icon={IconFileText} label="Document Loaders" color="cyan" />
        <FlowArrow />
        <FlowNode icon={IconPuzzle} label="Semantic Chunker" color="cyan" />
        <FlowArrow />
        <FlowNode icon={IconWand} label="LLM Enrichment: Entities + Perspective" color="cyan" />

        <FlowBranch>
          <Stack gap={0} align="center">
            <FlowArrow />
            <FlowNode
              icon={IconAdjustmentsHorizontal}
              label="Hybrid Embedding: Dense + Sparse"
              color="cyan"
            />
            <FlowArrow />
            <FlowNode icon={IconDatabase} label="Qdrant Vector DB" color="cyan" variant="store" />
          </Stack>
          <Stack gap={0} align="center">
            <FlowArrow />
            <FlowNode icon={IconTopologyStar3} label="Graph Relations" color="cyan" />
            <FlowArrow />
            <FlowNode icon={IconDatabase} label="Memgraph Graph DB" color="cyan" variant="store" />
          </Stack>
        </FlowBranch>
      </Stack>
    </Group>

    <Group
      gap={8}
      wrap="nowrap"
      mt="lg"
      pt="md"
      style={{ borderTop: '1px dashed var(--core-card-border)' }}
    >
      <CoreIcon
        icon={<IconArrowDown style={{ transform: 'rotate(-90deg)' }} />}
        size={14}
        color="dimmed"
      />
      <Text size="xs" c="dimmed">
        At query time, the <strong>Hybrid Retriever</strong> reads straight from the{' '}
        <strong>Qdrant Vector DB</strong> and follows relationships in the{' '}
        <strong>Memgraph Graph DB</strong> — the two stores ingestion built on the right.
      </Text>
    </Group>
  </Paper>
)
