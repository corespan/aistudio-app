import {
  ActionIcon,
  AppShell,
  Box,
  Flex,
  Image,
  Menu,
  NavLink,
  Portal,
  ScrollArea,
  Space,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconBrandPython,
  IconChartBar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconLogout,
  IconSettings,
  IconUserCircle,
  type IconProps,
} from '@tabler/icons-react'
import { useState, type ComponentType } from 'react'
import { CoreIcon } from '@/shared/ui'
import { Benchmarks } from '@/features/benchmarks/Benchmarks'
import { LaunchJupyter } from '@/features/benchmarks/components/LaunchJupyter'
import { HEADER_HEIGHT } from '@/app/constants'

type SectionKey = 'benchmarks' | 'jupyter'

type Section = {
  key: SectionKey
  label: string
  icon: ComponentType<IconProps>
}

type NavGroup = {
  key: string
  label: string
  children: Section[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'menu',
    label: 'Menu',
    children: [
      { key: 'benchmarks', label: 'Benchmarks', icon: IconChartBar },
      { key: 'jupyter', label: 'Launch Jupyter', icon: IconBrandPython },
    ],
  },
]

const NAVBAR_WIDTH = 248
const NAVBAR_COLLAPSED_WIDTH = 48

export const AppLayout = () => {
  const { colorScheme } = useMantineColorScheme()
  // Benchmarks is the default landing section — it hosts the existing UI.
  const [active, setActive] = useState<SectionKey>('benchmarks')
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false)
  // Placeholder until benchmarks wires up auth; composer derives this from the token.
  const username = 'User'

  const handleNavBarClose = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed)
  }

  const pageTitle =
    NAV_GROUPS.flatMap((group) => group.children).find((child) => child.key === active)?.label ?? ''

  const renderPanel = () => {
    switch (active) {
      case 'benchmarks':
        return <Benchmarks />
      case 'jupyter':
        return <LaunchJupyter />
    }
  }

  const renderMenuItems = (groups: NavGroup[]) => {
    return groups.map((group, index) => {
      const items = []
      if (!isNavbarCollapsed) {
        items.push(
          <Text
            key={group.key}
            c="dimmed"
            ta="left"
            px="sm"
            size="xs"
            fw={500}
            pt={index === 0 ? 'sm' : 'lg'}
            pb="xs"
          >
            {group.label.toUpperCase()}
          </Text>,
        )
      } else {
        items.push(<Space key={group.key} h="sm" />)
      }
      items.push(
        ...group.children.map((child) => {
          const isActive = active === child.key
          return (
            <Tooltip key={child.key} label={child.label} disabled={!isNavbarCollapsed}>
              <NavLink
                id={child.key}
                label={!isNavbarCollapsed ? <Text size="sm">{child.label}</Text> : ''}
                leftSection={<CoreIcon icon={<child.icon />} size={18} />}
                childrenOffset={16}
                active={isActive}
                variant={colorScheme === 'light' ? 'filled' : 'light'}
                onClick={() => setActive(child.key)}
                h={38}
                noWrap
              />
            </Tooltip>
          )
        }),
      )
      return items
    })
  }

  return (
    <>
      <AppShell navbar={{ width: NAVBAR_WIDTH, breakpoint: 'sm' }} h="100vh">
        <AppShell.Navbar
          w={isNavbarCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH}
          h="100%"
          style={{ transition: 'width 300ms ease' }}
        >
          <Stack justify="space-between" h="100%">
            <Stack justify="space-between" flex={1}>
              <Stack gap={0}>
                <Flex
                  h={HEADER_HEIGHT}
                  pr={12}
                  pos="relative"
                  gap="xs"
                  align="center"
                  justify="space-between"
                >
                  <Flex align="center" justify="center" gap={12}>
                    <Image
                      src="/corespan.png"
                      alt="Corespan Logo"
                      fit="contain"
                      w={28}
                      h={36}
                      ml={isNavbarCollapsed ? 8 : 10}
                    />
                    {!isNavbarCollapsed && (
                      <Text fw={600} size="lg" pb={4}>
                        Corespan
                      </Text>
                    )}
                  </Flex>
                </Flex>


                <Box mt={8} component={ScrollArea} type="scroll" scrollbars="y">
                  {renderMenuItems(NAV_GROUPS)}
                </Box>
              </Stack>
             
            </Stack>
          </Stack>
        </AppShell.Navbar>

        {/* Portaled out of the navbar so it escapes its stacking context (z 100)
          and stays clickable above drawer backdrops (z 200). */}
        <Portal>
          <ActionIcon
            variant="default"
            aria-label="Toggle navigation"
            size="sm"
            radius="xl"
            pos="fixed"
            top={41}
            left={(isNavbarCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH) - 11}
            visibleFrom="sm"
            style={{ zIndex: 201, transition: 'left 300ms ease' }}
            onClick={handleNavBarClose}
          >
            {!isNavbarCollapsed && <CoreIcon icon={<IconChevronLeft />} color="grey" />}
            {isNavbarCollapsed && <CoreIcon icon={<IconChevronRight />} color="grey" />}
          </ActionIcon>
        </Portal>

        <AppShell.Main
          pl={isNavbarCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH}
          h="100vh"
          style={{ transition: 'padding 300ms ease' }}
        >
          <Flex
            h={HEADER_HEIGHT}
            px={16}
            gap={16}
            align="center"
            justify="space-between"
            style={{ borderBottom: '1px solid var(--app-shell-border-color)' }}
          >
            <Text fw={600} size="md" tt="uppercase">
              {pageTitle}
            </Text>

           
          </Flex>

          <Box
            h={`calc(100vh - ${HEADER_HEIGHT}px)`}
            bg="var(--core-surface-1)"
            style={{ overflow: 'hidden' }}
          >
            {renderPanel()}
          </Box>
        </AppShell.Main>
      </AppShell>
    </>
  )
}
