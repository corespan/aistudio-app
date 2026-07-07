import {
  AppShell,
  Box,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconBrandPython, IconChartBar, IconTrophy, type IconProps } from '@tabler/icons-react'
import { useState, type ComponentType } from 'react'
import { Benchmarks } from '@/features/benchmarks/Benchmarks'
import { LaunchJupyter } from '@/features/benchmarks/components/LaunchJupyter'

type SectionKey = 'leaderboard' | 'jupyter'

type Section = {
  key: SectionKey
  label: string
  icon: ComponentType<IconProps>
}

const SECTIONS: Section[] = [
  { key: 'leaderboard', label: 'Leaderboard', icon: IconTrophy },
  { key: 'jupyter', label: 'Launch Jupyter', icon: IconBrandPython },
]

const NAVBAR_WIDTH = 248
const BRAND_GRADIENT = { from: 'indigo', to: 'violet', deg: 135 }

export const AppLayout = () => {
  // Leaderboard is the default landing section — it hosts the existing UI.
  const [active, setActive] = useState<SectionKey>('leaderboard')

  const renderPanel = () => {
    switch (active) {
      case 'leaderboard':
        return <Benchmarks />
      case 'jupyter':
        return <LaunchJupyter />
    }
  }

  return (
    <AppShell navbar={{ width: NAVBAR_WIDTH, breakpoint: 'sm' }} h="100vh">
      <AppShell.Navbar p={0}>
        <AppShell.Section
          p="md"
          style={{ borderBottom: '1px solid var(--app-shell-border-color)' }}
        >
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon size={40} radius="md" variant="gradient" gradient={BRAND_GRADIENT}>
              <IconChartBar size={24} stroke={1.6} />
            </ThemeIcon>
            <Box>
              <Title order={5} fw={700} lh={1.1}>
                Benchmarks
              </Title>
              <Text size="xs" c="dimmed">
                AI Studio
              </Text>
            </Box>
          </Group>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea} scrollbars="y" p="xs">
          <Text
            size="xs"
            c="dimmed"
            fw={600}
            tt="uppercase"
            px="sm"
            py="xs"
            style={{ letterSpacing: 0.6 }}
          >
            Menu
          </Text>
          <Stack gap={4}>
            {SECTIONS.map((section) => {
              const isActive = active === section.key
              return (
                <NavLink
                  key={section.key}
                  label={
                    <Text size="sm" fw={isActive ? 600 : 500}>
                      {section.label}
                    </Text>
                  }
                  leftSection={
                    <ThemeIcon
                      size={28}
                      radius="md"
                      variant={isActive ? 'filled' : 'light'}
                      color={isActive ? '#1b2864' : 'gray'}
                    >
                      <section.icon size={16} stroke={1.7} />
                    </ThemeIcon>
                  }
                  active={isActive}
                  variant="light"
                  color="#1b2864"
                  onClick={() => setActive(section.key)}
                  h={44}
                  style={{ borderRadius: 'var(--mantine-radius-md)' }}
                />
              )
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section p="md" style={{ borderTop: '1px solid var(--app-shell-border-color)' }}>
          <Text size="xs" c="dimmed">
            &copy; {new Date().getFullYear()} Corespan Systems
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main h="100vh" bg="var(--core-surface-1)">
        {renderPanel()}
      </AppShell.Main>
    </AppShell>
  )
}
