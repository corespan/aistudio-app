import { Box, Group, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { useJupyterInstances } from '../data/queries/useJupyterInstances'
import { CoreIcon } from '@/shared/ui'
import classes from './JupyterUrlsPanel.module.css'

/** Split a Jupyter URL into a short "host:port" label and the rest (path +
 * query, usually the `/lab?token=...` part) so the panel can lead with the
 * part someone actually needs to recognize the instance, and tuck the long
 * token away as secondary, truncated detail. Falls back to the raw string
 * for anything that fails to parse as a URL. */
const splitUrl = (url: string): { host: string; rest: string } => {
  try {
    const parsed = new URL(url)
    const rest = `${parsed.pathname}${parsed.search}`
    return { host: parsed.host, rest: rest === '/' ? '' : rest }
  } catch {
    return { host: url, rest: '' }
  }
}

export const JupyterUrlsPanel = () => {
  const { data } = useJupyterInstances()
  const rows = (data ?? []).filter((row) => row.url?.startsWith('http'))

  return (
    <Stack h="100%" gap={0}>
      <Box px="xs" pt="xs" pb={4}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Jupyter Lab URLs
        </Text>
      </Box>

      <Box flex={1} mih={0}>
        <ScrollArea h="100%" type="auto" scrollbarSize={5} offsetScrollbars>
          <Stack gap={6} px="xs" py="xs">
            {rows.length === 0 ? (
              <Text size="xs" c="dimmed" ta="center" py="xl">
                No instances yet
              </Text>
            ) : (
              rows.map((row) => {
                const { host, rest } = splitUrl(row.url)

                return (
                  <UnstyledButton
                    key={row.taskId}
                    className={classes.row}
                    onClick={() => window.open(row.url, '_blank', 'noopener,noreferrer')}
                    px="xs"
                    py={6}
                    style={{
                      display: 'block',
                      width: '100%',
                      borderRadius: 8,
                      border: '1px solid var(--app-shell-border-color)',
                      background: 'var(--mantine-color-default)',
                    }}
                  >
                    <Group gap={8} wrap="nowrap" align="flex-start">
                      <Stack gap={1} style={{ minWidth: 0, flex: 1 }}>
                        <Text size="sm" fw={700} ff="monospace" truncate title={row.url}>
                          {host}
                        </Text>
                        {rest && (
                          <Text size="xs" c="dimmed" ff="monospace" truncate title={row.url}>
                            {rest}
                          </Text>
                        )}
                      </Stack>

                      <Box mt={4} className={classes.icon}>
                        <CoreIcon icon={<IconExternalLink stroke={1.8} />} size={13} />
                      </Box>
                    </Group>
                  </UnstyledButton>
                )
              })
            )}
          </Stack>
        </ScrollArea>
      </Box>
    </Stack>
  )
}
