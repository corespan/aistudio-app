import { Anchor, Box, Button, Container, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBrandGithub, IconChartBar, IconStar } from '@tabler/icons-react'

const REPO_URL = 'https://github.com/corespan/aistudio-app'
const BRAND_GRADIENT = { from: 'indigo', to: 'cyan', deg: 135 } as const

/**
 * Shared site footer rendered as a fixed `AppShell.Footer` bar, pinned to the
 * bottom of the viewport (does not scroll with page content). A single row:
 * gradient brand mark and a GitHub CTA. Mantine components/props only.
 */
export const AppFooter = () => (
  <Box component="footer" h="100%" bg="var(--core-surface-0)">
    <Container fluid h="100%" px="xl">
      <Group h="100%" align="center" justify="space-between" wrap="wrap" gap="xl">
        {/* Brand */}
        <Stack gap={6} maw={300}>
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={38} radius="md" variant="gradient" gradient={BRAND_GRADIENT}>
              <IconChartBar size={22} stroke={1.9} />
            </ThemeIcon>
            <Text fw={600} size="xl">
              AI Studio
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Open, reproducible AI inference benchmarking with auditable, real-world data.
          </Text>
        </Stack>

        {/* GitHub call to action */}
        <Stack gap={8} align="flex-end">
          <Button
            component="a"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            radius="md"
            leftSection={<IconBrandGithub size={18} />}
            rightSection={<IconStar size={15} />}
          >
            Star on GitHub
          </Button>
          <Anchor
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            c="dimmed"
            size="xs"
            underline="hover"
          >
            corespan/aistudio-app
          </Anchor>
        </Stack>
      </Group>
    </Container>
  </Box>
)
