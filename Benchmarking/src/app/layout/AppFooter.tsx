import { Box, Button, Container, Group, Text, ThemeIcon } from '@mantine/core'
import { IconBrandGithub, IconChartBar, IconStar } from '@tabler/icons-react'

const REPO_URL = 'https://github.com/corespan/aistudio-app'
// Height of the visible gap above the footer bar — matches the page's own
// background so it reads as breathing room, not part of the footer itself.
const TOP_GAP = 12

/**
 * Fixed AppShell.Footer bar spanning the full screen width, including under
 * the sidebar — it does not scroll with page content. A small page-colored
 * gap sits above the footer bar, separating it from the content above by
 * spacing alone (no divider line). Kept deliberately plain: brand mark on
 * the left, a simple "Star us on GitHub" callout on the right, no gradients
 * or extra chrome.
 */
export const AppFooter = () => (
  <Box h="100%" bg="var(--core-surface-1)">
    <Box h={TOP_GAP} />
    <Box component="footer" h={`calc(100% - ${TOP_GAP}px)`} bg="var(--core-surface-0)">
      <Container fluid h="100%" px="xl">
        <Group h="100%" justify="space-between" align="center" wrap="nowrap" gap="md">
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon size={28} radius="md" variant="light" color="indigo">
              <IconChartBar size={16} stroke={1.9} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} AI Studio
            </Text>
          </Group>

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
    </Box>
  </Box>
)
