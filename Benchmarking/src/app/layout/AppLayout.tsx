import {
  ActionIcon,
  AppShell,
  Box,
  Flex,
  Image,
  NavLink,
  Paper,
  Portal,
  ScrollArea,
  Space,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { AppFooter } from '@/app/layout/AppFooter'
import { CoreIcon } from '@/shared/ui'
import { Benchmarks } from '@/features/benchmarks/Benchmarks'
import { LaunchJupyter } from '@/features/benchmarks/components/LaunchJupyter'
import { JupyterUrlsPanel } from '@/features/benchmarks/components/JupyterUrlsPanel'
import { DbHealthIndicator } from '@/features/benchmarks/components/DbHealthIndicator'
import { AboutUs } from '@/features/about/AboutUs'
import { BlogsPage } from '@/features/blogs/BlogsPage'
import {
  HEADER_HEIGHT,
  NAV_GROUPS,
  NAVBAR_WIDTH,
  NAVBAR_COLLAPSED_WIDTH,
  JUPYTER_PANEL_WIDTH,
  type SectionKey,
  type NavGroup,
} from '@/app/constants'

export const AppLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  // Benchmarks is the landing page, so it lives at the app root (`/aistudio`
  // itself) rather than `/aistudio/benchmarks` — every other section gets its
  // own `/aistudio/<key>` path.
  const pathForKey = (key: SectionKey) => (key === 'benchmarks' ? '/' : `/${key}`)
  // The active sidebar section is derived straight from the URL — `/blogs`,
  // `/about`, etc. — instead of separate local state, so a direct link or a
  // browser refresh always lands on the right page.
  const active = (NAV_GROUPS.flatMap((group) => group.children).find((child) =>
    child.key === 'benchmarks'
      ? location.pathname === '/'
      : location.pathname.startsWith(pathForKey(child.key)),
  )?.key ?? 'benchmarks') as SectionKey
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false)

  const handleNavBarClose = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed)
  }

  // The top bar always shows the section label — "Blogs" — even on a single
  // article's route, rather than swapping in that article's own headline.
  const pageTitle =
    active === 'jupyter'
      ? 'Launch Jupyter & Instances'
      : (NAV_GROUPS.flatMap((group) => group.children).find((child) => child.key === active)
          ?.label ?? '')

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

          const navLink = (
            <NavLink
              id={child.key}
              label={!isNavbarCollapsed ? <Text size="sm">{child.label}</Text> : ''}
              leftSection={<CoreIcon icon={<child.icon />} size={18} />}
              childrenOffset={16}
              active={isActive}
              variant="filled"
              onClick={() => navigate(pathForKey(child.key))}
              h={38}
              noWrap
            />
          )

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
        footer={{ height: { base: 60, sm: 60 } }}
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
                      src={`${import.meta.env.BASE_URL}corespan.png`}
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
          {/* Single shared header for the whole main area — the Jupyter URLs
              card below sits under this same heading on every page, so it
              never needs (or risks drifting out of sync with) its own title. */}
          <Flex
            h={HEADER_HEIGHT}
            pl="lg"
            pr={16}
            gap={0}
            align="center"
            justify="space-between"
            style={{ borderBottom: '1px solid var(--app-shell-border-color)' }}
          >
            <Text fw={600} size="md" tt="uppercase" lineClamp={1}>
              {pageTitle}
            </Text>

            <DbHealthIndicator />
          </Flex>

          <Flex flex={1} mih={0} style={{ overflow: 'hidden' }}>
            {/* Jupyter URLs card — only shown on the Launch Jupyter page,
                below the shared header above. */}
            {active === 'jupyter' && (
              <Paper
                // Theme sets `withBorder: true` as a Paper-wide default
                // (constants.ts), which draws all four sides — has to be
                // overridden explicitly here, omitting the prop is not enough.
                withBorder={false}
                radius={0}
                shadow="none"
                p={0}
                w={JUPYTER_PANEL_WIDTH}
                h="100%"
                visibleFrom="sm"
                style={{
                  flex: `0 0 ${JUPYTER_PANEL_WIDTH}px`,
                  overflow: 'hidden',
                  borderRight: '1px solid var(--app-shell-border-color)',
                }}
              >
                <JupyterUrlsPanel />
              </Paper>
            )}

            <Box flex={1} mih={0} bg="var(--core-surface-1)" style={{ overflow: 'hidden' }}>
              <ScrollArea h="100%" type="scroll" scrollbarSize={6}>
                <Routes>
                  <Route path="/aistudio/benchmarks" element={<Benchmarks />} />
                  <Route path="/aistudio/jupyter" element={<LaunchJupyter />} />
                  <Route path="/aistudio/blogs" element={<BlogsPage />} />
                  <Route path="/aistudio/blogs/:postId" element={<BlogsPage />} />
                  <Route path="/aistudio/about" element={<AboutUs />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ScrollArea>
            </Box>
          </Flex>
        </AppShell.Main>

        <AppShell.Footer>
          <AppFooter />
        </AppShell.Footer>
      </AppShell>
    </>
  )
}
