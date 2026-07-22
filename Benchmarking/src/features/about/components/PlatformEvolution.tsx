import { Badge, Box, Image, Stack, Text, Title } from '@mantine/core'

/**
 * Each diagram's original title band (baked into the PNG) is cropped off via
 * `cropPx` — measured in the source image's own pixel space — so the numbers
 * below are tied to that file, not arbitrary. We render our own heading text
 * on top instead, which is why "Hardening" no longer appears for Version 2.
 */
const VERSIONS = [
  {
    version: 'Version 1',
    title: 'Building the Foundation',
    subtitle: 'From terminal scripts to a full orchestration platform',
    src: '/Evolution_v1.png',
    width: 1610,
    height: 977,
    cropPx: 115,
  },
  {
    version: 'Version 2',
    title: 'Enterprise-Grade Platform',
    subtitle: 'From concept to a production-ready enterprise platform',
    src: '/Evolution_v2.png',
    width: 1536,
    height: 1024,
    cropPx: 118,
  },
  {
    version: 'Version 3',
    title: 'Automating the Platform',
    subtitle: 'A self-scheduling, self-executing, and self-reporting benchmarking platform',
    src: '/Evolution_v3.png',
    width: 1659,
    height: 948,
    cropPx: 128,
  },
] as const

/**
 * "Platform Evolution" section for the About Us page: each release's
 * architecture diagram with its title band cropped out and replaced by a real,
 * editable heading — so wording (e.g. the version name) is fully under our
 * control rather than baked into the image.
 */
export const PlatformEvolution = () => (
  <Stack gap="xl">
    <Stack gap={4}>
      <Title order={2} fz={26}>
        Platform Evolution
      </Title>
      <Text size="sm" c="dimmed">
        From a single terminal script to a fully automated, self-reporting benchmarking platform.
      </Text>
    </Stack>

    {VERSIONS.map((item) => {
      // Percentage math is relative to the image's own width, so it stays
      // correct at any render size — no fixed pixel heights needed.
      const croppedAspectRatio = item.width / (item.height - item.cropPx)
      const negativeMarginPct = -((item.cropPx / item.width) * 100)

      return (
        <Stack key={item.version} gap="sm">
          <Badge variant="light" color="indigo" radius="sm" size="sm" w="fit-content" tt="uppercase">
            {item.version}
          </Badge>
          <Title order={3} fz={22}>
            {item.title}
          </Title>
          <Text size="sm" c="dimmed" mb={4}>
            {item.subtitle}
          </Text>

          <Box
            maw={1100}
            w="100%"
            mx="auto"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-default-border)',
              aspectRatio: `${croppedAspectRatio}`,
            }}
          >
            <Image
              src={item.src}
              alt={`${item.version}: ${item.title} — architecture diagram`}
              w="100%"
              style={{ display: 'block', marginTop: `${negativeMarginPct}%` }}
            />
          </Box>
        </Stack>
      )
    })}
  </Stack>
)
