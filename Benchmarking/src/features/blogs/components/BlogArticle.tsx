import { useState } from 'react'
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Code,
  Divider,
  Flex,
  Group,
  List,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconCalendar,
  IconCircleCheck,
  IconClockHour4,
  IconInfoCircle,
  IconStarFilled,
} from '@tabler/icons-react'
import { HEADER_OFFSET } from '@/app/constants'
import type { BlogChapter, BlogPost, BlogSection } from '../types'
import { BLOG_POSTS, CATEGORY_ICON_BY_LABEL, CATEGORY_STYLES } from '../constants'
import { formatDate, gradientBackground } from '../utils'
import { CoreIcon } from '@/shared/ui'

type BlogArticleProps = {
  post: BlogPost
  /** Sibling posts for the prev/next footer, in display order. */
  previous?: BlogPost
  next?: BlogPost
  onBack: () => void
  onNavigate: (id: string) => void
}

const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/**
 * Full reading view for a single post. Masthead and body both run the full
 * width of the page — nothing here is capped to an artificial column — with a
 * sticky "On this page" rail alongside the body that puts the freed-up width
 * to use instead of leaving it empty. Every block in the body (takeaways,
 * chapters, prev/next) shares one left edge; only actual prose (paragraphs,
 * lists, callouts) keeps a comfortable reading measure, while headings,
 * tables, and code stretch the full column so they benefit from the space.
 */
export const BlogArticle = ({ post, previous, next, onBack, onNavigate }: BlogArticleProps) => {
  const style = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.All
  const CategoryIcon = CATEGORY_ICON_BY_LABEL[post.category] ?? IconStarFilled
  const isMultiChapter = post.chapters.length > 1

  // "On this page" targets: chapter titles for a multi-part post, or the
  // section headings themselves when there's only one chapter to jump around.
  const navItems = isMultiChapter
    ? post.chapters.map((chapter, index) => ({
        id: `chapter-${index}`,
        label: chapter.title || `Part ${index + 1}`,
      }))
    : (post.chapters[0]?.sections ?? []).map((section, index) => ({
        id: `section-${index}`,
        label: section.heading,
      }))

  return (
    <Stack gap="xl">
      <Button
        variant="subtle"
        color="gray"
        size="sm"
        leftSection={<CoreIcon icon={<IconArrowLeft aria-hidden />} size={15} />}
        onClick={onBack}
        w="fit-content"
      >
        All posts
      </Button>

      {/* Masthead: full width — same gradient language as the cards this was opened from. */}
      <Box
        pos="relative"
        p={{ base: 'lg', sm: 40 }}
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          overflow: 'hidden',
          background: gradientBackground(style),
        }}
      >
        <CoreIcon
          icon={
            <CategoryIcon
              stroke={1}
              color="white"
              aria-hidden
              style={{
                opacity: 0.14,
                position: 'absolute',
                top: -50,
                right: -30,
                transform: 'rotate(-10deg)',
                pointerEvents: 'none',
              }}
            />
          }
          size={260}
        />

        <Stack gap="md" pos="relative" maw={820}>
          <Group gap="xs">
            <Badge variant="white" color={style.color} radius="sm" size="sm">
              {post.category}
            </Badge>
            {isMultiChapter && (
              <Badge
                variant="white"
                color={style.color}
                radius="sm"
                size="sm"
                leftSection={<CoreIcon icon={<IconStarFilled aria-hidden />} size={10} />}
              >
                {post.chapters.length}-part read
              </Badge>
            )}
          </Group>

          <Title order={1} fz={{ base: 26, sm: 38 }} lh={1.15} c="white">
            {post.title}
          </Title>

          <Text fz={{ base: 'sm', sm: 'md' }} c="white" opacity={0.85}>
            {post.excerpt}
          </Text>

          <Group gap="lg" mt="xs">
            <Group gap="sm">
              <Avatar name={post.author} color="white" variant="filled" radius="xl" size="md" />
              <Stack gap={0}>
                <Text size="sm" fw={700} c="white">
                  {post.author}
                </Text>
                <Text size="xs" c="white" opacity={0.8}>
                  {post.authorRole}
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" c="white" opacity={0.85}>
              <CoreIcon icon={<IconCalendar aria-hidden />} size={14} />
              <Text size="xs">{formatDate(post.date)}</Text>
            </Group>

            <Group gap="xs" c="white" opacity={0.85}>
              <CoreIcon icon={<IconClockHour4 aria-hidden />} size={14} />
              <Text size="xs">{post.readMinutes} min read</Text>
            </Group>
          </Group>
        </Stack>
      </Box>

      {/* Body: a fixed-width reading column plus a sticky nav/tags rail that
          absorbs the rest of the row's width instead of leaving it blank. */}
      <Flex gap="xl" align="flex-start" wrap="wrap">
        <Stack gap="xl" flex={1} miw={280}>
          {post.takeaways.length > 0 && (
            <Paper
              withBorder
              radius="lg"
              p="lg"
              style={{
                borderLeft: `3px solid var(--mantine-color-${style.color}-5)`,
              }}
            >
              <Group gap="sm" mb="sm">
                <ThemeIcon variant="light" color={style.color} size={32} radius="md">
                  <CoreIcon icon={<IconBulb aria-hidden />} size={17} />
                </ThemeIcon>
                <Text fw={700} fz="sm">
                  Key takeaways
                </Text>
              </Group>
              <List
                spacing="xs"
                size="sm"
                maw={820}
                icon={
                  <ThemeIcon variant="light" color={style.color} size={18} radius="xl">
                    <CoreIcon icon={<IconCircleCheck aria-hidden />} size={12} />
                  </ThemeIcon>
                }
              >
                {post.takeaways.map((takeaway) => (
                  <List.Item key={takeaway}>{takeaway}</List.Item>
                ))}
              </List>
            </Paper>
          )}

          <Stack gap={40}>
            {post.chapters.map((chapter, index) => (
              <ArticleChapter
                key={chapter.title || index}
                chapter={chapter}
                accent={style.color}
                index={index}
                showDivider={isMultiChapter && index > 0}
                anchorId={isMultiChapter ? `chapter-${index}` : undefined}
                sectionIdPrefix={isMultiChapter ? undefined : 'section-'}
                onNavigate={onNavigate}
              />
            ))}
          </Stack>

          <Divider />

          <Group grow align="stretch" wrap="wrap">
            {previous ? (
              <SiblingLink
                direction="previous"
                post={previous}
                accent={style.color}
                onNavigate={onNavigate}
              />
            ) : (
              <Box />
            )}
            {next ? (
              <SiblingLink
                direction="next"
                post={next}
                accent={style.color}
                onNavigate={onNavigate}
              />
            ) : (
              <Box />
            )}
          </Group>
        </Stack>

        <Stack
          gap="md"
          w={240}
          style={{ position: 'sticky', top: HEADER_OFFSET + 16, flexShrink: 0 }}
        >
          {navItems.length > 0 && (
            <Paper withBorder radius="lg" p="md">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
                On this page
              </Text>
              <Stack gap={2}>
                {navItems.map((item) => (
                  <UnstyledButton
                    key={item.id}
                    onClick={() => scrollToId(item.id)}
                    px="xs"
                    py={6}
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                      borderLeft: `2px solid ${style.color === 'gray' ? 'var(--mantine-color-gray-4)' : `var(--mantine-color-${style.color}-5)`}`,
                    }}
                  >
                    <Text size="sm" c="dimmed" lineClamp={2} lh={1.3}>
                      {item.label}
                    </Text>
                  </UnstyledButton>
                ))}
              </Stack>
            </Paper>
          )}

          {post.tags.length > 0 && (
            <Paper withBorder radius="lg" p="md">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">
                Tagged
              </Text>
              <Group gap={6}>
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" color="gray" radius="sm" size="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Paper>
          )}
        </Stack>
      </Flex>
    </Stack>
  )
}

type BlogSectionAccent = (typeof CATEGORY_STYLES)[string]['color']

const ArticleChapter = ({
  chapter,
  accent,
  index,
  showDivider,
  anchorId,
  sectionIdPrefix,
  onNavigate,
}: {
  chapter: BlogChapter
  accent: BlogSectionAccent
  index: number
  showDivider: boolean
  /** Scroll target for the "On this page" rail when this is one part of a multi-chapter post. */
  anchorId?: string
  /** When set (single-chapter posts), each section below gets `${sectionIdPrefix}${sectionIndex}` as its own scroll target. */
  sectionIdPrefix?: string
  onNavigate: (id: string) => void
}) => (
  <Stack gap={28} id={anchorId}>
    {showDivider && <Divider />}
    {chapter.title && (
      <Stack gap="xs">
        <Group gap="sm" wrap="nowrap">
          <Badge variant="filled" color={accent} radius="sm" size="sm">
            Part {index + 1}
          </Badge>
          <Title order={2} fz={{ base: 20, sm: 26 }} lh={1.25}>
            {chapter.title}
          </Title>
        </Group>
        <Box
          h={3}
          w={64}
          style={{
            borderRadius: 999,
            background: `linear-gradient(90deg, var(--mantine-color-${accent}-5), transparent)`,
          }}
        />
      </Stack>
    )}
    {chapter.sections.map((section, sectionIndex) => (
      <ArticleSection
        key={section.heading}
        section={section}
        accent={accent}
        anchorId={sectionIdPrefix ? `${sectionIdPrefix}${sectionIndex}` : undefined}
        onNavigate={onNavigate}
      />
    ))}
  </Stack>
)

const ArticleSection = ({
  section,
  accent,
  anchorId,
  onNavigate,
}: {
  section: BlogSection
  accent: BlogSectionAccent
  anchorId?: string
  onNavigate: (id: string) => void
}) => {
  const relatedPost = section.relatedPostId
    ? BLOG_POSTS.find((post) => post.id === section.relatedPostId)
    : undefined

  return (
    <Stack gap="sm" id={anchorId}>
      <Group gap={10} wrap="nowrap">
        <Box
          w={7}
          h={7}
          style={{ borderRadius: '50%', background: `var(--mantine-color-${accent}-5)` }}
        />
        <Title order={3} fz={{ base: 17, sm: 20 }} lh={1.3}>
          {section.heading}
        </Title>
      </Group>

      {section.paragraphs?.map((paragraph) => (
        <Text key={paragraph} fz="sm" lh={1.7} maw={820} c="var(--mantine-color-text)">
          {paragraph}
        </Text>
      ))}

      {section.table && (
        <Paper withBorder radius="md" p={0} mt={2} style={{ overflow: 'hidden' }}>
          <ScrollArea type="auto">
            <Table withColumnBorders striped highlightOnHover w="100%">
              <Table.Thead>
                <Table.Tr>
                  {section.table.headers.map((header) => (
                    <Table.Th key={header}>{header}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {section.table.rows.map((row) => (
                  <Table.Tr key={row.join('|')}>
                    {row.map((cell, cellIndex) => (
                      <Table.Td key={cellIndex}>{cell}</Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}

      {section.code?.map((block, blockIndex) => (
        <Paper key={blockIndex} withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {block.label && (
            <Box
              px="sm"
              py={6}
              style={{
                borderBottom: '1px solid var(--core-card-border)',
                background: 'var(--core-surface-1)',
              }}
            >
              <Text size="xs" c="dimmed" fw={600}>
                {block.label}
              </Text>
            </Box>
          )}
          <Code block style={{ border: 'none', borderRadius: 0 }}>
            {block.lines.join('\n')}
          </Code>
        </Paper>
      ))}

      {section.points && section.points.length > 0 && (
        <List
          type={section.ordered ? 'ordered' : 'unordered'}
          spacing="sm"
          size="sm"
          mt={4}
          maw={820}
          withPadding
        >
          {section.points.map((point) => (
            <List.Item key={point.text}>
              {point.term && (
                <Text component="span" fw={700} inherit>
                  {point.term}:{' '}
                </Text>
              )}
              <Text component="span" inherit lh={1.7}>
                {point.text}
              </Text>
            </List.Item>
          ))}
        </List>
      )}

      {section.callout && (
        <Alert
          variant="light"
          color={accent}
          radius="md"
          mt={4}
          maw={820}
          title={section.callout.title}
          icon={<CoreIcon icon={<IconInfoCircle aria-hidden />} size={16} />}
        >
          <Text fz="sm" lh={1.65}>
            {section.callout.text}
          </Text>
        </Alert>
      )}

      {relatedPost && (
        <Anchor
          component="button"
          type="button"
          fz="sm"
          fw={600}
          c={accent}
          onClick={() => onNavigate(relatedPost.id)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {section.relatedLabel ?? `Read: ${relatedPost.title}`}
          <CoreIcon icon={<IconArrowRight aria-hidden />} size={14} />
        </Anchor>
      )}
    </Stack>
  )
}

const SiblingLink = ({
  direction,
  post,
  accent,
  onNavigate,
}: {
  direction: 'previous' | 'next'
  post: BlogPost
  accent: BlogSectionAccent
  onNavigate: (id: string) => void
}) => {
  const isNext = direction === 'next'
  const [hovered, setHovered] = useState(false)

  return (
    <UnstyledButton
      onClick={() => onNavigate(post.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      w="100%"
      h="100%"
      style={{ borderRadius: 'var(--mantine-radius-md)' }}
    >
      <Card
        withBorder
        padding="md"
        radius="md"
        ta={isNext ? 'right' : 'left'}
        style={{
          height: '100%',
          transform: hovered ? 'translateY(-2px)' : 'none',
          borderColor: hovered ? `var(--mantine-color-${accent}-5)` : undefined,
          boxShadow: hovered ? 'var(--mantine-shadow-sm)' : undefined,
          transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        }}
      >
        <Stack gap={6}>
          <Group
            gap={6}
            justify={isNext ? 'flex-end' : 'flex-start'}
            c={hovered ? accent : 'dimmed'}
          >
            {!isNext && <CoreIcon icon={<IconArrowLeft aria-hidden />} size={13} />}
            <Text size="xs" fw={600} tt="uppercase">
              {isNext ? 'Next' : 'Previous'}
            </Text>
            {isNext && <CoreIcon icon={<IconArrowRight aria-hidden />} size={13} />}
          </Group>
          <Text fw={600} fz="sm" c={hovered ? accent : undefined}>
            {post.title}
          </Text>
        </Stack>
      </Card>
    </UnstyledButton>
  )
}
