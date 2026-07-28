import {
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  useMantineColorScheme,
} from '@mantine/core'
import { IMPACT_STATS } from '../constants'

/**
 * Pull-stat band under the hero. These are the three numbers that justify the
 * whole platform, so they get typographic weight rather than being buried in
 * body copy. Mantine Paper + ThemeIcon only.
 */
export const ImpactStats = () => {
  const { colorScheme } = useMantineColorScheme()
  // `--mantine-color-<c>-text` is too light on white for a 34px figure, so pick
  // a darker shade in light mode and a lighter one in dark mode explicitly.
  const shade = colorScheme === 'dark' ? 4 : 8

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      {IMPACT_STATS.map(({ value, label, detail, icon: Icon, color }) => (
        <Paper key={label} withBorder radius="md" p="lg">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Text fw={800} fz={34} lh={1} c={`${color}.${shade}`}>
                {value}
              </Text>
              <ThemeIcon variant="light" color={color} size={36} radius="md">
                <Icon size={19} aria-hidden />
              </ThemeIcon>
            </Group>
            <Stack gap={4}>
              <Text fw={600} fz="sm" lh={1.3}>
                {label}
              </Text>
              <Text size="xs" c="dimmed" lh={1.45}>
                {detail}
              </Text>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  )
}
