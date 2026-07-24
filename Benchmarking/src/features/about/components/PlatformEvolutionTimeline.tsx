import { Box, Stack, Text, Title } from '@mantine/core'
import { VersionRow } from './VersionRow'
import { PLATFORM_EVOLUTION_VERSIONS } from '../constants'

/**
 * "Platform Evolution" section for the About Us page: a vertical timeline of
 * releases, each paired with a schematic pipeline diagram built entirely from
 * Mantine components/icons (no images) so wording and structure stay editable.
 */
export const PlatformEvolutionTimeline = () => (
  <Stack gap="xl">
    <Stack gap={4}>
      <Title order={2} fz={26}>
        Platform Evolution
      </Title>
      <Text size="sm" c="dimmed">
        From a single terminal script to a fully automated, self-reporting benchmarking platform.
      </Text>
    </Stack>

    <Box style={{ position: 'relative' }}>
      {/* Continuous vertical line behind the version marker icons. */}
      <Box
        pos="absolute"
        top={22}
        bottom={22}
        left={21}
        w={2}
        style={{ background: 'var(--mantine-color-indigo-6)', opacity: 0.3, zIndex: 0 }}
      />
      <Stack gap="xl">
        {PLATFORM_EVOLUTION_VERSIONS.map((version) => (
          <VersionRow key={version.badge} version={version} />
        ))}
      </Stack>
    </Box>
  </Stack>
)
