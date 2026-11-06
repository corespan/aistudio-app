import { Fragment, type ComponentType, type ReactNode } from 'react'
import { Badge, Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconArrowDown,
  IconArrowDownLeft,
  IconArrowDownRight,
  IconArrowRight,
  IconArrowUpLeft,
  IconArrowUpRight,
  IconBuildingSkyscraper,
  IconCircleCheck,
  IconCircleX,
  IconClipboardCheck,
  IconCpu,
  IconDeviceDesktop,
  IconEngine,
  IconFingerprint,
  IconGitPullRequest,
  IconHandClick,
  IconHome,
  IconId,
  IconListCheck,
  IconLock,
  IconLuggage,
  IconMessageQuestion,
  IconNotebook,
  IconPlayerPlay,
  IconRobot,
  IconRouter,
  IconServer,
  IconShieldCheck,
  IconShieldLock,
  IconSpy,
  IconTerminal2,
  IconTestPipe,
  IconTicket,
} from '@tabler/icons-react'
import type { IconProps } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'

/*
 * Native diagrams for the "Engineering, explained simply" series (the AI
 * gateway, agent sandboxes, and assistant-panel posts). Each one re-draws a
 * figure from the original HTML article with Mantine primitives instead of
 * embedding the source SVG, so they follow the app theme (light/dark), reflow
 * on narrow screens, and stay text-selectable — same approach as
 * `AgentArchitectureDiagram`.
 */

type DiagramProps = { accent: string }

type Tone = 'default' | 'accent' | 'safe' | 'danger' | 'dark'

const toneColor = (tone: Tone, accent: string) =>
  tone === 'safe' ? 'green' : tone === 'danger' ? 'red' : tone === 'dark' ? 'dark' : accent

/** One box in a diagram: icon, bold title, and a few short description lines. */
const Node = ({
  icon: Icon,
  title,
  lines = [],
  accent,
  tone = 'default',
  footer,
  miw = 150,
}: {
  icon: ComponentType<IconProps>
  title: string
  lines?: string[]
  accent: string
  tone?: Tone
  footer?: ReactNode
  miw?: number
}) => {
  const color = toneColor(tone, accent)
  const isDark = tone === 'dark'
  const highlighted = tone !== 'default'

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      miw={miw}
      style={{
        flex: 1,
        borderColor: highlighted ? `var(--mantine-color-${color}-5)` : 'var(--core-card-border)',
        background: isDark
          ? 'var(--mantine-color-dark-7)'
          : highlighted
            ? `var(--mantine-color-${color}-light)`
            : 'var(--mantine-color-body)',
      }}
    >
      <Stack gap={6} align="center" ta="center">
        <ThemeIcon
          size={30}
          radius="md"
          variant={isDark ? 'filled' : 'light'}
          color={isDark ? accent : color}
        >
          <CoreIcon icon={<Icon aria-hidden />} size={16} />
        </ThemeIcon>
        <Text size="sm" fw={700} lh={1.25} c={isDark ? 'white' : undefined}>
          {title}
        </Text>
        {lines.map((line) => (
          <Text key={line} size="xs" lh={1.35} c={isDark ? 'gray.4' : 'dimmed'}>
            {line}
          </Text>
        ))}
        {footer}
      </Stack>
    </Paper>
  )
}

/** Right-pointing connector between nodes in a row; turns downward when the row wraps on mobile. */
const Arrow = ({ label }: { label?: string }) => (
  <Stack gap={2} align="center" justify="center" style={{ flexShrink: 0 }}>
    {label && (
      <Text size="10px" c="dimmed" fs="italic">
        {label}
      </Text>
    )}
    <Box visibleFrom="sm">
      <CoreIcon
        icon={<IconArrowRight aria-hidden />}
        size={16}
        color="var(--mantine-color-dimmed)"
      />
    </Box>
    <Box hiddenFrom="sm">
      <CoreIcon
        icon={<IconArrowDown aria-hidden />}
        size={16}
        color="var(--mantine-color-dimmed)"
      />
    </Box>
  </Stack>
)

/**
 * A horizontal chain on desktop that stacks vertically on small screens.
 * Inline flex-direction can't be responsive, so the switch is two wrappers
 * toggled with Mantine's visibleFrom/hiddenFrom.
 */
const ResponsiveChain = ({ children }: { children: ReactNode }) => (
  <>
    <Box visibleFrom="sm" style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
      {children}
    </Box>
    <Stack hiddenFrom="sm" gap={8} align="stretch">
      {children}
    </Stack>
  </>
)

/** Bordered panel + optional caption, the shared frame for every diagram in the series. */
const Frame = ({ children, caption }: { children: ReactNode; caption?: string }) => (
  <Stack gap="xs">
    <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} bg="var(--core-surface-1)">
      {children}
    </Paper>
    {caption && (
      <Text size="xs" c="dimmed" ta="center" maw={620} mx="auto" lh={1.5}>
        {caption}
      </Text>
    )}
  </Stack>
)

const Outcome = ({ ok, label }: { ok: boolean; label: string }) => (
  <Badge
    size="lg"
    radius="sm"
    variant="light"
    color={ok ? 'green' : 'red'}
    leftSection={
      <CoreIcon
        icon={ok ? <IconCircleCheck aria-hidden /> : <IconCircleX aria-hidden />}
        size={14}
      />
    }
    style={{ textTransform: 'none' }}
  >
    {label}
  </Badge>
)

/* ------------------------------------------------------------------ */
/* Story 11 — Why an AI Agent Needs a Smarter Front Door               */
/* ------------------------------------------------------------------ */

const CHECKPOINTS = [
  {
    icon: IconId,
    title: 'ID check',
    lines: ['Who are you, really?', 'The person, not a shared badge'],
  },
  { icon: IconLuggage, title: 'Bag scan', lines: ['What are you actually asking to do?'] },
  { icon: IconTicket, title: 'Boarding pass', lines: ['Are you allowed through this gate?'] },
  {
    icon: IconSpy,
    title: 'Trick scan',
    lines: ['Any hidden notes or sweet-talking?', '(prompt injection)'],
    tone: 'danger' as const,
  },
  { icon: IconNotebook, title: 'Logbook', lines: ['Every step written down, for later'] },
]

export const GatewayCheckpointsDiagram = ({ accent }: DiagramProps) => (
  <Frame caption='An AI gateway checks who, what, where and whether — not just "do you have a badge."'>
    <Stack gap="md">
      <ResponsiveChain>
        <Node icon={IconRobot} title="Agent request" accent={accent} tone="accent" miw={120} />
        {CHECKPOINTS.map((step) => (
          <Fragment key={step.title}>
            <Arrow />
            <Node
              icon={step.icon}
              title={step.title}
              lines={step.lines}
              accent={accent}
              tone={step.tone ?? 'default'}
              miw={110}
            />
          </Fragment>
        ))}
      </ResponsiveChain>
      <Group justify="center" gap="md">
        <Outcome ok label="Proceed — cleared every checkpoint" />
        <Outcome ok={false} label="Turned back at any step" />
      </Group>
    </Stack>
  </Frame>
)

export const GatewayRequestFlowDiagram = ({ accent }: DiagramProps) => (
  <Frame caption="Every request is signed with the real user's identity, allowed per-tool by role, and re-checked, fenced and logged before it reaches anything real.">
    <Stack gap="md">
      <ResponsiveChain>
        <Stack gap={8} style={{ flex: 1 }} miw={150}>
          <Node
            icon={IconDeviceDesktop}
            title="Assistant in the UI"
            lines={['A person, in the product']}
            accent={accent}
          />
          <Node
            icon={IconTerminal2}
            title="Dev tools / CI"
            lines={['Claude Code, VS Code…']}
            accent={accent}
          />
        </Stack>
        <Arrow />
        <Node
          icon={IconFingerprint}
          title="① Identity proxy"
          lines={['Confirms WHO is really asking', 'Stamps a short-lived signed pass']}
          accent={accent}
          tone="accent"
        />
        <Arrow />
        <Node
          icon={IconShieldCheck}
          title="② Agent gateway"
          lines={['Per-tool permission rules by role', 'viewer ▸ operator ▸ admin']}
          accent={accent}
          tone="accent"
          footer={
            <Badge
              size="sm"
              variant="light"
              color="teal"
              radius="sm"
              style={{ textTransform: 'none' }}
            >
              Hides tools you can't use
            </Badge>
          }
        />
        <Arrow />
        <Node
          icon={IconShieldLock}
          title="③ AI Studio door"
          lines={['Re-checks the pass', 'Fences off hidden tricks', 'Writes the logbook']}
          accent={accent}
          tone="accent"
          footer={
            <Badge
              size="sm"
              variant="light"
              color="red"
              radius="sm"
              style={{ textTransform: 'none' }}
            >
              Big actions ▸ step-up
            </Badge>
          }
        />
      </ResponsiveChain>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Node
          icon={IconServer}
          title="Real infrastructure"
          lines={['GPU servers, jobs, results — only reached after all checks']}
          accent={accent}
          tone="dark"
        />
        <Node
          icon={IconLock}
          title="Step-up for risky actions"
          lines={['Password + one-time code, re-confirmed']}
          accent={accent}
          tone="danger"
        />
      </SimpleGrid>
    </Stack>
  </Frame>
)

/* ------------------------------------------------------------------ */
/* Story 12 — A Safe Place to Work, and a License to Ship              */
/* ------------------------------------------------------------------ */

const LADDER = [
  {
    icon: IconBuildingSkyscraper,
    title: 'Plain container',
    lines: ["Shares the building's foundation with everyone else"],
    verdict: 'Great for trusted code',
    verdictColor: 'green',
    tone: 'default' as const,
  },
  {
    icon: IconShieldCheck,
    title: 'Guarded container',
    lines: ['A guard sits in front and checks every request to the floor'],
    verdict: 'Much smaller blast radius',
    verdictColor: 'teal',
    tone: 'default' as const,
  },
  {
    icon: IconHome,
    title: 'Own tiny house',
    lines: ['Its own floor and walls (a lightweight virtual machine)'],
    verdict: 'Boots in a blink',
    verdictColor: 'green',
    tone: 'accent' as const,
  },
  {
    icon: IconLock,
    title: 'Locked by default',
    lines: ['Fresh room per task, no secrets can walk out the door'],
    verdict: "Where we're heading",
    verdictColor: 'teal',
    tone: 'dark' as const,
  },
]

export const IsolationLadderDiagram = ({ accent }: DiagramProps) => (
  <Frame caption="From a shared office to a locked, single-use room. The riskier the code, the further right you want to be.">
    <Stack gap="md">
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Text size="xs" fw={700} c="dimmed">
          Fastest, least separation
        </Text>
        <Box
          h={2}
          style={{
            flex: 1,
            background: `linear-gradient(90deg, var(--core-card-border), var(--mantine-color-${accent}-5))`,
          }}
        />
        <Text size="xs" fw={700} c="dimmed" ta="right">
          Slower, strongest separation
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">
        {LADDER.map((rung) => (
          <Node
            key={rung.title}
            icon={rung.icon}
            title={rung.title}
            lines={rung.lines}
            accent={accent}
            tone={rung.tone}
            footer={
              <Badge
                size="sm"
                variant="light"
                color={rung.verdictColor}
                radius="sm"
                style={{ textTransform: 'none' }}
              >
                {rung.verdict}
              </Badge>
            }
          />
        ))}
      </SimpleGrid>
    </Stack>
  </Frame>
)

export const SharedAgentEngineDiagram = ({ accent }: DiagramProps) => (
  <Frame caption="The sandbox bounds what an agent can do; the gateway (see the previous story) bounds what it can reach.">
    <ResponsiveChain>
      <Stack gap={8} style={{ flex: 1.2 }} miw={180}>
        <Group gap={6} justify="center">
          {['agents', 'tools', 'models'].map((plugin) => (
            <Badge
              key={plugin}
              variant="outline"
              color="gray"
              radius="sm"
              style={{ textTransform: 'none' }}
            >
              {plugin}
            </Badge>
          ))}
        </Group>
        <Text size="10px" c="dimmed" ta="center" fs="italic">
          plugged in as config, not new plumbing
        </Text>
        <Node
          icon={IconEngine}
          title="Shared agent engine"
          lines={['One proven core for every product']}
          accent={accent}
          tone="accent"
        />
      </Stack>
      <Arrow label="spawns" />
      <Stack gap={8} style={{ flex: 1 }} miw={160}>
        {[['One job · own room'], ['Narrow contract'], ['Least privilege']].map((lines) => (
          <Node
            key={lines[0]}
            icon={IconLock}
            title="Sub-agent"
            lines={lines}
            accent="teal"
            tone="accent"
          />
        ))}
      </Stack>
      <Arrow />
      <Node
        icon={IconShieldCheck}
        title="Gateway in front"
        lines={['Bounds the traffic']}
        accent={accent}
        tone="dark"
      />
    </ResponsiveChain>
  </Frame>
)

export const ReleaseGateDiagram = ({ accent }: DiagramProps) => (
  <Frame caption="No agent ships until it passes — automatically, on every change and every release.">
    <ResponsiveChain>
      <Node
        icon={IconGitPullRequest}
        title="Proposed change"
        lines={['to an agent']}
        accent={accent}
      />
      <Arrow />
      <Node
        icon={IconTestPipe}
        title="Evaluation (the test)"
        lines={[
          '▸ replays multi-step journeys',
          '▸ scores each step on a rubric',
          '▸ fires trick messages at it',
          'runs in a sandbox, every time',
        ]}
        accent={accent}
        tone="accent"
        miw={190}
      />
      <Arrow />
      <Node
        icon={IconClipboardCheck}
        title="Hard gates"
        lines={['0 unsafe tool calls', '0 injection actions', 'PR gate + release gate']}
        accent={accent}
        tone="danger"
      />
      <Arrow />
      <Stack gap={8} justify="center" style={{ flex: 1 }} miw={140}>
        <Outcome ok label="Ships" />
        <Outcome ok={false} label="Blocked" />
      </Stack>
    </ResponsiveChain>
  </Frame>
)

/* ------------------------------------------------------------------ */
/* Story 13 — The AI Assistant That Asks Before It Acts                */
/* ------------------------------------------------------------------ */

export const ProposeApproveRunDiagram = ({ accent }: DiagramProps) => (
  <Frame caption="You're always in the loop. Ordinary steps need one approval; the dangerous ones need you to prove it's really you, twice.">
    <Stack gap="md">
      <ResponsiveChain>
        <Node
          icon={IconMessageQuestion}
          title="You ask"
          lines={['"why is node 3 slow?"']}
          accent={accent}
        />
        <Arrow />
        <Node
          icon={IconListCheck}
          title="Assistant proposes a plan"
          lines={['1 · read GPU + link stats', '2 · check the fabric', '3 · suggest a fix']}
          accent={accent}
          tone="accent"
          miw={180}
        />
        <Arrow />
        <Node
          icon={IconHandClick}
          title="You approve"
          lines={['one click: "go"']}
          accent={accent}
          tone="safe"
        />
        <Arrow />
        <Node
          icon={IconPlayerPlay}
          title="It runs"
          lines={['results stream live']}
          accent={accent}
        />
        <Arrow />
        <Node icon={IconDeviceDesktop} title="Live view" accent={accent} tone="dark" miw={110} />
      </ResponsiveChain>

      <Group justify="center">
        <Box maw={460} w="100%">
          <Node
            icon={IconLock}
            title="Risky action? A second lock."
            lines={[
              'Power off a node, or take a pooled machine apart —',
              're-confirm with your password AND a one-time code before anything happens.',
            ]}
            accent={accent}
            tone="danger"
          />
        </Box>
      </Group>
    </Stack>
  </Frame>
)

/** The pair of diagonal switch↔host links in the fabric view (icons, not Unicode arrows, which some fonts render as emoji). */
const FabricLinks = ({
  left: Left,
  right: Right,
}: {
  left: ComponentType<IconProps>
  right: ComponentType<IconProps>
}) => (
  <Group gap={80} justify="center" wrap="nowrap" c="teal">
    <Group gap={4} wrap="nowrap">
      <CoreIcon icon={<Left aria-hidden />} size={14} />
      <Text size="10px">link</Text>
    </Group>
    <Group gap={4} wrap="nowrap">
      <Text size="10px">link</Text>
      <CoreIcon icon={<Right aria-hidden />} size={14} />
    </Group>
  </Group>
)

const GPU_SLOTS = Array.from({ length: 8 }, (_, index) => `GPU ${index}`)

export const TopologyViewsDiagram = ({ accent }: DiagramProps) => (
  <Frame
    caption={`Host view answers "what's inside this machine?" Fabric view answers "how are the machines wired together?" Both draw themselves.`}
  >
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      {/* Host view */}
      <Stack gap={6}>
        <Text fw={700} size="sm">
          Host view
        </Text>
        <Text size="xs" c="dimmed">
          One server's cards &amp; GPUs, exactly as that machine sees them — works on any host
        </Text>
        <Paper
          withBorder
          radius="md"
          p="sm"
          style={{ borderColor: `var(--mantine-color-${accent}-5)` }}
        >
          <Group gap={6} mb="xs">
            <CoreIcon icon={<IconServer aria-hidden />} size={14} />
            <Text size="xs" fw={700}>
              Server · 8 GPUs
            </Text>
          </Group>
          <SimpleGrid cols={4} spacing={6}>
            {GPU_SLOTS.map((gpu) => (
              <Paper
                key={gpu}
                radius="sm"
                p={6}
                bg={`var(--mantine-color-${accent}-light)`}
                ta="center"
              >
                <Group gap={4} justify="center" wrap="nowrap">
                  <CoreIcon icon={<IconCpu aria-hidden />} size={12} />
                  <Text size="xs" fw={700}>
                    {gpu}
                  </Text>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
        <Text size="10px" c="dimmed" fs="italic">
          (8 or 16 cards — whatever the host actually has)
        </Text>
      </Stack>

      {/* Fabric view */}
      <Stack gap={6}>
        <Text fw={700} size="sm">
          Fabric view
        </Text>
        <Text size="xs" c="dimmed">
          How the switches wire the machines together
        </Text>
        <Paper withBorder radius="md" p="sm" style={{ borderColor: 'var(--mantine-color-teal-5)' }}>
          <Stack gap={6} align="center">
            <Node icon={IconRouter} title="NT2 switch" accent="teal" tone="accent" miw={130} />
            <FabricLinks left={IconArrowDownLeft} right={IconArrowDownRight} />
            <Group gap="sm" justify="space-between" w="100%" wrap="nowrap">
              <Node icon={IconServer} title="Host A" accent="teal" miw={100} />
              <Text size="10px" c="dimmed" fs="italic" ta="center">
                switch-to-switch
              </Text>
              <Node icon={IconServer} title="Host B" accent="teal" miw={100} />
            </Group>
            <FabricLinks left={IconArrowUpLeft} right={IconArrowUpRight} />
            <Node icon={IconRouter} title="NT2 switch" accent="teal" tone="accent" miw={130} />
          </Stack>
        </Paper>
        <Text size="10px" c="dimmed" fs="italic">
          Needs the detailed fabric reader switched on in the host agent
        </Text>
      </Stack>
    </SimpleGrid>
  </Frame>
)
