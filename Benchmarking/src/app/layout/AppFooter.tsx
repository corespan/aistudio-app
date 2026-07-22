import { Anchor, Box, Button, Container, Group, Text, ThemeIcon } from '@mantine/core'
import { IconBrandGithub, IconChartBar } from '@tabler/icons-react'

const REPO_URL = 'https://github.com/corespan/aistudio-app'
const BRAND_GRADIENT = { from: 'indigo', to: 'cyan', deg: 135 } as const

export const AppFooter = () => (
  <Box component="footer" h="100%" bg="var(--core-surface-0)" style={{ borderTop: '1px solid var(--app-shell-border-color)' }}>
    <Container fluid h="100%" px="xl">
      <Group h="100%" justify="space-between" align="center" wrap="nowrap" gap="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={34} radius="md" variant="gradient" gradient={BRAND_GRADIENT}>
            <IconChartBar size={18} stroke={1.9} />
          </ThemeIcon>
          <Box>
            <Text fw={800} fz={16} lh={1.1}>
              AI Studio
            </Text>
            <Text size="xs" c="dimmed" lh={1.1}>
              © {new Date().getFullYear()} Corespan
            </Text>
          </Box>
        </Group>

        <Group gap="lg" visibleFrom="sm" wrap="nowrap">
          <Anchor href="https://www.corespan.ai" c="dimmed" underline="hover" size="sm" target="_blank" rel="noopener noreferrer">
            Website
          </Anchor>
          <Anchor href="https://www.corespancomposer.com" c="dimmed" underline="hover" size="sm" target="_blank" rel="noopener noreferrer">
            Composer
          </Anchor>
          <Anchor href={REPO_URL} c="dimmed" underline="hover" size="sm" target="_blank" rel="noopener noreferrer">
            GitHub
          </Anchor>
        </Group>

        <Button
          component="a"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="gradient"
          gradient={BRAND_GRADIENT}
          size="xs"
          leftSection={<IconBrandGithub size={15} />}
        >
          Star on GitHub
        </Button>
      </Group>
    </Container>
  </Box>
)
