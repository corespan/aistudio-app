import { Anchor, Box, Button, Container, Group, Text, ThemeIcon } from '@mantine/core'
import { IconBrandGithub, IconChartBar, IconStar } from '@tabler/icons-react'
import { LICENCES_URL, REPO_URL } from '@/app/constants'
import { CoreIcon } from '@/shared/ui'

/**
 * Fixed AppShell.Footer bar spanning the full screen width, including under
 * the sidebar — it does not scroll with page content. The bar carries no
 * surface of its own: it sits on the same page color as the content above,
 * with no divider line or contrasting fill. Kept deliberately plain: brand
 * mark on the left, a "Star us on GitHub" callout on the right, no gradients
 * or extra chrome.
 */
export const AppFooter = () => (
  <Box component="footer" h="100%" bg="var(--core-surface-1)">
    <Container fluid h="100%" px="xl">
      <Group h="100%" justify="space-between" align="center" wrap="nowrap" gap="md">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={28} radius="md" variant="light" color="indigo">
            <CoreIcon icon={<IconChartBar stroke={1.9} />} size={16} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} AI Studio
          </Text>
          {/*
            Attribution for the bundled open-source packages. This link is the
            mechanism by which the notices actually reach the person receiving
            the bundle — MIT, BSD, ISC and OFL all require the copyright notice
            to accompany a distributed copy, and esbuild strips comments during
            minification, so nothing survives inside the JS itself.

            Deliberately NOT `visibleFrom="sm"`, unlike the GitHub callout to
            the right. A mobile visitor receives exactly the same bundle as a
            desktop one, so hiding the link below the breakpoint would leave the
            notices unreachable for that visitor while every automated check
            still passed — the file would be in dist/, the string would be in
            the bundle, and nobody could get to it. The label shortens on narrow
            screens rather than disappearing.

            Regenerate the target with `pnpm licences`. Do not remove.
          */}
          <Text size="sm" c="dimmed" aria-hidden>
            ·
          </Text>
          <Anchor
            href={LICENCES_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            c="dimmed"
            underline="hover"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Text component="span" size="sm" visibleFrom="sm" inherit>
              Open-source licences
            </Text>
            <Text component="span" size="sm" hiddenFrom="sm" inherit>
              Licences
            </Text>
          </Anchor>
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
            radius="md"
            leftSection={<CoreIcon icon={<IconBrandGithub aria-hidden />} size={15} />}
            rightSection={<CoreIcon icon={<IconStar aria-hidden />} size={13} />}
          >
            Star us on GitHub
          </Button>
        </Group>
      </Group>
    </Container>
  </Box>
)
