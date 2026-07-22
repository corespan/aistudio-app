import type { ComponentType } from 'react'
import { Badge, Box, Card, Flex, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconBolt,
  IconChartDots,
  IconCloudNetwork,
  IconCpu,
  IconDatabase,
  IconGauge,
  IconServerBolt,
  type IconProps,
} from '@tabler/icons-react'

const BRAND_GRADIENT = { from: 'indigo', to: 'cyan', deg: 135 } as const

const HIGHLIGHTS = [
  { label: 'Multi-node orchestration', icon: IconCloudNetwork },
  { label: 'Real-time metrics', icon: IconBolt },
  { label: 'GPU-aware scheduling', icon: IconServerBolt },
]

const ORBIT_ICONS = [IconCloudNetwork, IconDatabase, IconChartDots, IconServerBolt]

type StatTileProps = {
  icon: ComponentType<IconProps>
  label: string
  value: string
  delta?: string
}

/** Compact stat tile — icon, label, value, and an optional trend badge. */
const StatTile = ({ icon: Icon, label, value, delta }: StatTileProps) => (
  <Paper withBorder radius="md" p="md" ta="center">
    <ThemeIcon variant="light" color="cyan" size={36} radius="md" mx="auto" mb="xs">
      <Icon size={18} />
    </ThemeIcon>
    <Text size="9px" fw={700} tt="uppercase" c="dimmed">
      {label}
    </Text>
    <Group justify="center" gap={6} mt={2}>
      <Text fw={800} fz={18}>
        {value}
      </Text>
      {delta && (
        <Badge color="teal" variant="light" size="xs" radius="sm">
          {delta}
        </Badge>
      )}
    </Group>
  </Paper>
)

/**
 * Hero banner for the About Us page: badge, headline, copy, and highlight
 * chips on the left; a gradient core icon ringed by service icons and three
 * stat tiles on the right. Built entirely from Mantine components/props and
 * Tabler icons — no custom SVG art, no inline styles.
 */
export const AboutHero = () => (
  <Card withBorder radius="lg" shadow="sm" p="xl">
    <Flex gap="xl" align="center" wrap="wrap">
      <Box flex={7} miw={280}>
        <Stack gap="md">
          <Badge variant="light" color="indigo" radius="sm" size="sm" w="fit-content" tt="uppercase">
            About AI Studio
          </Badge>

          <Text fw={800} fz={38} lh={1.15}>
            Benchmarking AI Infrastructure at{' '}
            <Text component="span" inherit variant="gradient" gradient={BRAND_GRADIENT}>
              Enterprise Scale
            </Text>
          </Text>

          <Text size="sm" c="dimmed" maw={460}>
            AI Studio delivers the most comprehensive benchmarking platform for AI infrastructure.
            We help enterprise teams make data-driven decisions with real-world performance
            insights.
          </Text>

          <Group gap="xs" mt={4}>
            {HIGHLIGHTS.map((item) => (
              <Badge
                key={item.label}
                variant="default"
                radius="sm"
                size="lg"
                tt="none"
                fw={500}
                leftSection={<item.icon size={14} />}
              >
                {item.label}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Box>

      <Box flex={5} miw={260}>
        <Stack gap="lg">
          <Group justify="center" gap="md">
            <ThemeIcon size={84} radius="xl" variant="gradient" gradient={BRAND_GRADIENT}>
              <IconCpu size={42} />
            </ThemeIcon>
            {ORBIT_ICONS.map((Icon, i) => (
              <ThemeIcon key={i} size={40} radius="xl" variant="light" color="cyan">
                <Icon size={20} />
              </ThemeIcon>
            ))}
          </Group>

          <SimpleGrid cols={3} spacing="sm">
            <StatTile icon={IconServerBolt} label="Cluster Nodes" value="128" delta="+12%" />
            <StatTile icon={IconBolt} label="Throughput" value="2.41K" />
            <StatTile icon={IconGauge} label="GPU Utilization" value="87%" />
          </SimpleGrid>
        </Stack>
      </Box>
    </Flex>
  </Card>
)
