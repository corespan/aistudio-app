import { Badge, Group, Paper, Text, ThemeIcon } from '@mantine/core'
import type { Stage } from '../types'
import { CoreIcon } from '@/shared/ui'

export const StageBox = ({ icon: Icon, label, sub }: Stage) => (
  <Paper withBorder radius="sm" p="xs" style={{ flexShrink: 0 }}>
    <Group gap={6} wrap="nowrap">
      <ThemeIcon size="sm" variant="light" color="indigo" radius="sm">
        <CoreIcon icon={<Icon />} size={13} />
      </ThemeIcon>
      <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
    </Group>
    {sub && (
      <Group gap={4} mt={6} wrap="wrap" maw={140}>
        {sub.map((s, i) => (
          <Badge
            key={`${s}-${i}`}
            size="xs"
            variant="default"
            radius="sm"
            style={{ fontWeight: 500 }}
          >
            {s}
          </Badge>
        ))}
      </Group>
    )}
  </Paper>
)
