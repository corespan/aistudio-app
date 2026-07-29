import { Badge, Box, Card, Flex, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBolt, IconCpu, IconGauge, IconServerBolt } from '@tabler/icons-react'
import { StatTile } from './StatTile'
import { BRAND_GRADIENT, HIGHLIGHTS, ORBIT_ICONS } from '../constants'
import { CoreIcon } from '@/shared/ui'

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
          <Badge
            variant="light"
            color="indigo"
            radius="sm"
            size="sm"
            w="fit-content"
            tt="uppercase"
          >
            About AI Studio
          </Badge>

          <Text fw={800} fz={38} lh={1.15}>
            AI Orchestration Infrastructure at{' '}
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
                leftSection={<CoreIcon icon={<item.icon />} size={14} />}
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
              <CoreIcon icon={<IconCpu />} size={42} />
            </ThemeIcon>
            {ORBIT_ICONS.map((Icon, i) => (
              <ThemeIcon key={i} size={40} radius="xl" variant="light" color="cyan">
                <CoreIcon icon={<Icon />} size={20} />
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
