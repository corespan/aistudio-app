import type { ComponentType } from 'react'
import { Badge, Box, Flex, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconAdjustmentsHorizontal,
  IconArrowRight,
  IconBrain,
  IconChartDots,
  IconCpu,
  IconDatabase,
  IconRocket,
  IconRoute,
  IconServer,
  IconSitemap,
  IconStack2,
  IconUser,
  IconWorld,
  type IconProps,
} from '@tabler/icons-react'

type Stage = {
  icon: ComponentType<IconProps>
  label: string
  /** Small chips rendered inside the stage box for multi-part stages (e.g. GPU x4). */
  sub?: string[]
}

type Version = {
  badge: string
  title: string
  description: string
  icon: ComponentType<IconProps>
  stages: Stage[]
}

const VERSIONS: Version[] = [
  {
    badge: 'Version 1',
    title: 'Foundation',
    description: 'Single-node benchmarking with core AI workloads and basic metrics.',
    icon: IconDatabase,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconRoute, label: 'API Gateway' },
      { icon: IconAdjustmentsHorizontal, label: 'Scheduler' },
      { icon: IconServer, label: 'Worker Node', sub: ['GPU'] },
      { icon: IconDatabase, label: 'Metrics Store' },
    ],
  },
  {
    badge: 'Version 2',
    title: 'Scale & Orchestration',
    description: 'Multi-node orchestration with parallel workloads and advanced reporting.',
    icon: IconStack2,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconRoute, label: 'API Gateway' },
      { icon: IconSitemap, label: 'Orchestrator', sub: ['Scheduler', 'Allocator'] },
      { icon: IconServer, label: 'Worker Nodes', sub: ['GPU', 'GPU', 'GPU', 'GPU'] },
      { icon: IconDatabase, label: 'Metrics Store' },
    ],
  },
  {
    badge: 'Version 3',
    title: 'Intelligence & Optimization',
    description: 'AI-powered insights, GPU-aware scheduling, and cost performance modeling.',
    icon: IconBrain,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconRoute, label: 'API Gateway' },
      { icon: IconBrain, label: 'AI Engine' },
      { icon: IconAdjustmentsHorizontal, label: 'Smart Scheduler' },
      { icon: IconCpu, label: 'GPU Pool', sub: ['GPU', 'GPU', 'GPU', 'GPU'] },
      { icon: IconDatabase, label: 'Metrics Store', sub: ['Feature Store'] },
    ],
  },
  {
    badge: 'Future Vision',
    title: 'Autonomous Infrastructure',
    description: 'Self-optimizing infrastructure with autonomous scaling and remediation.',
    icon: IconRocket,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconBrain, label: 'Intelligent Control Plane', sub: ['Predict', 'Decide', 'Act'] },
      { icon: IconWorld, label: 'Global Orchestrator' },
      { icon: IconCpu, label: 'Dynamic GPU Fabric', sub: ['GPU', 'GPU', 'GPU', 'GPU', 'GPU'] },
      { icon: IconChartDots, label: 'Observability', sub: ['Data Lake'] },
    ],
  },
]

const StageBox = ({ icon: Icon, label, sub }: Stage) => (
  <Paper withBorder radius="sm" p="xs" style={{ flexShrink: 0 }}>
    <Group gap={6} wrap="nowrap">
      <ThemeIcon size="sm" variant="light" color="indigo" radius="sm">
        <Icon size={13} />
      </ThemeIcon>
      <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </Group>
    {sub && (
      <Group gap={4} mt={6} wrap="wrap" maw={140}>
        {sub.map((s, i) => (
          <Badge key={`${s}-${i}`} size="xs" variant="default" radius="sm" style={{ fontWeight: 500 }}>
            {s}
          </Badge>
        ))}
      </Group>
    )}
  </Paper>
)

const PipelineDiagram = ({ stages }: { stages: Stage[] }) => (
  <Paper withBorder radius="md" p="md" style={{ overflowX: 'auto' }}>
    <Group gap={6} wrap="nowrap" align="center">
      {stages.map((stage, i) => (
        <Group key={stage.label} gap={6} wrap="nowrap" align="center">
          <StageBox {...stage} />
          {i < stages.length - 1 && <IconArrowRight size={16} color="var(--mantine-color-dimmed)" />}
        </Group>
      ))}
    </Group>
  </Paper>
)

const VersionRow = ({ version }: { version: Version }) => (
  <Stack gap="md">
    <Flex gap="lg" align="flex-start" wrap="nowrap">
      <ThemeIcon size={44} radius="md" variant="light" color="indigo" flex="0 0 auto" pos="relative" style={{ zIndex: 1 }}>
        <version.icon size={22} />
      </ThemeIcon>

      <Stack gap={2}>
        <Text size="xs" fw={700} c="indigo" tt="uppercase">
          {version.badge}
        </Text>
        <Title order={3} fz={18}>
          {version.title}
        </Title>
        <Text size="xs" c="dimmed">
          {version.description}
        </Text>
      </Stack>
    </Flex>

    <Box pl={60}>
      <PipelineDiagram stages={version.stages} />
    </Box>
  </Stack>
)

/**
 * "Platform Evolution" section for the About Us page: a vertical timeline of
 * releases, each paired with a schematic pipeline diagram built entirely from
 * Mantine components/icons (no images) so wording and structure stay editable.
 */
export const PlatformEvolutionTimeline = () => (
  <Stack gap="xl">
    <Stack gap={4}>
      <Title order={2} fz={26}>
        Platform Evolution
      </Title>
      <Text size="sm" c="dimmed">
        From a single terminal script to a fully automated, self-reporting benchmarking platform.
      </Text>
    </Stack>

    <Box style={{ position: 'relative' }}>
      {/* Continuous vertical line behind the version marker icons. */}
      <Box
        pos="absolute"
        top={22}
        bottom={22}
        left={21}
        w={2}
        style={{ background: 'var(--mantine-color-indigo-6)', opacity: 0.3, zIndex: 0 }}
      />
      <Stack gap="xl">
        {VERSIONS.map((version) => (
          <VersionRow key={version.badge} version={version} />
        ))}
      </Stack>
    </Box>
  </Stack>
)
