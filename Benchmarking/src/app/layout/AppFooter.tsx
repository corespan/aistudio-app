import { Anchor, Box, Button, Container, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBrandGithub, IconChartBar } from '@tabler/icons-react'

const REPO_URL = 'https://github.com/corespan/aistudio-app'
const BRAND_GRADIENT = { from: 'indigo', to: 'cyan', deg: 135 } as const

type FooterLink = { label: string; href: string; external?: boolean }

const LINK_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Main Site', href: 'https://www.corespan.ai', external: true },
      { label: 'Composer', href: 'https://www.corespancomposer.com', external: true },
      { label: 'AI Studio', href: '/aistudio' },
    ],
  },
  {
    title: 'Benchmarks',
    links: [
      { label: 'Run a Benchmark', href: '/aistudio' },
      { label: 'Performance per Dollar', href: '/aistudio' },
      { label: 'GPU Reliability', href: '/aistudio' },
    ],
  },
  {
    title: 'Contribute',
    links: [
      { label: 'Source Code', href: REPO_URL, external: true },
      { label: 'Report an Issue', href: `${REPO_URL}/issues`, external: true },
    ],
  },
]

const FooterAnchor = ({ label, href, external }: FooterLink) => (
  <Anchor
    href={href}
    c="dimmed"
    size="sm"
    underline="hover"
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
  >
    {label}
  </Anchor>
)

/**
 * Shared site footer rendered at the end of the page scroll (via PageShell), so
 * scrolling stays natural and the footer isn't a fixed bar. A single row: gradient
 * brand mark, link columns, and a GitHub CTA. Mantine components/props only.
 */
export const AppFooter = () => (
  <Box component="footer" bg="var(--core-surface-0)">
    <Divider />
    <Container fluid px="xl" py="lg">
      <Group align="center" justify="space-between" wrap="wrap" gap="xl">
        {/* Brand */}
        <Stack gap={6} maw={300}>
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={38} radius="md" variant="gradient" gradient={BRAND_GRADIENT}>
              <IconChartBar size={22} stroke={1.9} />
            </ThemeIcon>
            <Text fw={800} fz={22} variant="gradient" gradient={BRAND_GRADIENT}>
              AI Studio
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Open, reproducible AI inference benchmarking with auditable, real-world data.
          </Text>
        </Stack>

        {/* Link columns */}
        <Group align="flex-start" gap={56} wrap="wrap">
          {LINK_COLUMNS.map((col) => (
            <Stack key={col.title} gap={8}>
              <Text size="sm" fw={700} tt="uppercase" c="dimmed">
                {col.title}
              </Text>
              {col.links.map((link) => (
                <FooterAnchor key={link.label} {...link} />
              ))}
            </Stack>
          ))}
        </Group>

        {/* Call to action */}
        <Stack gap="sm" maw={260}>
          <Button
            component="a"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="gradient"
            gradient={BRAND_GRADIENT}
            leftSection={<IconBrandGithub size={16} />}
          >
            Star on GitHub
          </Button>
          <Text size="xs" c="dimmed">
            If this data helps your work, consider starring the repo or sharing it.
          </Text>
        </Stack>
      </Group>
    </Container>
  </Box>
)
