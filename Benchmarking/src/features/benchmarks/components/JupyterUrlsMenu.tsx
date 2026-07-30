import { Menu, Text } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { useJupyterInstances } from '../data/queries/useJupyterInstances'
import { CoreIcon } from '@/shared/ui'

/**
 * The Jupyter Lab URLs dropdown's content — every known instance (from GET
 * /jupyter/instances) as a clickable `Menu.Item` that opens its URL in a new
 * tab. Used by the sidebar chevron dropdown on the Launch Jupyter nav item
 * (see AppLayout).
 */
export const JupyterUrlsMenuItems = () => {
  const { data } = useJupyterInstances()
  // Only show rows with a real, openable URL — filters out missing values and
  // the table's "—" placeholder, and guards against a non-http(s) value ever
  // reaching `window.open` below.
  const rows = (data ?? []).filter((row) => row.url?.startsWith('http'))

  if (rows.length === 0) return <Menu.Item disabled>No instances yet</Menu.Item>

  return (
    <>
      {rows.map((row) => (
        <Menu.Item
          key={row.taskId}
          leftSection={<CoreIcon icon={<IconExternalLink stroke={1.8} />} size={14} />}
          onClick={() => window.open(row.url, '_blank', 'noopener,noreferrer')}
        >
          <Text size="sm" fw={600} truncate>
            {row.url}
          </Text>
        </Menu.Item>
      ))}
    </>
  )
}
