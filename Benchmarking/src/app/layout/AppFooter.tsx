import { Box, Button, Container, Group, Paper, Text, ThemeIcon } from '@mantine/core'
import { IconBrandGithub, IconChartBar, IconStar } from '@tabler/icons-react'

const REPO_URL = 'https://github.com/corespan/aistudio-app'
// Height of the visible gap above the footer bar — matches the page's own
// background so it reads as breathing room, not part of the footer itself.
const TOP_GAP = 12

/**
 * Shared site footer rendered as a fixed `AppShell.Footer` bar spanning the
 * full screen width (including under the sidebar) — it does not scroll with
 * the page content above it. A small page-colored gap sits above the bordered
 * footer bar for visual separation from the content above. Kept deliberately
 * plain: brand mark on the left, a simple "Star us on GitHub" callout on the
 * right — no gradients, no extra chrome. Mantine props only.
 */
export const AppFooter = () => (
  <Box h="100%" bg="var(--core-surface-1)">
    <Box h={TOP_GAP} />
    <Paper
      component="footer"
      w="100%"
      h={`calc(100% - ${TOP_GAP}px)`}
      radius={0}
      withBorder
      bg="var(--core-surface-0)"
    >
      <Container fluid h="100%" px="xl">
      <Group h="100%" justify="space-between" align="center" wrap="wrap" gap="md">
        {/* Brand */}
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={28} radius="md" variant="light" color="indigo">
            <IconChartBar size={16} stroke={1.9} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} AI Studio
          </Text>
        </Group>

        {/* Star on GitHub */}
        <Group gap="sm" wrap="nowrap">
          <Text size="sm" c="dimmed" visibleFrom="sm">
            Find this useful?
          </Text>
          <Button
            component="a"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            size="xs"
            leftSection={<IconBrandGithub size={15} />}
            rightSection={<IconStar size={13} />}
          >
            Star us on GitHub
          </Button>
        </Group>
      </Group>
      </Container>
    </Paper>
  </Box>
)
