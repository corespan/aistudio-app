import { useState } from 'react'
import {
  Avatar,
  Badge,
  Box,
  Card,
  Group,
  Stack,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import { IconArrowRight, IconStarFilled } from '@tabler/icons-react'
import type { BlogPost } from '../types'
import { CATEGORY_ICON_BY_LABEL, CATEGORY_STYLES } from '../constants'
import { formatDate, gradientBackground } from '../utils'

type BlogCardProps = {
  post: BlogPost
  /** 1-based position in the grid — shown as a large watermark index. */
  index: number
  onOpen: (id: string) => void
}

/**
 * One post in the grid, as a real button so the whole card is clickable and
 * keyboard-focusable. The cover is a category-colored gradient panel, sliced
 * on a diagonal, with a "read time" stamp straddling the seam into the copy
 * below — an editorial-log look, built entirely from Mantine + Tabler.
 */
export const BlogCard = ({ post, index, onOpen }: BlogCardProps) => {
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
      h="100%"
      w="100%"
      style={{ textAlign: 'left', borderRadius: 'var(--mantine-radius-lg)' }}
      aria-label={`Read ${post.title}`}
    >
      <Card
        withBorder
        radius="lg"
        padding={0}
        p={0}
        h="100%"
        style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: hovered ? 'translateY(-6px)' : 'none',
          borderColor: hovered ? `var(--mantine-color-${style.color}-filled)` : undefined,
          boxShadow: hovered
            ? `0 20px 36px -12px ${glowVar}55, 0 4px 10px rgba(0,0,0,0.08)`
            : 'var(--mantine-shadow-sm)',
          transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
        }}
      >
        {/* Cover: category gradient, cut on a diagonal so it interlocks with the copy below. */}
        <Box
          pos="relative"
          h={128}
          style={{
            background: gradientBackground(style),
            clipPath: 'polygon(0 0, 100% 0, 100% 78%, 0 100%)',
            flexShrink: 0,
          }}
        >
          <Text
            fw={800}
            fz={64}
            lh={1}
            c="white"
            pos="absolute"
            bottom={-6}
            left={16}
            style={{ opacity: 0.16, fontFamily: 'monospace', pointerEvents: 'none' }}
          >
            {String(index).padStart(2, '0')}
          </Text>

          <CategoryIcon
            size={90}
            stroke={1}
            color="white"
            aria-hidden
            style={{
              opacity: 0.22,
              position: 'absolute',
              top: 10,
              right: 6,
              transform: hovered ? 'rotate(-4deg) scale(1.1)' : 'rotate(-8deg)',
              transition: 'transform 300ms ease',
            }}
          />

          <Badge
            variant="white"
            color={style.color}
            radius="sm"
            size="sm"
            pos="absolute"
            top={12}
            left={16}
          >
            {post.category}
          </Badge>

          {post.chapters.length > 1 && (
            <Badge
              variant="filled"
              color="dark"
              radius="sm"
              size="sm"
              leftSection={<IconStarFilled size={9} aria-hidden />}
              pos="absolute"
              top={12}
              right={16}
              style={{ opacity: 0.85 }}
            >
              {post.chapters.length}-part
            </Badge>
          )}

          {/* Read-time stamp, straddling the diagonal seam. */}
          <Box
            pos="absolute"
            bottom={-22}
            right={20}
            w={52}
            h={52}
            style={{
              borderRadius: '50%',
              background: 'var(--mantine-color-body)',
              border: `2px solid ${hovered ? glowVar : 'var(--core-card-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 200ms ease',
              boxShadow: 'var(--mantine-shadow-sm)',
            }}
          >
            <Stack gap={0} align="center">
              <Text fw={800} fz={16} lh={1} c={style.color}>
                {post.readMinutes}
              </Text>
              <Text fz={8} fw={700} tt="uppercase" c="dimmed" lh={1}>
                min
              </Text>
            </Stack>
          </Box>
        </Box>

        <Stack gap="xs" p="md" pt={30} justify="space-between" flex={1}>
          <Stack gap={6}>
            <Text
              fw={700}
              fz="sm"
              lh={1.35}
              c={hovered ? `${style.color}.${colorScheme === 'dark' ? 4 : 7}` : undefined}
              style={{ transition: 'color 160ms ease' }}
            >
              {post.title}
            </Text>

            <Text size="xs" c="dimmed" lineClamp={2} lh={1.6}>
              {post.excerpt}
            </Text>
          </Stack>

          <Stack gap="xs">
            <Box
              style={{
                height: 1,
                background: 'linear-gradient(90deg, var(--core-card-border) 0%, transparent 100%)',
              }}
            />
            <Group justify="space-between" wrap="nowrap">
              <Group gap={6} wrap="nowrap">
                <Avatar name={post.author} color="initials" radius="xl" size="xs" />
                <Stack gap={0}>
                  <Text size="xs" fw={600} lh={1.2}>
                    {post.author}
                  </Text>
                  <Text size="9px" c="dimmed" lh={1.2}>
                    {formatDate(post.date, false)}
                  </Text>
                </Stack>
              </Group>

              <Group gap={4} c={hovered ? style.color : 'dimmed'} wrap="nowrap">
                <Text size="xs" fw={600}>
                  Read
                </Text>
                <IconArrowRight
                  size={13}
                  aria-hidden
                  style={{
                    transform: hovered ? 'translateX(3px)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </Group>
            </Group>
          </Stack>
        </Stack>
      </Card>
    </UnstyledButton>
  )
}
