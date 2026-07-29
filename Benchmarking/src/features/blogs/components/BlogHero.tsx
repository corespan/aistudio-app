import { Box, Button, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowDown, IconTopologyStar3 } from '@tabler/icons-react'
import { BLOG_POSTS } from '../constants'
import { CoreIcon } from '@/shared/ui'

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/**
 * Blog hero — a clear, single headline over a dark "measurement" surface
 * (graph-paper grid + a soft glow), no photography, no gimmicks. Pure
 * Mantine + Tabler icons.
 */
export const BlogHero = () => {
  const categoryCount = new Set(BLOG_POSTS.map((post) => post.category)).size
  const totalMinutes = BLOG_POSTS.reduce((sum, post) => sum + post.readMinutes, 0)

  return (
    <Box
      pos="relative"
      p={{ base: 'xl', sm: 48 }}
      style={{
        borderRadius: 'var(--mantine-radius-lg)',
        overflow: 'hidden',
        background:
          'linear-gradient(160deg, var(--mantine-color-dark-9) 0%, var(--mantine-color-dark-8) 55%, var(--mantine-color-indigo-9) 100%)',
      }}
    >
      {/* Graph-paper grid — ties the surface to "measurement" rather than a stock gradient. */}
      <Box
        aria-hidden
        pos="absolute"
        inset={0}
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        pos="absolute"
        top={-160}
        right={-120}
        w={420}
        h={420}
        style={{
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--mantine-color-cyan-6) 0%, transparent 70%)',
          opacity: 0.22,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <CoreIcon
        icon={
          <IconTopologyStar3
            aria-hidden
            stroke={0.8}
            color="white"
            style={{
              position: 'absolute',
              top: '10%',
              right: '4%',
              opacity: 0.05,
              transform: 'rotate(8deg)',
              pointerEvents: 'none',
            }}
          />
        }
        size={260}
      />

      <Stack gap="lg" pos="relative" maw={640}>
        <Group gap={8}>
          <Box
            w={7}
            h={7}
            style={{ borderRadius: '50%', background: 'var(--mantine-color-teal-4)' }}
          />
          <Text size="xs" fw={700} tt="uppercase" c="teal.3" style={{ letterSpacing: '0.12em' }}>
            Systems Engineering — Field Notes
          </Text>
        </Group>

        <Title order={1} fw={800} fz={{ base: 30, sm: 42 }} lh={1.15} c="white">
          GPU benchmarking and hardware topology, explained clearly
        </Title>

        <Text size="md" c="gray.4" lh={1.6}>
          How we turned a terminal script into a cloud-native benchmarking platform, and how to read
          a GPU server's own PCIe wiring to know its limits before you run a single test.
        </Text>

        <Group gap="sm" mt={4}>
          <Button
            variant="white"
            color="dark"
            radius="md"
            size="sm"
            onClick={() => scrollTo('featured-post')}
            rightSection={<CoreIcon icon={<IconArrowDown aria-hidden />} size={14} />}
          >
            Start reading
          </Button>
        </Group>

        <Group gap={10} c="gray.5" fz="xs">
          <Text size="xs">{BLOG_POSTS.length} field reports</Text>
          <Text size="xs">·</Text>
          <Text size="xs">{categoryCount} disciplines</Text>
          <Text size="xs">·</Text>
          <Text size="xs">{totalMinutes} min total read</Text>
        </Group>
      </Stack>
    </Box>
  )
}
