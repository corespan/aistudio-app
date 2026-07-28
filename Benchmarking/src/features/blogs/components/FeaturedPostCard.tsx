import { useState } from 'react'
import {
  Avatar,
  Badge,
  Box,
  Card,
  Flex,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import { IconArrowRight, IconStarFilled } from '@tabler/icons-react'
import type { BlogPost } from '../types'
import { CATEGORY_ICON_BY_LABEL, CATEGORY_STYLES } from '../constants'
import { formatDate, gradientBackground } from '../utils'

type FeaturedPostCardProps = {
  post: BlogPost
  onOpen: (id: string) => void
}

/**
 * Large "hero" card for the single featured post. The gradient panel is cut
 * on a diagonal into the copy, with a read-time stamp straddling the seam —
 * the same editorial-log language as the grid cards, scaled up. Built
 * entirely from Mantine + Tabler, no photography.
 */
export const FeaturedPostCard = ({ post, onOpen }: FeaturedPostCardProps) => {
  const [hovered, setHovered] = useState(false)
  const { colorScheme } = useMantineColorScheme()
  const style = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.All
  const CategoryIcon = CATEGORY_ICON_BY_LABEL[post.category] ?? IconStarFilled
  const glowVar = `var(--mantine-color-${style.color}-5)`

  return (
    <UnstyledButton
      onClick={() => onOpen(post.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      w="100%"
      style={{ textAlign: 'left', borderRadius: 'var(--mantine-radius-lg)' }}
      aria-label={`Read ${post.title}`}
    >
      <Card
        withBorder
        radius="lg"
        padding={0}
        p={0}
        style={{
          overflow: 'hidden',
          transform: hovered ? 'translateY(-4px)' : 'none',
          borderColor: hovered ? `var(--mantine-color-${style.color}-filled)` : undefined,
          boxShadow: hovered
            ? `0 24px 44px -16px ${glowVar}55, 0 6px 14px rgba(0,0,0,0.1)`
            : 'var(--mantine-shadow-sm)',
          transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
        }}
      >
        <Flex wrap="wrap" align="stretch">
          <Box
            pos="relative"
            flex={1}
            miw={280}
            mih={{ base: 200, sm: 320 }}
            style={{
              background: gradientBackground(style),
              clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0% 100%)',
            }}
          >
            <Text
              fw={800}
              fz={140}
              lh={1}
              c="white"
              pos="absolute"
              bottom={-30}
              left={20}
              style={{ opacity: 0.14, fontFamily: 'monospace', pointerEvents: 'none' }}
            >
              01
            </Text>

            <CategoryIcon
              size={220}
              stroke={1}
              color="white"
              aria-hidden
              style={{
                opacity: 0.2,
                position: 'absolute',
                top: '50%',
                right: '10%',
                transform: hovered
                  ? 'translateY(-50%) rotate(-4deg) scale(1.06)'
                  : 'translateY(-50%) rotate(-8deg)',
                transition: 'transform 300ms ease',
              }}
            />

            <Badge
              size="lg"
              radius="sm"
              variant="white"
              color={style.color}
              leftSection={<IconStarFilled size={12} aria-hidden />}
              pos="absolute"
              top={20}
              left={20}
            >
              Featured
            </Badge>

            {/* Read-time stamp, straddling the diagonal seam. */}
            <Box
              pos="absolute"
              bottom={{ base: -26, sm: '50%' }}
              right={{ base: 24, sm: -30 }}
              w={64}
              h={64}
              style={{
                borderRadius: '50%',
                background: 'var(--mantine-color-body)',
                border: `2px solid ${hovered ? glowVar : 'var(--core-card-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(50%)',
                transition: 'border-color 200ms ease',
                boxShadow: 'var(--mantine-shadow-md)',
              }}
            >
              <Stack gap={0} align="center">
                <Text fw={800} fz={20} lh={1} c={style.color}>
                  {post.readMinutes}
                </Text>
                <Text fz={9} fw={700} tt="uppercase" c="dimmed" lh={1}>
                  min
                </Text>
              </Stack>
            </Box>
          </Box>

          <Stack gap="sm" p="xl" pt={{ base: 40, sm: 'xl' }} flex={1} miw={280} justify="center">
            <Group gap="xs">
              <Badge variant="light" color={style.color} radius="sm" size="sm">
                {post.category}
              </Badge>
              {post.chapters.length > 1 && (
                <Badge variant="dot" color={style.color} radius="sm" size="sm">
                  {post.chapters.length}-part read
                </Badge>
              )}
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" color="gray" radius="sm" size="sm">
                  {tag}
                </Badge>
              ))}
            </Group>

            <Title
              order={2}
              fw={800}
              fz={{ base: 22, sm: 27 }}
              lh={1.2}
              c={hovered ? `${style.color}.${colorScheme === 'dark' ? 4 : 7}` : undefined}
              style={{ transition: 'color 160ms ease' }}
            >
              {post.title}
            </Title>

            <Text size="sm" c="dimmed" lh={1.6}>
              {post.excerpt}
            </Text>

            <Group justify="space-between" mt="sm" wrap="wrap" gap="sm">
              <Group gap="sm" wrap="nowrap">
                <Avatar name={post.author} color="initials" radius="xl" size="sm" />
                <Stack gap={0}>
                  <Text size="sm" fw={600}>
                    {post.author}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(post.date)}
                  </Text>
                </Stack>
              </Group>

              <Group gap={4} c={hovered ? style.color : 'dimmed'} wrap="nowrap">
                <Text size="xs" fw={600}>
                  Read the full story
                </Text>
                <IconArrowRight
                  size={14}
                  aria-hidden
                  style={{
                    transform: hovered ? 'translateX(3px)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </Group>
            </Group>
          </Stack>
        </Flex>
      </Card>
    </UnstyledButton>
  )
}
