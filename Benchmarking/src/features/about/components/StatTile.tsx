import { Badge, Group, Paper, Text, ThemeIcon } from '@mantine/core'
import type { StatTileProps } from '../types'
import { CoreIcon } from '@/shared/ui'

/** Compact stat tile — icon, label, value, and an optional trend badge. */
export const StatTile = ({ icon: Icon, label, value, delta }: StatTileProps) => (
  <Paper withBorder radius="md" p="md" ta="center">
    <ThemeIcon variant="light" color="cyan" size={36} radius="md" mx="auto" mb="xs">
      <CoreIcon icon={<Icon />} size={18} />
    </ThemeIcon>
    <Text size="9px" fw={700} tt="uppercase" c="dimmed">
      {label}
    </Text>
    <Group justify="center" gap={6} mt={2}>
      <Text fw={800} fz={18}>
        {value}
      </Text>
      {delta && (
        <Badge color="teal" variant="light" size="xs" radius="sm">
          {delta}
        </Badge>
      )}
    </Group>
  </Paper>
)
