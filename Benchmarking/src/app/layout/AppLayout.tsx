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
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconLogout,
  IconSettings,
  IconUserCircle,
} from '@tabler/icons-react'
import { useState } from 'react'
import { AppFooter } from '@/app/layout/AppFooter'
import { CoreIcon } from '@/shared/ui'
import { Benchmarks } from '@/features/benchmarks/Benchmarks'
import { LaunchJupyter } from '@/features/benchmarks/components/LaunchJupyter'
import { JupyterUrlsMenuItems } from '@/features/benchmarks/components/JupyterUrlsMenu'
import { DbHealthIndicator } from '@/features/benchmarks/components/DbHealthIndicator'
import { AboutUs } from '@/features/about/AboutUs'
import { BlogsPage } from '@/features/blogs/BlogsPage'
import {
  HEADER_HEIGHT,
  NAV_GROUPS,
  NAVBAR_WIDTH,
  NAVBAR_COLLAPSED_WIDTH,
  type SectionKey,
  type NavGroup,
} from '@/app/constants'

export const AppLayout = () => {
  const { colorScheme } = useMantineColorScheme()
  // Benchmarks is the default landing section — it hosts the existing UI.
  const [active, setActive] = useState<SectionKey>('benchmarks')
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false)
  // Controlled so the whole Launch Jupyter row can toggle it (not just the
  // chevron) and so the chevron's own up/down state can reflect it.
  const [jupyterMenuOpened, setJupyterMenuOpened] = useState(false)
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
      case 'blogs':
        return <BlogsPage />
      case 'about':
        return <AboutUs />
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
          const isJupyter = child.key === 'jupyter'
          const showChevron = isJupyter && !isNavbarCollapsed

          const navLink = (
            <NavLink
              id={child.key}
              label={!isNavbarCollapsed ? <Text size="sm">{child.label}</Text> : ''}
              leftSection={<CoreIcon icon={<child.icon />} size={18} />}
              rightSection={
                showChevron &&
                (jupyterMenuOpened ? (
                  <IconChevronUp size={14} stroke={1.8} />
                ) : (
                  <IconChevronDown size={14} stroke={1.8} />
                ))
              }
              childrenOffset={16}
              active={isActive}
              variant={colorScheme === 'light' ? 'filled' : 'light'}
              onClick={() => setActive(child.key)}
              h={38}
              noWrap
            />
          )

          // Launch Jupyter gets an extra dropdown off the sidebar row itself: a
          // quick-access list of every known Jupyter Lab URL, so you don't have
          // to open the page just to grab a link.
          if (isJupyter) {
            if (isNavbarCollapsed) {
              // Collapsed navbar has no label/chevron to click, so the dropdown
              // opens on hover instead (click-hover keeps it keyboard accessible).
              return (
                <Menu
                  key={child.key}
                  trigger="click-hover"
                  openDelay={100}
                  closeDelay={150}
                  shadow="md"
                  width={280}
                  position="right-start"
                  withinPortal
                >
                  <Menu.Target>{navLink}</Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Jupyter Lab URLs</Menu.Label>
                    <JupyterUrlsMenuItems />
                  </Menu.Dropdown>
                </Menu>
              )
            }

            // Expanded navbar: the whole row is the toggle (not just the
            // chevron) — Menu is controlled so the chevron's direction always
            // matches whether the dropdown is actually open.
            return (
              <Menu
                key={child.key}
                opened={jupyterMenuOpened}
                onChange={setJupyterMenuOpened}
                shadow="md"
                width={300}
                position="right-start"
                withinPortal
              >
                <Menu.Target>{navLink}</Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Jupyter Lab URLs</Menu.Label>
                  <JupyterUrlsMenuItems />
                </Menu.Dropdown>
              </Menu>
            )
          }

          return (
            <Tooltip key={child.key} label={child.label} disabled={!isNavbarCollapsed}>
              {navLink}
            </Tooltip>
          )
        }),
      )
      return items
    })
  }

  return (
    <>
      <AppShell
        navbar={{ width: NAVBAR_WIDTH, breakpoint: 'sm' }}
        footer={{ height: { base: 76, sm: 76 } }}
        h="100vh"
      >
        <AppShell.Navbar
          w={isNavbarCollapsed ? NAVBAR_COLLAPSED_WIDTH : NAVBAR_WIDTH}
          h="calc(100vh - var(--app-shell-footer-height, 0px))"
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

                <Box mt={8} flex={1} mih={0} style={{ overflowY: 'auto' }}>
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
          h="calc(100vh - var(--app-shell-footer-height, 0px))"
          style={{ transition: 'padding 300ms ease', display: 'flex', flexDirection: 'column' }}
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

            <DbHealthIndicator />
          </Flex>

          <Box flex={1} mih={0} bg="var(--core-surface-1)" style={{ overflow: 'hidden' }}>
            <ScrollArea h="100%" type="scroll" scrollbarSize={6}>
              {renderPanel()}
            </ScrollArea>
          </Box>
        </AppShell.Main>

        <AppShell.Footer>
          <AppFooter />
        </AppShell.Footer>
      </AppShell>
    </>
  )
}
